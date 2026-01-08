import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../drizzle'
import { type Group, groupMemberships, groups, submissions } from '../schema'

// Group-related queries
// For committees: the committee IS the grant program (budget fields on groups table)
export async function getGroups(type?: 'committee' | 'team'): Promise<Group[]> {
  const whereConditions = [eq(groups.isActive, true)]
  if (type) {
    whereConditions.push(eq(groups.type, type))
  }

  return await db
    .select()
    .from(groups)
    .where(and(...whereConditions))
    .orderBy(desc(groups.createdAt))
}

export async function getGroupById(groupId: number): Promise<Group | null> {
  const result = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1)

  return result.length > 0 ? result[0] : null
}

export async function getMembersByGroup(groupId: number) {
  return await db.query.groupMemberships.findMany({
    where: and(
      eq(groupMemberships.groupId, groupId),
      eq(groupMemberships.isActive, true)
    ),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          primaryRole: true,
          walletAddress: true,
        },
      },
    },
  })
}

// Enhanced group marketplace queries
export async function getGroupsWithStats() {
  const groupsWithStats = await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      logoUrl: groups.logoUrl,
      type: groups.type,
      focusAreas: groups.focusAreas,
      websiteUrl: groups.websiteUrl,
      githubOrg: groups.githubOrg,
      walletAddress: groups.walletAddress,
      isActive: groups.isActive,
      settings: groups.settings,
      fundingAmount: groups.fundingAmount,
      minGrantSize: groups.minGrantSize,
      maxGrantSize: groups.maxGrantSize,
      createdAt: groups.createdAt,
      updatedAt: groups.updatedAt,
    })
    .from(groups)
    .where(eq(groups.isActive, true))
    .orderBy(desc(groups.createdAt))

  // For each group, get additional stats
  const groupsWithFullStats = await Promise.all(
    groupsWithStats.map(async group => {
      const [totalSubmissions, approvedSubmissions, members] =
        await Promise.all([
          // Total submissions (for committees - reviewing, for teams - submitting)
          db
            .select({ count: sql<number>`count(*)` })
            .from(submissions)
            .where(
              group.type === 'committee'
                ? eq(submissions.reviewerGroupId, group.id)
                : eq(submissions.submitterGroupId, group.id)
            ),

          // Approved submissions
          db
            .select({ count: sql<number>`count(*)` })
            .from(submissions)
            .where(
              and(
                group.type === 'committee'
                  ? eq(submissions.reviewerGroupId, group.id)
                  : eq(submissions.submitterGroupId, group.id),
                eq(submissions.status, 'approved')
              )
            ),

          // Active members count
          db
            .select({ count: sql<number>`count(*)` })
            .from(groupMemberships)
            .where(
              and(
                eq(groupMemberships.groupId, group.id),
                eq(groupMemberships.isActive, true)
              )
            ),
        ])

      const totalSubmissionsCount = totalSubmissions[0]?.count || 0
      const approvedSubmissionsCount = approvedSubmissions[0]?.count || 0
      const approvalRate =
        totalSubmissionsCount > 0
          ? Math.round((approvedSubmissionsCount / totalSubmissionsCount) * 100)
          : 0

      return {
        ...group,
        stats: {
          totalSubmissions: totalSubmissionsCount,
          approvedSubmissions: approvedSubmissionsCount,
          approvalRate,
          // For committees, funding is directly on the group
          totalFunding: group.fundingAmount ?? 0,
          activeMembers: members[0]?.count || 0,
        },
      }
    })
  )

  return groupsWithFullStats
}

export async function getGroupWithDetails(groupId: number) {
  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
    with: {
      members: {
        where: eq(groupMemberships.isActive, true),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              primaryRole: true,
              walletAddress: true,
            },
          },
        },
      },
    },
  })

  if (!group) return null

  // Get submission stats based on group type
  const submissionField =
    group.type === 'committee'
      ? submissions.reviewerGroupId
      : submissions.submitterGroupId

  const [totalSubmissions, approvedSubmissions, recentSubmissions] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(submissions)
        .where(eq(submissionField, groupId)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(submissions)
        .where(
          and(eq(submissionField, groupId), eq(submissions.status, 'approved'))
        ),

      db
        .select()
        .from(submissions)
        .where(eq(submissionField, groupId))
        .orderBy(desc(submissions.createdAt))
        .limit(5),
    ])

  const totalSubmissionsCount = totalSubmissions[0]?.count || 0
  const approvedSubmissionsCount = approvedSubmissions[0]?.count || 0
  const approvalRate =
    totalSubmissionsCount > 0
      ? Math.round((approvedSubmissionsCount / totalSubmissionsCount) * 100)
      : 0

  return {
    ...group,
    stats: {
      totalSubmissions: totalSubmissionsCount,
      approvedSubmissions: approvedSubmissionsCount,
      approvalRate,
      // For committees, funding is directly on the group
      totalFunding: group.fundingAmount ?? 0,
    },
    recentSubmissions,
  }
}

export async function searchGroups(searchParams: {
  query?: string
  type?: 'committee' | 'team'
  focusAreas?: string[]
  minFunding?: number
  maxFunding?: number
  approvalRateMin?: number
}) {
  const { query, type, focusAreas, minFunding, maxFunding, approvalRateMin } =
    searchParams

  const whereConditions = [eq(groups.isActive, true)]

  // Type filter
  if (type) {
    whereConditions.push(eq(groups.type, type))
  }

  // Text search on name and description
  if (query) {
    whereConditions.push(
      or(
        ilike(groups.name, `%${query}%`),
        ilike(groups.description, `%${query}%`)
      )!
    )
  }

  // Focus areas filter (JSON array contains any of the specified areas)
  if (focusAreas && focusAreas.length > 0) {
    focusAreas.forEach(area => {
      whereConditions.push(sql`${groups.focusAreas}::text ILIKE ${`%${area}%`}`)
    })
  }

  let results = await db
    .select()
    .from(groups)
    .where(and(...whereConditions))
    .orderBy(desc(groups.createdAt))

  // Post-process for funding and approval rate filters (requires stats calculation)
  if (minFunding || maxFunding || approvalRateMin) {
    const resultsWithStats = await Promise.all(
      results.map(async group => {
        // For committees, funding is directly on the group
        const funding = group.fundingAmount ?? 0

        const submissionStats = await db
          .select({
            total: sql<number>`count(*)`,
            approved: sql<number>`count(*) filter (where status = 'approved')`,
          })
          .from(submissions)
          .where(
            group.type === 'committee'
              ? eq(submissions.reviewerGroupId, group.id)
              : eq(submissions.submitterGroupId, group.id)
          )

        const total = submissionStats[0]?.total || 0
        const approved = submissionStats[0]?.approved || 0
        const approvalRate =
          total > 0 ? Math.round((approved / total) * 100) : 0

        return {
          ...group,
          calculatedFunding: funding,
          calculatedApprovalRate: approvalRate,
        }
      })
    )

    // Apply funding and approval rate filters
    results = resultsWithStats.filter(group => {
      if (minFunding && group.calculatedFunding < minFunding) return false
      if (maxFunding && group.calculatedFunding > maxFunding) return false
      if (approvalRateMin && group.calculatedApprovalRate < approvalRateMin)
        return false
      return true
    })
  }

  return results
}
