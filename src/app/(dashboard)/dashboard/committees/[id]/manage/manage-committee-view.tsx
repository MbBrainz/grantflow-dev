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
import { Settings, Users, Plus, Trash2, Shield, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CommitteeWithDetails } from '@/lib/db/queries/committees'
import Image from 'next/image'
import {
  updateCommitteeInfo,
  addCommitteeMember,
  removeCommitteeMember,
  updateMemberRole,
  searchUsersAction,
  updateCommitteeBudget,
  updateMultisigConfig,
} from '../actions'
import { useToast } from '@/lib/hooks/use-toast'
import { AsyncButton } from '@/components/ui/async-button'
import { BountyLinkSetup } from '@/components/committee/bounty-link-setup'
import type { MultisigConfig } from '@/lib/db/schema/jsonTypes/GroupSettings'

interface CommitteeFinancials {
  totalBudget: number
  allocated: number
  spent: number
  remaining: number
  available: number
}

interface ManageCommitteeViewProps {
  committee: NonNullable<CommitteeWithDetails>
  financials?: CommitteeFinancials | null
}

export function ManageCommitteeView({
  committee,
  financials,
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

  // Budget Configuration State (committee IS the grant program)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [fundingAmount, setFundingAmount] = useState(
    committee.fundingAmount?.toString() ?? ''
  )
  const [minGrantSize, setMinGrantSize] = useState(
    committee.minGrantSize?.toString() ?? ''
  )
  const [maxGrantSize, setMaxGrantSize] = useState(
    committee.maxGrantSize?.toString() ?? ''
  )
  const [minMilestoneSize, setMinMilestoneSize] = useState(
    committee.minMilestoneSize?.toString() ?? ''
  )
  const [maxMilestoneSize, setMaxMilestoneSize] = useState(
    committee.maxMilestoneSize?.toString() ?? ''
  )

  // Multisig Configuration State
  const [isEditingMultisig, setIsEditingMultisig] = useState(false)
  const [isSavingMultisig, setIsSavingMultisig] = useState(false)

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

  const handleUpdateBudget = async () => {
    const result = await updateCommitteeBudget({
      committeeId: committee.id,
      fundingAmount: fundingAmount ? parseFloat(fundingAmount) : undefined,
      minGrantSize: minGrantSize ? parseFloat(minGrantSize) : undefined,
      maxGrantSize: maxGrantSize ? parseFloat(maxGrantSize) : undefined,
      minMilestoneSize: minMilestoneSize
        ? parseFloat(minMilestoneSize)
        : undefined,
      maxMilestoneSize: maxMilestoneSize
        ? parseFloat(maxMilestoneSize)
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
        description: 'Budget configuration updated successfully',
      })
      setIsEditingBudget(false)
      router.refresh()
    }
  }

  const cancelEditingBudget = () => {
    setIsEditingBudget(false)
    setFundingAmount(committee.fundingAmount?.toString() ?? '')
    setMinGrantSize(committee.minGrantSize?.toString() ?? '')
    setMaxGrantSize(committee.maxGrantSize?.toString() ?? '')
    setMinMilestoneSize(committee.minMilestoneSize?.toString() ?? '')
    setMaxMilestoneSize(committee.maxMilestoneSize?.toString() ?? '')
  }

  const handleSaveMultisigConfig = async (config: MultisigConfig) => {
    setIsSavingMultisig(true)
    try {
      const result = await updateMultisigConfig({
        committeeId: committee.id,
        ...config,
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
          description: 'Multisig configuration saved successfully',
        })
        setIsEditingMultisig(false)
        router.refresh()
      }
    } finally {
      setIsSavingMultisig(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
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

      {/* Budget Configuration (Committee IS the grant program) */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Budget Configuration</h2>
            {committee.fundingAmount && (
              <Badge variant="secondary">
                ${committee.fundingAmount.toLocaleString()} total
              </Badge>
            )}
          </div>
          {!isEditingBudget ? (
            <Button onClick={() => setIsEditingBudget(true)} size="sm">
              Edit Budget
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={cancelEditingBudget} variant="outline" size="sm">
                Cancel
              </Button>
              <AsyncButton onClick={handleUpdateBudget} size="sm">
                Save Changes
              </AsyncButton>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        {financials && (
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-5 dark:border-gray-700">
            <div>
              <p className="text-muted-foreground text-sm">Total Budget</p>
              <p className="text-lg font-semibold">
                ${financials.totalBudget.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Allocated</p>
              <p className="text-lg font-semibold">
                ${financials.allocated.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Spent</p>
              <p className="text-lg font-semibold">
                ${financials.spent.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Remaining</p>
              <p className="text-lg font-semibold text-green-600">
                ${financials.remaining.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Available</p>
              <p className="text-lg font-semibold text-blue-600">
                ${financials.available.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Budget Configuration Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="fundingAmount">Total Program Budget (USD)</Label>
            <Input
              id="fundingAmount"
              type="number"
              min="0"
              step="1000"
              value={fundingAmount}
              onChange={e => setFundingAmount(e.target.value)}
              disabled={!isEditingBudget}
              placeholder="100000"
            />
            <p className="mt-1 text-xs text-gray-500">
              Total budget available for this committee&apos;s grants
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minGrantSize">
                Min Grant per Submission (USD)
              </Label>
              <Input
                id="minGrantSize"
                type="number"
                min="0"
                step="100"
                value={minGrantSize}
                onChange={e => setMinGrantSize(e.target.value)}
                disabled={!isEditingBudget}
                placeholder="1000"
              />
            </div>
            <div>
              <Label htmlFor="maxGrantSize">
                Max Grant per Submission (USD)
              </Label>
              <Input
                id="maxGrantSize"
                type="number"
                min="0"
                step="100"
                value={maxGrantSize}
                onChange={e => setMaxGrantSize(e.target.value)}
                disabled={!isEditingBudget}
                placeholder="50000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minMilestoneSize">Min per Milestone (USD)</Label>
              <Input
                id="minMilestoneSize"
                type="number"
                min="0"
                step="100"
                value={minMilestoneSize}
                onChange={e => setMinMilestoneSize(e.target.value)}
                disabled={!isEditingBudget}
                placeholder="500"
              />
            </div>
            <div>
              <Label htmlFor="maxMilestoneSize">Max per Milestone (USD)</Label>
              <Input
                id="maxMilestoneSize"
                type="number"
                min="0"
                step="100"
                value={maxMilestoneSize}
                onChange={e => setMaxMilestoneSize(e.target.value)}
                disabled={!isEditingBudget}
                placeholder="25000"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Bounty Link & Multisig Configuration */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Bounty Link & Multisig</h2>
            {committee.settings?.multisig && (
              <Badge variant="default">Configured</Badge>
            )}
          </div>
          {!isEditingMultisig && committee.settings?.multisig && (
            <Button onClick={() => setIsEditingMultisig(true)} size="sm">
              Edit Configuration
            </Button>
          )}
        </div>

        {isEditingMultisig || !committee.settings?.multisig ? (
          <div>
            <BountyLinkSetup
              initialConfig={committee.settings?.multisig}
              onSave={handleSaveMultisigConfig}
              isLoading={isSavingMultisig}
            />
            {committee.settings?.multisig && (
              <Button
                variant="outline"
                onClick={() => setIsEditingMultisig(false)}
                className="mt-4 w-full"
              >
                Cancel
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Bounty ID</p>
                <p className="text-sm font-medium">
                  #{committee.settings.multisig.parentBountyId}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Network</p>
                <p className="text-sm font-medium capitalize">
                  {committee.settings.multisig.network}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Curator (Proxy)</p>
                <code className="font-mono text-xs">
                  {committee.settings.multisig.curatorProxyAddress?.slice(
                    0,
                    10
                  )}
                  ...
                  {committee.settings.multisig.curatorProxyAddress?.slice(-6)}
                </code>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  Multisig Address
                </p>
                <code className="font-mono text-xs">
                  {committee.settings.multisig.multisigAddress.slice(0, 10)}...
                  {committee.settings.multisig.multisigAddress.slice(-6)}
                </code>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Threshold</p>
                <p className="text-sm font-medium">
                  {committee.settings.multisig.threshold} of{' '}
                  {committee.settings.multisig.signatories.length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  Approval Workflow
                </p>
                <p className="text-sm font-medium capitalize">
                  {committee.settings.multisig.approvalWorkflow}
                </p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-sm">
                Signatories ({committee.settings.multisig.signatories.length})
              </p>
              <div className="space-y-2">
                {committee.settings.multisig.signatories.map(
                  (signatory, index) => {
                    // Handle both old string format and new SignatoryMapping format
                    const address =
                      typeof signatory === 'string'
                        ? signatory
                        : signatory.address
                    const linkedUserId =
                      typeof signatory === 'object'
                        ? signatory.userId
                        : undefined
                    const linkedMember = linkedUserId
                      ? committee.members?.find(m => m.user.id === linkedUserId)
                      : undefined

                    return (
                      <div
                        key={address}
                        className="bg-muted flex items-center justify-between gap-2 rounded-md p-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <code className="text-xs">
                            {address.slice(0, 10)}...{address.slice(-8)}
                          </code>
                        </div>
                        {linkedMember ? (
                          <Badge variant="secondary">
                            {linkedMember.user.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Not linked
                          </span>
                        )}
                      </div>
                    )
                  }
                )}
              </div>
            </div>
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
    </div>
  )
}
