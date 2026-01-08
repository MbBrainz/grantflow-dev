import { and, eq } from 'drizzle-orm'
import { db } from '../drizzle'
import { groupMemberships, groups } from '../schema'
import type {
  FocusAreas,
  GroupSettings,
} from '../schema/jsonTypes/GroupSettings'

/**
 * Create a new group (committee or team)
 * For committees: budget fields define the grant program constraints
 */
export async function createGroup(data: {
  name: string
  type: 'committee' | 'team'
  description?: string
  logoUrl?: string
  focusAreas?: FocusAreas
  websiteUrl?: string
  githubOrg?: string
  walletAddress?: string
  settings?: GroupSettings
  // Budget fields (for committees acting as grant programs)
  fundingAmount?: number
  minGrantSize?: number
  maxGrantSize?: number
  minMilestoneSize?: number
  maxMilestoneSize?: number
  // Template fields
  requirements?: string
  applicationTemplate?: string
  milestoneStructure?: string
}) {
  const [group] = await db
    .insert(groups)
    .values({
      name: data.name,
      type: data.type,
      description: data.description,
      logoUrl: data.logoUrl,
      focusAreas: data.focusAreas ?? null,
      websiteUrl: data.websiteUrl,
      githubOrg: data.githubOrg,
      walletAddress: data.walletAddress,
      settings: data.settings ?? null,
      isActive: true,
      // Budget fields
      fundingAmount: data.fundingAmount,
      minGrantSize: data.minGrantSize,
      maxGrantSize: data.maxGrantSize,
      minMilestoneSize: data.minMilestoneSize,
      maxMilestoneSize: data.maxMilestoneSize,
      // Template fields
      requirements: data.requirements,
      applicationTemplate: data.applicationTemplate,
      milestoneStructure: data.milestoneStructure,
    })
    .returning()

  return group
}

/**
 * Update a group (committee or team)
 * For committees: budget fields define the grant program constraints
 */
export async function updateGroup(
  groupId: number,
  data: Partial<{
    name: string
    description: string
    logoUrl: string
    focusAreas: FocusAreas
    websiteUrl: string
    githubOrg: string
    walletAddress: string
    settings: GroupSettings
    isActive: boolean
    // Budget fields (for committees acting as grant programs)
    fundingAmount: number
    minGrantSize: number
    maxGrantSize: number
    minMilestoneSize: number
    maxMilestoneSize: number
    // Template fields
    requirements: string
    applicationTemplate: string
    milestoneStructure: string
  }>
) {
  type UpdateData = Partial<{
    name: string
    description: string
    logoUrl: string
    focusAreas: FocusAreas
    websiteUrl: string
    githubOrg: string
    walletAddress: string
    settings: GroupSettings
    isActive: boolean
    fundingAmount: number
    minGrantSize: number
    maxGrantSize: number
    minMilestoneSize: number
    maxMilestoneSize: number
    requirements: string
    applicationTemplate: string
    milestoneStructure: string
    updatedAt: Date
  }>

  const updateData: UpdateData = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl
  if (data.focusAreas !== undefined) updateData.focusAreas = data.focusAreas
  if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl
  if (data.githubOrg !== undefined) updateData.githubOrg = data.githubOrg
  if (data.walletAddress !== undefined)
    updateData.walletAddress = data.walletAddress
  if (data.settings !== undefined) updateData.settings = data.settings
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  // Budget fields
  if (data.fundingAmount !== undefined)
    updateData.fundingAmount = data.fundingAmount
  if (data.minGrantSize !== undefined)
    updateData.minGrantSize = data.minGrantSize
  if (data.maxGrantSize !== undefined)
    updateData.maxGrantSize = data.maxGrantSize
  if (data.minMilestoneSize !== undefined)
    updateData.minMilestoneSize = data.minMilestoneSize
  if (data.maxMilestoneSize !== undefined)
    updateData.maxMilestoneSize = data.maxMilestoneSize
  // Template fields
  if (data.requirements !== undefined)
    updateData.requirements = data.requirements
  if (data.applicationTemplate !== undefined)
    updateData.applicationTemplate = data.applicationTemplate
  if (data.milestoneStructure !== undefined)
    updateData.milestoneStructure = data.milestoneStructure

  updateData.updatedAt = new Date()

  const [updated] = await db
    .update(groups)
    .set(updateData)
    .where(eq(groups.id, groupId))
    .returning()

  return updated
}

export async function addMemberToGroup(data: {
  groupId: number
  userId: number
  role?: 'admin' | 'member'
  permissions?: string[]
}) {
  const [membership] = await db
    .insert(groupMemberships)
    .values({
      groupId: data.groupId,
      userId: data.userId,
      role: data.role ?? 'member',
      permissions: data.permissions ? JSON.stringify(data.permissions) : null,
      isActive: true,
    })
    .returning()

  return membership
}

export async function removeMemberFromGroup(groupId: number, userId: number) {
  return await db
    .update(groupMemberships)
    .set({
      isActive: false,
      joinedAt: new Date(),
    })
    .where(
      and(
        eq(groupMemberships.groupId, groupId),
        eq(groupMemberships.userId, userId)
      )
    )
}
