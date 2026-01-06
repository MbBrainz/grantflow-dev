'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import AsyncButton from '@/components/ui/async-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Save, Send, FlaskConical, CheckCircle2 } from 'lucide-react'
import { createSubmission, getActiveCommittees } from '../actions'
import { useToast } from '@/lib/hooks/use-toast'
import {
  isValidGitHubUrl,
  validateMilestoneAmounts,
} from '@/lib/validation/submission'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Group as _Group } from '@/lib/db/schema'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Users } from 'lucide-react'

// Committee IS the grant program now
interface CommitteeWithBudget {
  id: number
  name: string
  description: string | null
  logoUrl: string | null
  focusAreas: unknown
  fundingAmount: number | null
  minGrantSize: number | null
  maxGrantSize: number | null
}

export default function NewSubmissionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'committee' | 'details'>('committee')
  const [selectedCommittee, setSelectedCommittee] =
    useState<CommitteeWithBudget | null>(null)
  const [committees, setCommittees] = useState<CommitteeWithBudget[]>([])
  const [loadingCommittees, setLoadingCommittees] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    executiveSummary: '',
    postGrantPlan: '',
    githubRepoUrl: '',
    totalAmount: '',
    labels: [] as string[],
    milestones: [
      {
        title: '',
        description: '',
        requirements: '',
        amount: '',
        dueDate: '',
      },
    ],
  })

  const projectLabels = [
    'Infrastructure',
    'Developer Tools',
    'DeFi',
    'NFT/Gaming',
    'Education',
    'Research',
    'Community',
    'UX/UI',
    'Security',
    'Parachain',
    'Smart Contracts',
    'Cross-chain',
  ]

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleMilestoneChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedMilestones = [...formData.milestones]
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value,
    }
    setFormData(prev => ({
      ...prev,
      milestones: updatedMilestones,
    }))
  }

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          title: '',
          description: '',
          requirements: '',
          amount: '',
          dueDate: '',
        },
      ],
    }))
  }

  const removeMilestone = (index: number) => {
    if (formData.milestones.length > 1) {
      const updatedMilestones = formData.milestones.filter(
        (_, i) => i !== index
      )
      setFormData(prev => ({
        ...prev,
        milestones: updatedMilestones,
      }))
    }
  }

  const toggleLabel = (label: string) => {
    const isSelected = formData.labels.includes(label)
    const newLabels = isSelected
      ? formData.labels.filter(l => l !== label)
      : [...formData.labels, label]

    handleInputChange('labels', newLabels)
  }

  const fillTestData = () => {
    setFormData({
      title: 'Decentralized Identity Protocol',
      description:
        'A comprehensive solution for self-sovereign identity management on blockchain, enabling users to control their digital identity with privacy-preserving features.',
      executiveSummary:
        'We propose to build a decentralized identity protocol that allows users to create, manage, and verify their digital identities without relying on centralized authorities. Our solution leverages zero-knowledge proofs for privacy, uses blockchain for immutability, and provides seamless integration with existing Web3 applications. The protocol will support selective disclosure, credential verification, and interoperability across multiple blockchain networks.',
      postGrantPlan:
        'After the grant period, we plan to establish a foundation to maintain the protocol, build partnerships with major Web3 projects for adoption, create a developer community through hackathons and workshops, and explore sustainable revenue models through premium features for enterprise users. We will also pursue additional funding rounds to expand the team and accelerate development.',
      githubRepoUrl: 'https://github.com/mbbrainz/grantflow-dev',
      totalAmount: '150000',
      labels: ['Infrastructure', 'Security', 'Developer Tools'],
      milestones: [
        {
          title: 'Core Protocol Development',
          description:
            'Develop the core identity protocol including smart contracts for identity registration, credential issuance, and verification mechanisms. Implement zero-knowledge proof integration for privacy-preserving identity verification.',
          requirements:
            'Smart contracts deployed on testnet, ZK-proof library integrated, comprehensive test coverage (>90%), security audit completed, technical documentation published',
          amount: '50000',
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        },
        {
          title: 'SDK and Developer Tools',
          description:
            'Build developer-friendly SDKs in JavaScript, Python, and Rust. Create comprehensive documentation, code examples, and integration guides. Set up developer portal with API reference and tutorials.',
          requirements:
            'SDKs published to package managers, developer documentation live, 5+ working code examples, API reference complete, developer portal deployed',
          amount: '40000',
          dueDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        },
        {
          title: 'Mainnet Launch and Ecosystem Integration',
          description:
            'Deploy protocol to mainnet, integrate with major Web3 wallets and dApps, conduct security audits, and launch with initial partner projects. Implement monitoring and analytics dashboard.',
          requirements:
            'Mainnet deployment complete, 3+ wallet integrations, 2 security audits passed, 5+ partner dApps integrated, monitoring dashboard operational, public launch announcement',
          amount: '60000',
          dueDate: new Date(Date.now() + 210 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        },
      ],
    })

    toast({
      title: 'Test Data Loaded',
      description: 'Form filled with sample grant proposal data.',
      variant: 'success',
    })
  }

  const saveDraft = () => {
    try {
      const draftData = {
        ...formData,
        committeeId: selectedCommittee?.id,
      }
      console.log('[new_submission]: Saving draft', draftData)
      localStorage.setItem('grant_draft', JSON.stringify(draftData))

      // Show success toast
      toast({
        title: 'Draft Saved',
        description: 'Your grant proposal has been saved as a draft.',
        variant: 'success',
      })
    } catch (error) {
      console.error('[new_submission]: Error saving draft', error)
      toast({
        title: 'Error',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      })
      throw error // Re-throw so AsyncButton shows error state
    }
  }

  const submitProposal = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      // Validate committee is selected
      if (!selectedCommittee) {
        const errorMessage = 'Please select a committee'
        setError(errorMessage)
        toast({
          title: 'Validation Error',
          description: errorMessage,
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      console.log(
        '[new_submission]: Submitting proposal with detailed logging:',
        {
          committeeId: selectedCommittee.id,
          committeeName: selectedCommittee.name,
          title: formData.title,
          description: `${formData.description?.substring(0, 50)}...`,
          labelsArray: formData.labels,
          labelsLength: formData.labels.length,
          milestonesArray: formData.milestones,
          milestonesLength: formData.milestones.length,
          totalAmount: formData.totalAmount,
        }
      )

      // Validate critical data before sending
      if (!Array.isArray(formData.labels) || formData.labels.length === 0) {
        const errorMessage = 'Please select at least one project category'
        setError(errorMessage)
        toast({
          title: 'Validation Error',
          description: errorMessage,
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }
      if (
        !Array.isArray(formData.milestones) ||
        formData.milestones.length === 0
      ) {
        const errorMessage = 'Please add at least one milestone'
        setError(errorMessage)
        toast({
          title: 'Validation Error',
          description: errorMessage,
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      // Validate GitHub URL format if provided using shared utility
      if (formData.githubRepoUrl && !isValidGitHubUrl(formData.githubRepoUrl)) {
        const errorMessage =
          'GitHub URL must be a valid repository URL (e.g., https://github.com/username/repo)'
        setError(errorMessage)
        toast({
          title: 'Validation Error',
          description: errorMessage,
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      // Validate that milestone amounts sum to total amount using shared utility
      const milestoneAmounts = formData.milestones.map(m => m.amount)
      const validationResult = validateMilestoneAmounts(
        formData.totalAmount,
        milestoneAmounts
      )

      if (!validationResult.isValid) {
        setError(validationResult.error!)
        toast({
          title: 'Validation Error',
          description: validationResult.error,
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      // Create FormData and add fields properly
      const submitFormData = new FormData()

      // Add committee ID (committee IS the grant program now)
      submitFormData.append('committeeId', String(selectedCommittee.id))
      console.log('[new_submission]: Adding committeeId:', selectedCommittee.id)

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'labels') {
          console.log('[new_submission]: Adding labels as JSON:', value)
          submitFormData.append(key, JSON.stringify(value))
        } else if (key === 'milestones') {
          console.log('[new_submission]: Adding milestones as JSON:', value)
          submitFormData.append(key, JSON.stringify(value))
        } else {
          submitFormData.append(
            key,
            typeof value === 'object' ? JSON.stringify(value) : String(value)
          )
        }
      })

      // Log what's actually being sent
      console.log('[new_submission]: FormData entries:')
      for (const [key, value] of submitFormData.entries()) {
        console.log(
          `[new_submission]: ${key}:`,
          typeof value === 'string'
            ? value.substring(0, 100) + (value.length > 100 ? '...' : '')
            : value
        )
      }

      // Call server action
      const result = await createSubmission({}, submitFormData)

      if (result?.error) {
        setError(result.error)
        toast({
          title: 'Submission Failed',
          description: result.error,
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      if (result?.success) {
        console.log(
          '[new_submission]: Submission successful with ID:',
          result.submissionId
        )

        // Remove draft from local storage on successful submission
        localStorage.removeItem('grant_draft')

        // Show success toast
        toast({
          title: 'Proposal Submitted!',
          description:
            'Your grant proposal has been submitted successfully and is now under review.',
          variant: 'success',
        })

        // Keep submitting state true during redirect
        // Redirect to submissions dashboard
        setTimeout(() => {
          router.push('/dashboard/submissions')
        }, 1500)
      } else {
        // Handle unexpected response
        console.error('[new_submission]: Unexpected response:', result)
        setError('Unexpected response from server')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('[new_submission]: Error submitting proposal', error)
      const errorMessage = 'Failed to submit proposal. Please try again.'
      setError(errorMessage)
      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      setIsSubmitting(false)
      throw error // Re-throw so AsyncButton shows error state
    }
  }

  // Load committees on mount
  useEffect(() => {
    async function loadCommittees() {
      try {
        const result = await getActiveCommittees()
        if (result.success && result.committees) {
          setCommittees(result.committees as CommitteeWithBudget[])
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load committees',
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('[new_submission]: Error loading committees', error)
        toast({
          title: 'Error',
          description: 'Failed to load committees',
          variant: 'destructive',
        })
      } finally {
        setLoadingCommittees(false)
      }
    }

    loadCommittees().catch(error => {
      console.error('[new_submission]: Error loading committees', error)
      toast({
        title: 'Error',
        description: 'Failed to load committees',
        variant: 'destructive',
      })
      setLoadingCommittees(false)
    })

    // Load draft
    const draft = localStorage.getItem('grant_draft')
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft) as typeof formData & {
          committeeId?: number
        }
        setFormData(parsedDraft)
      } catch (error) {
        console.error('[new_submission]: Error loading draft', error)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restore selected committee when committees load and draft has committeeId
  useEffect(() => {
    if (committees.length > 0) {
      const draft = localStorage.getItem('grant_draft')
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft) as { committeeId?: number }
          if (parsedDraft.committeeId) {
            const committee = committees.find(
              c => c.id === parsedDraft.committeeId
            )
            if (committee) {
              setSelectedCommittee(committee)
              setStep('details')
            }
          }
        } catch (error) {
          console.error('[new_submission]: Error restoring committee', error)
        }
      }
    }
  }, [committees])

  // Calculate milestone totals for validation
  const milestoneAmounts = formData.milestones.map(m => m.amount)
  const milestoneValidation = validateMilestoneAmounts(
    formData.totalAmount,
    milestoneAmounts
  )
  const milestonesTotal = milestoneValidation.milestonesTotal ?? 0
  const totalAmount = parseFloat(formData.totalAmount) || 0
  const percentage = totalAmount > 0 ? (milestonesTotal / totalAmount) * 100 : 0
  const remainingAmount = totalAmount - milestonesTotal
  const isMilestoneAmountsValid = milestoneValidation.isValid

  // Get missing fields for validation feedback
  const getMissingFields = () => {
    const missing: string[] = []

    if (formData.title.trim().length < 3) {
      missing.push('Project Title (minimum 3 characters)')
    }
    if (formData.description.trim().length < 10) {
      missing.push('Short Description (minimum 10 characters)')
    }
    if (formData.executiveSummary.trim().length < 50) {
      missing.push('Executive Summary (minimum 50 characters)')
    }
    if (formData.postGrantPlan.trim().length < 20) {
      missing.push('Post-Grant Development Plan (minimum 20 characters)')
    }
    if (
      !formData.totalAmount ||
      isNaN(parseFloat(formData.totalAmount)) ||
      parseFloat(formData.totalAmount) <= 0
    ) {
      missing.push('Total Funding Amount (valid positive number)')
    }
    if (formData.labels.length === 0) {
      missing.push('Project Category (select at least one)')
    }
    if (formData.milestones.length === 0) {
      missing.push('Milestones (add at least one)')
    } else {
      formData.milestones.forEach((m, index) => {
        if (m.title.trim().length === 0) {
          missing.push(`Milestone ${index + 1}: Title`)
        }
        if (m.description.trim().length < 10) {
          missing.push(
            `Milestone ${index + 1}: Description (minimum 10 characters)`
          )
        }
        if (m.requirements.trim().length < 5) {
          missing.push(
            `Milestone ${index + 1}: Acceptance Criteria (minimum 5 characters)`
          )
        }
        if (
          !m.amount ||
          isNaN(parseFloat(m.amount)) ||
          parseFloat(m.amount) <= 0
        ) {
          missing.push(
            `Milestone ${index + 1}: Funding Amount (valid positive number)`
          )
        }
        if (!m.dueDate) {
          missing.push(`Milestone ${index + 1}: Due Date`)
        }
      })
    }

    // Add milestone amount validation error if present
    if (
      formData.totalAmount &&
      !isNaN(parseFloat(formData.totalAmount)) &&
      parseFloat(formData.totalAmount) > 0 &&
      !isMilestoneAmountsValid &&
      milestoneValidation.error
    ) {
      missing.push(`Milestone Amounts: ${milestoneValidation.error}`)
    }

    return missing
  }

  // Validation
  const isFormValid =
    formData.title.trim().length >= 3 &&
    formData.description.trim().length >= 10 &&
    formData.executiveSummary.trim().length >= 50 &&
    formData.postGrantPlan.trim().length >= 20 &&
    formData.totalAmount &&
    !isNaN(parseFloat(formData.totalAmount)) &&
    parseFloat(formData.totalAmount) > 0 &&
    formData.labels.length > 0 &&
    formData.milestones.length > 0 &&
    formData.milestones.every(
      m =>
        m.title.trim().length > 0 &&
        m.description.trim().length >= 10 &&
        m.requirements.trim().length >= 5 &&
        m.amount &&
        !isNaN(parseFloat(m.amount)) &&
        parseFloat(m.amount) > 0 &&
        m.dueDate
    ) &&
    isMilestoneAmountsValid

  // Committee selection step (committee IS the grant program now)
  if (step === 'committee') {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">New Grant Submission</h1>
          <p className="text-muted-foreground">
            Step 1: Select a committee to apply to
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Committee</CardTitle>
            <CardDescription>
              Choose the committee you want to submit your grant proposal to
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCommittees ? (
              <div className="text-muted-foreground py-12 text-center">
                Loading committees...
              </div>
            ) : committees.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  No active committees available
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {committees.map(committee => (
                  <button
                    key={committee.id}
                    onClick={() => {
                      setSelectedCommittee(committee)
                      setStep('details')
                    }}
                    className="hover:border-primary hover:bg-muted/50 w-full rounded-lg border p-4 text-left transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {committee.name}
                        </h3>
                        {committee.description && (
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                            {committee.description}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {committee.fundingAmount && (
                            <Badge variant="secondary" className="text-xs">
                              <DollarSign className="mr-1 h-3 w-3" />$
                              {(committee.fundingAmount / 1000).toFixed(0)}k
                              budget
                            </Badge>
                          )}
                          {committee.minGrantSize && committee.maxGrantSize && (
                            <Badge variant="outline" className="text-xs">
                              ${committee.minGrantSize.toLocaleString()} - $
                              {committee.maxGrantSize.toLocaleString()}
                            </Badge>
                          )}
                          {Array.isArray(committee.focusAreas) &&
                            committee.focusAreas
                              .slice(0, 3)
                              .map((area, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {String(area)}
                                </Badge>
                              ))}
                        </div>
                      </div>
                      <Users className="text-muted-foreground h-5 w-5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Details form step
  return (
    <div className="relative mx-auto max-w-4xl space-y-6">
      {/* Submitting Overlay */}
      {isSubmitting && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <Card className="w-[300px]">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                <div className="text-center">
                  <p className="font-medium">Submitting Proposal...</p>
                  <p className="text-muted-foreground text-sm">
                    Please wait while we process your submission
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New Grant Submission</h1>
          <p className="text-muted-foreground">
            Step 2: Complete your grant proposal
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fillTestData}
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <FlaskConical className="mr-2 h-4 w-4" />
          Fill Test Data
        </Button>
      </div>

      {/* Selected Committee Banner */}
      {selectedCommittee && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="text-primary h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Applying to: {selectedCommittee.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {selectedCommittee.fundingAmount && (
                  <span>
                    ${(selectedCommittee.fundingAmount / 1000).toFixed(0)}k
                    budget available
                  </span>
                )}
                {selectedCommittee.minGrantSize &&
                  selectedCommittee.maxGrantSize && (
                    <span className="ml-2">
                      • Grant range: $
                      {selectedCommittee.minGrantSize.toLocaleString()} - $
                      {selectedCommittee.maxGrantSize.toLocaleString()}
                    </span>
                  )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide basic details about your grant proposal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="Enter your project title"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description *</Label>
              <textarea
                id="description"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Brief description of your project (max 500 characters)"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                maxLength={500}
                required
              />
              <p className="text-muted-foreground text-xs">
                {formData.description.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Funding Amount (USD) *</Label>
              <Input
                id="totalAmount"
                type="number"
                placeholder="Enter total funding amount"
                value={formData.totalAmount}
                onChange={e => handleInputChange('totalAmount', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubRepoUrl">GitHub Repository URL</Label>
              <Input
                id="githubRepoUrl"
                type="url"
                placeholder="https://github.com/username/repo"
                value={formData.githubRepoUrl}
                onChange={e =>
                  handleInputChange('githubRepoUrl', e.target.value)
                }
              />
              <p className="text-muted-foreground text-xs">
                Link to your project repository (if available)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Project Labels */}
        <Card>
          <CardHeader>
            <CardTitle>Project Category</CardTitle>
            <CardDescription>
              Select categories that best describe your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {projectLabels.map(label => (
                <Button
                  key={label}
                  variant={
                    formData.labels.includes(label) ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => toggleLabel(label)}
                  type="button"
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary *</CardTitle>
            <CardDescription>
              Explain what your project will build and how it benefits the
              ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[200px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Provide a comprehensive overview of your project, its goals, and expected impact..."
              value={formData.executiveSummary}
              onChange={e =>
                handleInputChange('executiveSummary', e.target.value)
              }
              required
            />
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Milestones *</CardTitle>
            <CardDescription>
              Break down your project into specific milestones with requirements
              and funding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Milestone Amount Summary */}
            {formData.totalAmount &&
              !isNaN(parseFloat(formData.totalAmount)) &&
              parseFloat(formData.totalAmount) > 0 && (
                <div
                  className={`rounded-lg border p-4 ${
                    !isMilestoneAmountsValid
                      ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                      : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Milestone Total:
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          !isMilestoneAmountsValid
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-green-700 dark:text-green-400'
                        }`}
                      >
                        $
                        {milestonesTotal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        / $
                        {totalAmount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    {!isMilestoneAmountsValid && (
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {milestoneValidation.error}
                      </p>
                    )}
                    {isMilestoneAmountsValid && (
                      <p className="text-sm text-green-700 dark:text-green-400">
                        ✓ Milestone amounts match total funding amount
                      </p>
                    )}
                    {remainingAmount !== 0 && (
                      <p
                        className={`text-xs ${
                          remainingAmount > 0
                            ? 'text-muted-foreground'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {remainingAmount > 0
                          ? `Remaining: $${remainingAmount.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}`
                          : `Exceeds by: $${Math.abs(
                              remainingAmount
                            ).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`}
                      </p>
                    )}
                    {/* Milestone Breakdown */}
                    {formData.milestones.length > 0 && (
                      <div className="mt-3 space-y-1 border-t pt-2">
                        <p className="text-muted-foreground text-xs font-medium">
                          Breakdown:
                        </p>
                        <div className="space-y-1">
                          {formData.milestones.map((milestone, index) => {
                            const amount = parseFloat(milestone.amount) || 0
                            const milestonePercentage =
                              totalAmount > 0 ? (amount / totalAmount) * 100 : 0
                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-muted-foreground">
                                  Milestone {index + 1}:{' '}
                                  {milestone.title || 'Untitled'}
                                </span>
                                <span className="font-medium">
                                  $
                                  {amount.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{' '}
                                  ({milestonePercentage.toFixed(1)}%)
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            {formData.milestones.map((milestone, index) => (
              <div key={index} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Milestone {index + 1}</h4>
                  {formData.milestones.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                      type="button"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`milestone-title-${index}`}>
                      Milestone Title *
                    </Label>
                    <Input
                      id={`milestone-title-${index}`}
                      placeholder="e.g., MVP Development"
                      value={milestone.title}
                      onChange={e =>
                        handleMilestoneChange(index, 'title', e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`milestone-description-${index}`}>
                      Description *
                    </Label>
                    <textarea
                      id={`milestone-description-${index}`}
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Describe what will be accomplished in this milestone"
                      value={milestone.description}
                      onChange={e =>
                        handleMilestoneChange(
                          index,
                          'description',
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`milestone-requirements-${index}`}>
                      Acceptance Criteria *
                    </Label>
                    <textarea
                      id={`milestone-requirements-${index}`}
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="List specific requirements that must be met to complete this milestone"
                      value={milestone.requirements}
                      onChange={e =>
                        handleMilestoneChange(
                          index,
                          'requirements',
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`milestone-amount-${index}`}>
                        Funding Amount (USD) *
                      </Label>
                      <Input
                        id={`milestone-amount-${index}`}
                        type="number"
                        placeholder="0"
                        value={milestone.amount}
                        onChange={e =>
                          handleMilestoneChange(index, 'amount', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`milestone-dueDate-${index}`}>
                        Due Date
                      </Label>
                      <Input
                        id={`milestone-dueDate-${index}`}
                        type="date"
                        value={milestone.dueDate}
                        onChange={e =>
                          handleMilestoneChange(
                            index,
                            'dueDate',
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addMilestone}
              type="button"
              className="w-full"
            >
              Add Another Milestone
            </Button>

            {/* Calculated Total Milestone Amount - Read Only */}
            <div className="space-y-2">
              <Label htmlFor="milestone-total-calculated">
                Total Milestone Amount (Calculated) *
              </Label>
              <div className="relative">
                <Input
                  id="milestone-total-calculated"
                  type="text"
                  value={`$${milestonesTotal.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                  readOnly
                  className={`bg-muted cursor-not-allowed ${
                    !isMilestoneAmountsValid
                      ? 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-400'
                      : milestonesTotal > 0
                        ? 'border-green-300 text-green-700 dark:border-green-800 dark:text-green-400'
                        : ''
                  }`}
                  aria-label="Total milestone amount (automatically calculated)"
                />
                <div className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                  {totalAmount > 0 && (
                    <span
                      className={
                        !isMilestoneAmountsValid
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }
                    >
                      {percentage.toFixed(1)}% of grant
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                {totalAmount > 0 && (
                  <p
                    className={`text-xs ${
                      !isMilestoneAmountsValid
                        ? 'text-red-600 dark:text-red-400'
                        : isMilestoneAmountsValid
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {!isMilestoneAmountsValid ? (
                      <>
                        <span className="font-medium">⚠️ Warning:</span>{' '}
                        {milestoneValidation.error}
                      </>
                    ) : remainingAmount === 0 ? (
                      <>
                        <span className="font-medium">✓ Valid:</span> Milestone
                        amounts match total funding amount
                      </>
                    ) : remainingAmount > 0 ? (
                      <>
                        <span className="font-medium">ℹ️ Info:</span> $
                        {remainingAmount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        remaining to allocate
                      </>
                    ) : (
                      <>
                        <span className="font-medium">⚠️ Warning:</span> Exceeds
                        by $
                        {Math.abs(remainingAmount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </>
                    )}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  This amount is automatically calculated from individual
                  milestone amounts above
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Post-Grant Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Post-Grant Development Plan *</CardTitle>
            <CardDescription>
              Describe how the project will continue after the grant period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[150px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Explain your sustainability plans, ongoing development, community building, or future funding strategies..."
              value={formData.postGrantPlan}
              onChange={e => handleInputChange('postGrantPlan', e.target.value)}
              required
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <AsyncButton
            variant="outline"
            onClick={saveDraft}
            disabled={isSubmitting}
            loadingContent={
              <>
                <Save className="mr-2 h-4 w-4" />
                Saving...
              </>
            }
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </AsyncButton>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <AsyncButton
                  onClick={submitProposal}
                  disabled={!isFormValid || isSubmitting}
                  className="bg-green-600 text-white hover:bg-green-700"
                  loadingContent={
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submitting...
                    </>
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Proposal
                </AsyncButton>
              </span>
            </TooltipTrigger>
            {!isFormValid && !isSubmitting && (
              <TooltipContent className="max-w-sm">
                <div className="space-y-1">
                  <p className="font-semibold">Missing required fields:</p>
                  <ul className="list-disc pl-4 text-sm">
                    {getMissingFields().map((field, index) => (
                      <li key={index}>{field}</li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
