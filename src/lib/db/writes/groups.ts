import { eq, and } from 'drizzle-orm'
import { db } from '../drizzle'
import { groups, groupMemberships, grantPrograms } from '../schema'
import type {
  FocusAreas,
  GroupSettings,
} from '../schema/jsonTypes/GroupSettings'

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
    })
    .returning()

  return group
}

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

export async function createGrantProgram(data: {
  groupId: number
  name: string
  description?: string
  fundingAmount?: number
  minGrantSize?: number
  maxGrantSize?: number
  minMilestoneSize?: number
  maxMilestoneSize?: number
  requirements?: Record<string, unknown>
  applicationTemplate?: Record<string, unknown>
  milestoneStructure?: Record<string, unknown>
}) {
  const [program] = await db
    .insert(grantPrograms)
    .values({
      groupId: data.groupId,
      name: data.name,
      description: data.description,
      fundingAmount: data.fundingAmount,
      minGrantSize: data.minGrantSize,
      maxGrantSize: data.maxGrantSize,
      minMilestoneSize: data.minMilestoneSize,
      maxMilestoneSize: data.maxMilestoneSize,
      requirements: data.requirements
        ? JSON.stringify(data.requirements)
        : null,
      applicationTemplate: data.applicationTemplate
        ? JSON.stringify(data.applicationTemplate)
        : null,
      milestoneStructure: data.milestoneStructure
        ? JSON.stringify(data.milestoneStructure)
        : null,
      isActive: true,
    })
    .returning()

  return program
}

export async function updateGrantProgram(
  programId: number,
  data: Partial<{
    name: string
    description: string
    fundingAmount: number
    minGrantSize: number
    maxGrantSize: number
    minMilestoneSize: number
    maxMilestoneSize: number
    requirements: Record<string, unknown>
    applicationTemplate: Record<string, unknown>
    milestoneStructure: Record<string, unknown>
    isActive: boolean
  }>
) {
  type UpdateData = Partial<{
    name: string
    description: string
    fundingAmount: number
    minGrantSize: number
    maxGrantSize: number
    minMilestoneSize: number
    maxMilestoneSize: number
    requirements: string
    applicationTemplate: string
    milestoneStructure: string
    isActive: boolean
    updatedAt: Date
  }>

  const updateData: UpdateData = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
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
  if (data.requirements !== undefined)
    updateData.requirements = JSON.stringify(data.requirements)
  if (data.applicationTemplate !== undefined)
    updateData.applicationTemplate = JSON.stringify(data.applicationTemplate)
  if (data.milestoneStructure !== undefined)
    updateData.milestoneStructure = JSON.stringify(data.milestoneStructure)
  if (data.isActive !== undefined) updateData.isActive = data.isActive

  updateData.updatedAt = new Date()

  const [updated] = await db
    .update(grantPrograms)
    .set(updateData)
    .where(eq(grantPrograms.id, programId))
    .returning()

  return updated
}
