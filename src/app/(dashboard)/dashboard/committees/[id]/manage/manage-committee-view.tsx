'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Settings,
  Users,
  Plus,
  Trash2,
  Shield,
  AlertCircle,
  DollarSign,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CommitteeWithDetails } from '@/lib/db/queries/committees'
import Image from 'next/image'
import {
  updateCommitteeInfo,
  addCommitteeMember,
  removeCommitteeMember,
  updateMemberRole,
  searchUsersAction,
  createGrantProgramAction,
  updateGrantProgramAction,
  toggleGrantProgramAction,
} from '../actions'
import { useToast } from '@/lib/hooks/use-toast'
import { AsyncButton } from '@/components/ui/async-button'
import { GrantProgramCard } from '@/components/committee/grant-program-card'

interface ProgramFinancials {
  programId: number
  totalBudget: number
  allocated: number
  spent: number
  remaining: number
  available: number
}

interface ManageCommitteeViewProps {
  committee: NonNullable<CommitteeWithDetails>
  financialsMap: Map<number | undefined, ProgramFinancials | null | undefined>
}

export function ManageCommitteeView({
  committee,
  financialsMap,
}: ManageCommitteeViewProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Committee Info State
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [name, setName] = useState(committee.name)
  const [description, setDescription] = useState(committee.description ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(committee.websiteUrl ?? '')
  const [githubOrg, setGithubOrg] = useState(committee.githubOrg ?? '')
  const [focusAreasText, setFocusAreasText] = useState(
    Array.isArray(committee.focusAreas) ? committee.focusAreas.join(', ') : ''
  )

  // Add Member State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    {
      id: number
      name: string | null
      email: string | null
      avatarUrl: string | null
      primaryRole: string | null
    }[]
  >([])
  const [selectedUserEmail, setSelectedUserEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>(
    'member'
  )
  const [isSearching, setIsSearching] = useState(false)

  // Grant Program State
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false)
  const [editingProgramId, setEditingProgramId] = useState<number | null>(null)
  const [programName, setProgramName] = useState('')
  const [programDescription, setProgramDescription] = useState('')
  const [programFundingAmount, setProgramFundingAmount] = useState('')
  const [programMinGrantSize, setProgramMinGrantSize] = useState('')
  const [programMaxGrantSize, setProgramMaxGrantSize] = useState('')
  const [programMinMilestoneSize, setProgramMinMilestoneSize] = useState('')
  const [programMaxMilestoneSize, setProgramMaxMilestoneSize] = useState('')
  const [showInactivePrograms, setShowInactivePrograms] = useState(true)

  // Multisig Configuration State
  const [isEditingMultisig, setIsEditingMultisig] = useState(false)
  const [multisigAddress, setMultisigAddress] = useState(committee.multisigAddress ?? '')
  const [multisigThreshold, setMultisigThreshold] = useState(committee.multisigThreshold ?? 2)
  const [multisigSignatories, setMultisigSignatories] = useState<string[]>(
    (committee.multisigSignatories as string[]) ?? []
  )
  const [multisigApprovalPattern, setMultisigApprovalPattern] = useState<'combined' | 'separated'>(
    committee.multisigApprovalPattern ?? 'combined'
  )
  const [newSignatory, setNewSignatory] = useState('')

  const handleUpdateInfo = async () => {
    const focusAreasArray = focusAreasText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const result = await updateCommitteeInfo({
      committeeId: committee.id,
      name,
      description,
      websiteUrl: websiteUrl || undefined,
      githubOrg: githubOrg || undefined,
      focusAreas: focusAreasArray.length > 0 ? focusAreasArray : undefined,
    })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Committee information updated successfully',
      })
      setIsEditingInfo(false)
      router.refresh()
    }
  }

  const handleUpdateMultisig = async () => {
    // Validate inputs
    if (multisigAddress && multisigSignatories.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one signatory address',
        variant: 'destructive',
      })
      return
    }

    if (multisigThreshold > multisigSignatories.length) {
      toast({
        title: 'Error',
        description: 'Threshold cannot exceed number of signatories',
        variant: 'destructive',
      })
      return
    }

    // Import the write function
    const { updateCommitteeMultisigConfig } = await import('@/lib/db/writes/multisig')

    try {
      await updateCommitteeMultisigConfig(committee.id, {
        multisigAddress: multisigAddress || undefined,
        multisigThreshold,
        multisigSignatories,
        multisigApprovalPattern,
      })

      toast({
        title: 'Success',
        description: 'Multisig configuration updated successfully',
      })
      setIsEditingMultisig(false)
      router.refresh()
    } catch (error) {
      console.error('[handleUpdateMultisig]: Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to update multisig configuration',
        variant: 'destructive',
      })
    }
  }

  const handleAddSignatory = () => {
    if (!newSignatory.trim()) return

    // Basic validation for Polkadot address (starts with 1-5, 47-48 chars)
    if (!/^[1-5][a-km-zA-HJ-NP-Z1-9]{46,47}$/.test(newSignatory.trim())) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Polkadot SS58 address',
        variant: 'destructive',
      })
      return
    }

    if (multisigSignatories.includes(newSignatory.trim())) {
      toast({
        title: 'Duplicate Address',
        description: 'This address is already in the signatory list',
        variant: 'destructive',
      })
      return
    }

    setMultisigSignatories([...multisigSignatories, newSignatory.trim()])
    setNewSignatory('')
  }

  const handleRemoveSignatory = (address: string) => {
    setMultisigSignatories(multisigSignatories.filter(addr => addr !== address))
  }

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const result = await searchUsersAction({ query: searchQuery })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else if ('data' in result && result.data) {
      setSearchResults(result.data)
    }
    setIsSearching(false)
  }

  const handleAddMember = async () => {
    if (!selectedUserEmail) {
      toast({
        title: 'Error',
        description: 'Please select a user to add',
        variant: 'destructive',
      })
      return
    }

    const result = await addCommitteeMember({
      committeeId: committee.id,
      userEmail: selectedUserEmail,
      role: newMemberRole,
    })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      const userName = 'data' in result ? result.data?.userName : undefined
      toast({
        title: 'Success',
        description: `${userName ?? 'User'} added as ${newMemberRole}`,
      })
      setIsAddMemberOpen(false)
      setSearchQuery('')
      setSearchResults([])
      setSelectedUserEmail('')
      setNewMemberRole('member')
      router.refresh()
    }
  }

  const handleRemoveMember = async (
    userId: number,
    userName: string | null
  ) => {
    if (
      !confirm(
        `Are you sure you want to remove ${userName ?? 'this member'} from the committee?`
      )
    ) {
      return
    }

    const result = await removeCommitteeMember({
      committeeId: committee.id,
      userId,
    })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: `${userName} removed from committee`,
      })
      router.refresh()
    }
  }

  const handleUpdateRole = async (
    userId: number,
    newRole: 'admin' | 'member',
    userName: string | null
  ) => {
    const result = await updateMemberRole({
      committeeId: committee.id,
      userId,
      role: newRole,
    })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: `${userName}'s role updated to ${newRole}`,
      })
      router.refresh()
    }
  }

  const handleCreateProgram = async () => {
    if (!programName.trim()) {
      toast({
        title: 'Error',
        description: 'Program name is required',
        variant: 'destructive',
      })
      return
    }

    const result = await createGrantProgramAction({
      committeeId: committee.id,
      name: programName,
      description: programDescription,
      fundingAmount: programFundingAmount
        ? parseFloat(programFundingAmount)
        : undefined,
      minGrantSize: programMinGrantSize
        ? parseFloat(programMinGrantSize)
        : undefined,
      maxGrantSize: programMaxGrantSize
        ? parseFloat(programMaxGrantSize)
        : undefined,
      minMilestoneSize: programMinMilestoneSize
        ? parseFloat(programMinMilestoneSize)
        : undefined,
      maxMilestoneSize: programMaxMilestoneSize
        ? parseFloat(programMaxMilestoneSize)
        : undefined,
    })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Grant program created successfully',
      })
      setIsAddProgramOpen(false)
      setProgramName('')
      setProgramDescription('')
      setProgramFundingAmount('')
      setProgramMinGrantSize('')
      setProgramMaxGrantSize('')
      setProgramMinMilestoneSize('')
      setProgramMaxMilestoneSize('')
      router.refresh()
    }
  }

  const handleUpdateProgram = async (programId: number) => {
    if (!programName.trim()) {
      toast({
        title: 'Error',
        description: 'Program name is required',
        variant: 'destructive',
      })
      return
    }

    const result = await updateGrantProgramAction({
      committeeId: committee.id,
      programId,
      name: programName,
      description: programDescription,
      fundingAmount: programFundingAmount
        ? parseFloat(programFundingAmount)
        : undefined,
      minGrantSize: programMinGrantSize
        ? parseFloat(programMinGrantSize)
        : undefined,
      maxGrantSize: programMaxGrantSize
        ? parseFloat(programMaxGrantSize)
        : undefined,
      minMilestoneSize: programMinMilestoneSize
        ? parseFloat(programMinMilestoneSize)
        : undefined,
      maxMilestoneSize: programMaxMilestoneSize
        ? parseFloat(programMaxMilestoneSize)
        : undefined,
    })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Grant program updated successfully',
      })
      setEditingProgramId(null)
      setProgramName('')
      setProgramDescription('')
      setProgramFundingAmount('')
      setProgramMinGrantSize('')
      setProgramMaxGrantSize('')
      setProgramMinMilestoneSize('')
      setProgramMaxMilestoneSize('')
      router.refresh()
    }
  }

  const handleToggleProgramStatus = async (
    programId: number,
    currentStatus: boolean,
    programName: string
  ) => {
    const newStatus = !currentStatus
    const result = await toggleGrantProgramAction({
      committeeId: committee.id,
      programId,
      isActive: newStatus,
    })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: `${programName} ${newStatus ? 'activated' : 'deactivated'}`,
      })
      router.refresh()
    }
  }

  const startEditingProgram = (
    program: NonNullable<CommitteeWithDetails>['grantPrograms'][number]
  ) => {
    setEditingProgramId(program.id)
    setProgramName(program.name)
    setProgramDescription(program.description ?? '')
    setProgramFundingAmount(
      program.fundingAmount ? program.fundingAmount.toString() : ''
    )
    setProgramMinGrantSize(
      program.minGrantSize ? program.minGrantSize.toString() : ''
    )
    setProgramMaxGrantSize(
      program.maxGrantSize ? program.maxGrantSize.toString() : ''
    )
    setProgramMinMilestoneSize(
      program.minMilestoneSize ? program.minMilestoneSize.toString() : ''
    )
    setProgramMaxMilestoneSize(
      program.maxMilestoneSize ? program.maxMilestoneSize.toString() : ''
    )
  }

  const cancelEditingProgram = () => {
    setEditingProgramId(null)
    setProgramName('')
    setProgramDescription('')
    setProgramFundingAmount('')
    setProgramMinGrantSize('')
    setProgramMaxGrantSize('')
    setProgramMinMilestoneSize('')
    setProgramMaxMilestoneSize('')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/committees/${committee.id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Committee
          </Button>

          <div>
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-gray-600" />
              <div>
                <h1 className="text-3xl font-bold">Manage Committee</h1>
                <p className="text-gray-600">{committee.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Committee Information */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Committee Information</h2>
          {!isEditingInfo ? (
            <Button onClick={() => setIsEditingInfo(true)} size="sm">
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsEditingInfo(false)
                  setName(committee.name)
                  setDescription(committee.description ?? '')
                  setWebsiteUrl(committee.websiteUrl ?? '')
                  setGithubOrg(committee.githubOrg ?? '')
                  setFocusAreasText(
                    Array.isArray(committee.focusAreas)
                      ? committee.focusAreas.join(', ')
                      : ''
                  )
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <AsyncButton onClick={handleUpdateInfo}>Save Changes</AsyncButton>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!isEditingInfo}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!isEditingInfo}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              disabled={!isEditingInfo}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <Label htmlFor="githubOrg">GitHub Organization</Label>
            <Input
              id="githubOrg"
              value={githubOrg}
              onChange={e => setGithubOrg(e.target.value)}
              disabled={!isEditingInfo}
              placeholder="my-organization"
            />
          </div>

          <div>
            <Label htmlFor="focusAreas">Focus Areas (comma-separated)</Label>
            <Input
              id="focusAreas"
              value={focusAreasText}
              onChange={e => setFocusAreasText(e.target.value)}
              disabled={!isEditingInfo}
              placeholder="DeFi, NFTs, Infrastructure"
            />
          </div>
        </div>
      </Card>

      {/* Members Management */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Members</h2>
            <Badge variant="secondary">{committee.members?.length || 0}</Badge>
          </div>
          <Button
            onClick={() => setIsAddMemberOpen(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>

        <div className="space-y-3">
          {committee.members && committee.members.length > 0 ? (
            committee.members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {member.user.avatarUrl && (
                    <Image
                      src={member.user.avatarUrl}
                      alt={member.user.name ?? ''}
                      className="h-10 w-10 rounded-full"
                      width={40}
                      height={40}
                    />
                  )}
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-sm text-gray-600">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    onChange={e => {
                      void handleUpdateRole(
                        member.user.id,
                        e.target.value as 'admin' | 'member',
                        member.user.name
                      )
                    }}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleRemoveMember(member.user.id, member.user.name)
                    }
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No members yet</p>
          )}
        </div>
      </Card>

      {/* Grant Programs */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Grant Programs</h2>
            <Badge variant="secondary">
              {committee.grantPrograms?.filter(p => p.isActive).length ?? 0}{' '}
              active
            </Badge>
            {committee.grantPrograms?.some(p => !p.isActive) && (
              <Badge variant="outline">
                {committee.grantPrograms?.filter(p => !p.isActive).length ?? 0}{' '}
                inactive
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {committee.grantPrograms?.some(p => !p.isActive) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInactivePrograms(!showInactivePrograms)}
              >
                {showInactivePrograms ? 'Hide Inactive' : 'Show Inactive'}
              </Button>
            )}
            <Button
              onClick={() => setIsAddProgramOpen(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Program
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {committee.grantPrograms && committee.grantPrograms.length > 0 ? (
            committee.grantPrograms
              .filter(program => showInactivePrograms || program.isActive)
              .map(program => (
                <GrantProgramCard
                  key={program.id}
                  program={program}
                  financials={financialsMap.get(program.id) ?? null}
                  isEditing={editingProgramId === program.id}
                  showAdminActions={true}
                  editState={
                    editingProgramId === program.id
                      ? {
                          name: programName,
                          description: programDescription,
                          fundingAmount: programFundingAmount,
                          minGrantSize: programMinGrantSize,
                          maxGrantSize: programMaxGrantSize,
                          minMilestoneSize: programMinMilestoneSize,
                          maxMilestoneSize: programMaxMilestoneSize,
                          onNameChange: setProgramName,
                          onDescriptionChange: setProgramDescription,
                          onFundingAmountChange: setProgramFundingAmount,
                          onMinGrantSizeChange: setProgramMinGrantSize,
                          onMaxGrantSizeChange: setProgramMaxGrantSize,
                          onMinMilestoneSizeChange: setProgramMinMilestoneSize,
                          onMaxMilestoneSizeChange: setProgramMaxMilestoneSize,
                        }
                      : undefined
                  }
                  onEdit={() => startEditingProgram(program)}
                  onSave={() => handleUpdateProgram(program.id)}
                  onCancel={cancelEditingProgram}
                  onToggleStatus={() =>
                    handleToggleProgramStatus(
                      program.id,
                      program.isActive,
                      program.name
                    )
                  }
                />
              ))
          ) : (
            <p className="text-center text-gray-500">
              {committee.grantPrograms && committee.grantPrograms.length > 0
                ? 'No active programs. Click "Show Inactive" to see deactivated programs.'
                : 'No grant programs yet'}
            </p>
          )}
        </div>
      </Card>

      {/* Multisig Configuration */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Multisig Account</h2>
            {committee.multisigAddress && (
              <Badge variant="default">Configured</Badge>
            )}
          </div>
          {!isEditingMultisig && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingMultisig(true)}
            >
              {committee.multisigAddress ? 'Edit Configuration' : 'Configure Multisig'}
            </Button>
          )}
        </div>

        {isEditingMultisig ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Important:</strong> Multisig addresses should be created externally 
                (e.g., via PolkadotJS Apps) and imported here. Never generate private keys in the web app.
              </p>
            </div>

            <div>
              <Label htmlFor="multisigAddress">Multisig Address (Optional)</Label>
              <Input
                id="multisigAddress"
                value={multisigAddress}
                onChange={e => setMultisigAddress(e.target.value)}
                placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
              />
              <p className="mt-1 text-xs text-gray-500">
                SS58 format Polkadot address for the multisig account
              </p>
            </div>

            <div>
              <Label>Signatories ({multisigSignatories.length})</Label>
              <div className="mt-2 space-y-2">
                {multisigSignatories.map((address, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded border bg-white p-2"
                  >
                    <code className="text-xs">{address}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSignatory(address)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  value={newSignatory}
                  onChange={e => setNewSignatory(e.target.value)}
                  placeholder="Add signatory address"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSignatory()
                    }
                  }}
                />
                <Button onClick={handleAddSignatory} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="multisigThreshold">
                Approval Threshold ({multisigThreshold})
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="multisigThreshold"
                  type="number"
                  min="1"
                  max={multisigSignatories.length || 10}
                  value={multisigThreshold}
                  onChange={e => setMultisigThreshold(parseInt(e.target.value) || 2)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">
                  of {multisigSignatories.length} signatories required
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Number of signatures required to execute a transaction
              </p>
            </div>

            <div>
              <Label>Approval Pattern</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-start gap-3 rounded border p-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="approvalPattern"
                    value="combined"
                    checked={multisigApprovalPattern === 'combined'}
                    onChange={e => setMultisigApprovalPattern(e.target.value as 'combined')}
                    className="mt-1"
                  />
                  <div>
                    <strong className="text-sm">Combined Approval & Payment</strong>
                    <p className="text-xs text-gray-600">
                      Milestone approval automatically triggers payment when threshold is met.
                      Faster execution, atomic transaction.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 rounded border p-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="approvalPattern"
                    value="separated"
                    checked={multisigApprovalPattern === 'separated'}
                    onChange={e => setMultisigApprovalPattern(e.target.value as 'separated')}
                    className="mt-1"
                  />
                  <div>
                    <strong className="text-sm">Separated Approval then Payment</strong>
                    <p className="text-xs text-gray-600">
                      Approval recorded first, payment requires separate authorization.
                      More control, explicit payment execution.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <AsyncButton onClick={handleUpdateMultisig} className="flex-1">
                Save Configuration
              </AsyncButton>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingMultisig(false)
                  // Reset to original values
                  setMultisigAddress(committee.multisigAddress ?? '')
                  setMultisigThreshold(committee.multisigThreshold ?? 2)
                  setMultisigSignatories((committee.multisigSignatories as string[]) ?? [])
                  setMultisigApprovalPattern(committee.multisigApprovalPattern ?? 'combined')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {committee.multisigAddress ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Multisig Address</Label>
                    <code className="block text-sm">{committee.multisigAddress}</code>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Approval Pattern</Label>
                    <p className="text-sm capitalize">
                      {committee.multisigApprovalPattern?.replace('_', ' ') ?? 'Combined'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Threshold</Label>
                    <p className="text-sm">
                      {committee.multisigThreshold} of{' '}
                      {(committee.multisigSignatories as string[] ?? []).length} signatories
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Signatories</Label>
                    <p className="text-sm">
                      {(committee.multisigSignatories as string[] ?? []).length} configured
                    </p>
                  </div>
                </div>
                {(committee.multisigSignatories as string[] ?? []).length > 0 && (
                  <div>
                    <Label className="text-sm text-gray-500">Signatory List</Label>
                    <div className="mt-2 space-y-1">
                      {(committee.multisigSignatories as string[] ?? []).map((addr, idx) => (
                        <code key={idx} className="block text-xs text-gray-700">
                          {addr}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <AlertCircle className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-700">
                  No Multisig Configured
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  Configure your committee&apos;s multisig account for secure,
                  on-chain grant payouts with committee approval.
                </p>
                <Button onClick={() => setIsEditingMultisig(true)}>
                  Configure Multisig
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader onClose={() => setIsAddMemberOpen(false)}>
            <DialogTitle>Add Committee Member</DialogTitle>
            <DialogDescription>
              Search for a user by email or name to add them to the committee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Enter email or name..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      void handleSearchUsers()
                    }
                  }}
                />
                <Button
                  onClick={handleSearchUsers}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserEmail(user.email ?? '')}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      selectedUserEmail === user.email
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {user.avatarUrl && (
                        <Image
                          src={user.avatarUrl}
                          alt={user.name ?? ''}
                          className="h-8 w-8 rounded-full"
                          width={32}
                          height={32}
                        />
                      )}
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={newMemberRole}
                onChange={e =>
                  setNewMemberRole(e.target.value as 'admin' | 'member')
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddMemberOpen(false)
                setSearchQuery('')
                setSearchResults([])
                setSelectedUserEmail('')
                setNewMemberRole('member')
              }}
            >
              Cancel
            </Button>
            <AsyncButton
              onClick={handleAddMember}
              disabled={!selectedUserEmail}
            >
              Add Member
            </AsyncButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Grant Program Dialog */}
      <Dialog open={isAddProgramOpen} onOpenChange={setIsAddProgramOpen}>
        <DialogContent>
          <DialogHeader onClose={() => setIsAddProgramOpen(false)}>
            <DialogTitle>Create Grant Program</DialogTitle>
            <DialogDescription>
              Create a new grant program for your committee. You can edit it
              later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-program-name">Program Name</Label>
              <Input
                id="new-program-name"
                value={programName}
                onChange={e => setProgramName(e.target.value)}
                placeholder="Developer Grants 2025"
              />
            </div>

            <div>
              <Label htmlFor="new-program-description">Description</Label>
              <Textarea
                id="new-program-description"
                value={programDescription}
                onChange={e => setProgramDescription(e.target.value)}
                placeholder="Support innovative projects building on our platform..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="new-program-funding">
                Total Program Budget (USD)
              </Label>
              <Input
                id="new-program-funding"
                type="number"
                min="0"
                step="1000"
                value={programFundingAmount}
                onChange={e => setProgramFundingAmount(e.target.value)}
                placeholder="100000"
              />
              <p className="mt-1 text-xs text-gray-500">
                Total budget available for this program
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-program-min-grant">
                  Min Grant per Submission (USD)
                </Label>
                <Input
                  id="new-program-min-grant"
                  type="number"
                  min="0"
                  step="100"
                  value={programMinGrantSize}
                  onChange={e => setProgramMinGrantSize(e.target.value)}
                  placeholder="1000"
                />
              </div>
              <div>
                <Label htmlFor="new-program-max-grant">
                  Max Grant per Submission (USD)
                </Label>
                <Input
                  id="new-program-max-grant"
                  type="number"
                  min="0"
                  step="100"
                  value={programMaxGrantSize}
                  onChange={e => setProgramMaxGrantSize(e.target.value)}
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-program-min-milestone">
                  Min per Milestone (USD)
                </Label>
                <Input
                  id="new-program-min-milestone"
                  type="number"
                  min="0"
                  step="100"
                  value={programMinMilestoneSize}
                  onChange={e => setProgramMinMilestoneSize(e.target.value)}
                  placeholder="500"
                />
              </div>
              <div>
                <Label htmlFor="new-program-max-milestone">
                  Max per Milestone (USD)
                </Label>
                <Input
                  id="new-program-max-milestone"
                  type="number"
                  min="0"
                  step="100"
                  value={programMaxMilestoneSize}
                  onChange={e => setProgramMaxMilestoneSize(e.target.value)}
                  placeholder="5000"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddProgramOpen(false)
                setProgramName('')
                setProgramDescription('')
                setProgramFundingAmount('')
                setProgramMinGrantSize('')
                setProgramMaxGrantSize('')
                setProgramMinMilestoneSize('')
                setProgramMaxMilestoneSize('')
              }}
            >
              Cancel
            </Button>
            <AsyncButton
              onClick={handleCreateProgram}
              disabled={!programName.trim()}
            >
              Create Program
            </AsyncButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
