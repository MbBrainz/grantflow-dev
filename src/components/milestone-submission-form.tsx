'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import AsyncButton from '@/components/ui/async-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Removed checkbox import - will use HTML input instead
import {
  Target,
  Github,
  GitCommit,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  FileText,
} from 'lucide-react'
import type { GitHubCommit } from '@/lib/github/simple-client'
import {
  getCommitsSince,
} from '@/lib/github/simple-client'
import type { Milestone } from '@/lib/db/schema'

// Use GitHubCommit type from simple-client
type Commit = GitHubCommit

interface MilestoneSubmissionFormProps {
  milestone: Pick<Milestone, 'id' | 'title' | 'description' | 'requirements' | 'amount' | 'dueDate' | 'status' | 'deliverables' | 'githubRepoUrl' | 'githubCommitHash'>
  submissionRepoUrl: string | null
  previousMilestoneCommitSha?: string | null // Last approved milestone commit
  onSubmit: (data: {
    milestoneId: number
    selectedCommits: string[]
    deliverables: string
    githubCommitHashes: string[]
  }) => Promise<void>
  onCancel: () => void
}

export function MilestoneSubmissionForm({
  milestone,
  submissionRepoUrl,
  previousMilestoneCommitSha,
  onSubmit,
  onCancel,
}: MilestoneSubmissionFormProps) {
  const [commits, setCommits] = useState<Commit[]>([])
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set())
  const [deliverables, setDeliverables] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Parse requirements from milestone
  const requirements = milestone.requirements ?? ['Complete milestone objectives']

  useEffect(() => {
    async function fetchCommits() {
      if (!submissionRepoUrl) {
        setError('No GitHub repository URL found for this submission')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        let fetchedCommits: Commit[] | null = null

        // Fetch commits since the last milestone completion, or all commits if first milestone
        console.log('[MilestoneSubmissionForm]: Fetching commits', {
          sinceCommit: previousMilestoneCommitSha ?? 'none (first milestone)',
        })
        fetchedCommits = await getCommitsSince(
          submissionRepoUrl,
          previousMilestoneCommitSha ?? undefined
        )

        if (fetchedCommits) {
          setCommits(fetchedCommits)

          // Auto-select all commits by default (as per requirement)
          const autoSelected = new Set(fetchedCommits.map(commit => commit.sha))
          setSelectedCommits(autoSelected)

          console.log('[MilestoneSubmissionForm]: Auto-selected commits', {
            count: autoSelected.size,
            commits: Array.from(autoSelected).map(sha => sha.substring(0, 7)),
          })
        } else {
          setError('Failed to fetch commits from GitHub repository')
        }
      } catch (err) {
        console.error('[MilestoneSubmissionForm]: Error fetching commits', err)
        setError('Failed to fetch commits from GitHub repository')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommits().catch(err => {
      console.error('[MilestoneSubmissionForm]: Error fetching commits', err)
      setError('Failed to fetch commits from GitHub repository')
    })
  }, [submissionRepoUrl, previousMilestoneCommitSha])

  const handleCommitToggle = (commitSha: string) => {
    const newSelected = new Set(selectedCommits)
    if (newSelected.has(commitSha)) {
      newSelected.delete(commitSha)
    } else {
      newSelected.add(commitSha)
    }
    setSelectedCommits(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedCommits.size === commits.length) {
      setSelectedCommits(new Set())
    } else {
      setSelectedCommits(new Set(commits.map(commit => commit.sha)))
    }
  }

  const handleSubmit = async () => {
    if (selectedCommits.size === 0) {
      setError(
        'Please select at least one commit to submit with this milestone'
      )
      throw new Error(
        'Please select at least one commit to submit with this milestone'
      )
    }

    if (!deliverables.trim()) {
      setError(
        'Please provide a description of deliverables for this milestone'
      )
      throw new Error(
        'Please provide a description of deliverables for this milestone'
      )
    }

    setError(null)

    try {
      await onSubmit({
        milestoneId: milestone.id,
        selectedCommits: Array.from(selectedCommits),
        deliverables: deliverables.trim(),
        githubCommitHashes: Array.from(selectedCommits),
      })

      console.log(
        '[MilestoneSubmissionForm]: Milestone submitted successfully',
        {
          milestoneId: milestone.id,
          selectedCommitsCount: selectedCommits.size,
        }
      )
    } catch (err) {
      console.error(
        '[MilestoneSubmissionForm]: Error submitting milestone',
        err
      )
      setError('Failed to submit milestone. Please try again.')
      throw err // Re-throw for AsyncButton
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTotalStats = () => {
    const selectedCommitObjects = commits.filter(commit =>
      selectedCommits.has(commit.sha)
    )
    return selectedCommitObjects.reduce(
      (total, commit) => ({
        additions: total.additions + (commit.stats?.additions ?? 0),
        deletions: total.deletions + (commit.stats?.deletions ?? 0),
        total: total.total + (commit.stats?.total ?? 0),
      }),
      { additions: 0, deletions: 0, total: 0 }
    )
  }

  return (
    <div className="space-y-6">
      {/* Milestone Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <CardTitle>Submit Milestone: {milestone.title}</CardTitle>
          </div>
          <CardDescription>
            Select the commits that demonstrate completion of this milestone's
            requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Milestone Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                ${milestone.amount?.toLocaleString() ?? 0}
              </span>
            </div>
            {milestone.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  Due: {new Date(milestone.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Requirements */}
          <div>
            <h4 className="mb-2 font-medium">Requirements to Complete:</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
              {requirements.map((req: string, index: number) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>

          {/* Description */}
          {milestone.description && (
            <div>
              <h4 className="mb-2 font-medium">Description:</h4>
              <p className="text-sm text-gray-600">{milestone.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commit Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              <CardTitle>Select Commits</CardTitle>
            </div>
            {commits.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedCommits.size === commits.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            )}
          </div>
          <CardDescription>
            {previousMilestoneCommitSha
              ? 'Commits since the last approved milestone are auto-selected'
              : 'All commits from the repository are auto-selected (first milestone)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading commits from GitHub...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 py-4 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : commits.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <GitCommit className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No commits found for this milestone period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Commit Statistics */}
              {selectedCommits.size > 0 && (
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">
                      Selected: {selectedCommits.size} commits
                    </span>
                    {(() => {
                      const stats = getTotalStats()
                      return (
                        <div className="flex gap-3">
                          <span className="text-green-600">
                            +{stats.additions}
                          </span>
                          <span className="text-red-600">
                            -{stats.deletions}
                          </span>
                          <span className="text-gray-600">
                            {stats.total} changes
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Commit List */}
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {commits.map(commit => (
                  <div
                    key={commit.sha}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      selectedCommits.has(commit.sha)
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCommits.has(commit.sha)}
                      onChange={() => handleCommitToggle(commit.sha)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                          {commit.shortSha}
                        </code>
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      <p className="mb-1 text-sm font-medium text-gray-900">
                        {commit.message.split('\n')[0]}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{commit.author.name}</span>
                        <span>{formatDate(commit.author.date)}</span>
                        {commit.stats && (
                          <div className="flex gap-2">
                            <span className="text-green-600">
                              +{commit.stats.additions}
                            </span>
                            <span className="text-red-600">
                              -{commit.stats.deletions}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deliverables Description */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Deliverables Description</CardTitle>
          </div>
          <CardDescription>
            Describe what you've delivered for this milestone and how the
            selected commits fulfill the requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Deliverables Description *
            </label>
            <textarea
              id="deliverables"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Provide a detailed description of what you've delivered for this milestone. Explain how the selected commits demonstrate completion of the requirements..."
              value={deliverables}
              onChange={e => setDeliverables(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Be specific about features implemented, bugs fixed, and
              requirements addressed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <AsyncButton
          onClick={handleSubmit}
          disabled={selectedCommits.size === 0 || !deliverables.trim()}
          className="flex items-center gap-2"
          loadingContent={
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          }
        >
          <CheckCircle className="h-4 w-4" />
          Submit Milestone
        </AsyncButton>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
