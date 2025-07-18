import { eq, desc, and, or, ilike, sql, inArray, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { 
  users, 
  groups,
  groupMemberships,
  grantPrograms,
  submissions, 
  discussions, 
  messages, 
  milestones,
  reviews,
  notifications,
  type User,
  type Group,
  type Submission,
  type SubmissionWithMilestones,
  type GrantProgram,
  type Discussion,
  type Milestone,
  payouts
} from './schema';
import { getSession } from '@/lib/auth/session';

export async function getUser(): Promise<User | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getUserById(userId: number): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Group-related queries (replaces committee queries)
export async function getGroups(type?: 'committee' | 'team'): Promise<Group[]> {
  let whereConditions = [eq(groups.isActive, true)];
  if (type) {
    whereConditions.push(eq(groups.type, type));
  }

  return await db
    .select()
    .from(groups)
    .where(and(...whereConditions))
    .orderBy(desc(groups.createdAt));
}

export async function getGroupById(groupId: number): Promise<Group | null> {
  const result = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getGrantProgramsByGroup(groupId: number): Promise<GrantProgram[]> {
  return await db
    .select()
    .from(grantPrograms)
    .where(and(
      eq(grantPrograms.groupId, groupId),
      eq(grantPrograms.isActive, true)
    ))
    .orderBy(desc(grantPrograms.createdAt));
}

export async function getGrantProgramById(programId: number): Promise<GrantProgram | null> {
  const result = await db
    .select()
    .from(grantPrograms)
    .where(eq(grantPrograms.id, programId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Check if user is a member of a group with specific role
export async function isUserGroupMember(userId: number, groupId?: number, role?: 'admin' | 'member'): Promise<boolean> {
  let whereConditions = [
    eq(groupMemberships.userId, userId),
    eq(groupMemberships.isActive, true)
  ];

  if (groupId) {
    whereConditions.push(eq(groupMemberships.groupId, groupId));
  }
  if (role) {
    whereConditions.push(eq(groupMemberships.role, role));
  }

  const result = await db
    .select()
    .from(groupMemberships)
    .where(and(...whereConditions))
    .limit(1);

  return result.length > 0;
}

// Check if user is a reviewer (member of committee-type group)
export async function isUserReviewer(userId: number, groupId?: number): Promise<boolean> {
  let whereConditions = [
    eq(groupMemberships.userId, userId),
    eq(groupMemberships.isActive, true),
    eq(groups.type, 'committee')
  ];

  if (groupId) {
    whereConditions.push(eq(groupMemberships.groupId, groupId));
  }

  const result = await db
    .select()
    .from(groupMemberships)
    .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
    .where(and(...whereConditions))
    .limit(1);

  return result.length > 0;
}

// Submission queries
export async function getSubmissions(): Promise<Submission[]> {
  return await db
    .select()
    .from(submissions)
    .orderBy(desc(submissions.createdAt));
}

export async function getSubmissionsByUser(userId: number): Promise<Submission[]> {
  return await db
    .select()
    .from(submissions)
    .where(eq(submissions.submitterId, userId))
    .orderBy(desc(submissions.createdAt));
}

export async function getSubmissionsByGroup(groupId: number, isSubmitter: boolean = true): Promise<Submission[]> {
  const field = isSubmitter ? submissions.submitterGroupId : submissions.reviewerGroupId;
  return await db
    .select()
    .from(submissions)
    .where(eq(field, groupId))
    .orderBy(desc(submissions.createdAt));
}

export async function getSubmissionById(submissionId: number): Promise<SubmissionWithMilestones | null> {
  const result = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      submitter: true,
      submitterGroup: true,
      reviewerGroup: true,
      grantProgram: true,
      milestones: true,
    },
  });

  return result || null;
}

// Discussion queries
export async function getDiscussionsBySubmission(submissionId: number): Promise<Discussion[]> {
  return await db
    .select()
    .from(discussions)
    .where(eq(discussions.submissionId, submissionId))
    .orderBy(desc(discussions.createdAt));
}

export async function getDiscussionById(discussionId: number): Promise<Discussion | null> {
  const result = await db
    .select()
    .from(discussions)
    .where(eq(discussions.id, discussionId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Message queries
export async function getMessagesByDiscussion(discussionId: number) {
  return await db.query.messages.findMany({
    where: eq(messages.discussionId, discussionId),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
          primaryRole: true,
        },
      },
    },
    orderBy: [messages.createdAt],
  });
}

// Milestone queries
export async function getMilestonesBySubmission(submissionId: number): Promise<Milestone[]> {
  return await db
    .select()
    .from(milestones)
    .where(eq(milestones.submissionId, submissionId))
    .orderBy(desc(milestones.createdAt));
}

export async function getMilestoneById(milestoneId: number): Promise<Milestone | null> {
  const result = await db
    .select()
    .from(milestones)
    .where(eq(milestones.id, milestoneId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Payout and milestone completion queries
export async function getPayoutsByMilestone(milestoneId: number) {
  return await db
    .select()
    .from(payouts)
    .where(eq(payouts.milestoneId, milestoneId))
    .orderBy(desc(payouts.createdAt));
}

export async function getPayoutById(payoutId: number) {
  const result = await db
    .select()
    .from(payouts)
    .where(eq(payouts.id, payoutId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getMilestoneWithPayouts(milestoneId: number) {
  const milestone = await getMilestoneById(milestoneId);
  if (!milestone) return null;

  const payouts = await getPayoutsByMilestone(milestoneId);
  
  return {
    ...milestone,
    payouts
  };
}

export async function createPayout(data: {
  submissionId?: number;
  milestoneId: number;
  groupId: number;
  amount: number;
  transactionHash: string;
  blockExplorerUrl: string;
  triggeredBy: number;
  walletFrom?: string;
  walletTo?: string;
}) {
  const [payout] = await db
    .insert(payouts)
    .values({
      submissionId: data.submissionId,
      milestoneId: data.milestoneId,
      groupId: data.groupId,
      amount: data.amount,
      transactionHash: data.transactionHash,
      blockExplorerUrl: data.blockExplorerUrl,
      status: 'completed', // Mark as completed since transaction is provided
      triggeredBy: data.triggeredBy,
      approvedBy: data.triggeredBy, // Same person for simplified flow
      walletFrom: data.walletFrom,
      walletTo: data.walletTo,
      processedAt: new Date()
    })
    .returning();

  return payout;
}

export async function completeMilestoneWithPayout(data: {
  milestoneId: number;
  groupId: number;
  reviewerId: number;
  transactionHash: string;
  blockExplorerUrl: string;
  amount: number;
  walletFrom?: string;
  walletTo?: string;
}) {
  // Verify the reviewer has permission for this group
  const isAuthorized = await isUserReviewer(data.reviewerId, data.groupId);
  if (!isAuthorized) {
    throw new Error('User is not authorized to complete milestones for this group');
  }

  // Get the milestone to find the submission
  const milestone = await getMilestoneById(data.milestoneId);
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  // Start transaction to update milestone and create payout record
  const results = await db.transaction(async (tx) => {
    // Update milestone status to completed
    const [updatedMilestone] = await tx
      .update(milestones)
      .set({
        status: 'completed',
        reviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(milestones.id, data.milestoneId))
      .returning();

    // Create payout record with transaction details
    const [payout] = await tx
      .insert(payouts)
      .values({
        submissionId: milestone.submissionId,
        milestoneId: data.milestoneId,
        groupId: data.groupId,
        amount: data.amount,
        transactionHash: data.transactionHash,
        blockExplorerUrl: data.blockExplorerUrl,
        status: 'completed',
        triggeredBy: data.reviewerId,
        approvedBy: data.reviewerId,
        walletFrom: data.walletFrom,
        walletTo: data.walletTo,
        processedAt: new Date()
      })
      .returning();

    return { milestone: updatedMilestone, payout };
  });

  return results;
}

export async function getSubmissionPayouts(submissionId: number) {
  return await db
    .select()
    .from(payouts)
    .where(eq(payouts.submissionId, submissionId))
    .orderBy(desc(payouts.createdAt));
}

export async function getGroupPayouts(groupId: number) {
  return await db.query.payouts.findMany({
    where: eq(payouts.groupId, groupId),
    with: {
      milestone: {
        columns: {
          id: true,
          title: true,
          submissionId: true
        }
      },
      triggeredByUser: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: [desc(payouts.createdAt)]
  });
}

// Notification queries
export async function getNotificationsByUser(userId: number) {
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  return await db
    .update(notifications)
    .set({ 
      read: true, 
      readAt: new Date() 
    })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));
}

// Group membership queries (replaces curator queries)
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
        },
      },
    },
  });
}

export async function getUserGroups(userId: number) {
  return await db.query.groupMemberships.findMany({
    where: and(
      eq(groupMemberships.userId, userId),
      eq(groupMemberships.isActive, true)
    ),
    with: {
      group: true,
    },
  });
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
      createdAt: groups.createdAt,
      updatedAt: groups.updatedAt,
    })
    .from(groups)
    .where(eq(groups.isActive, true))
    .orderBy(desc(groups.createdAt));

  // For each group, get additional stats
  const groupsWithFullStats = await Promise.all(
    groupsWithStats.map(async (group) => {
      const [
        totalSubmissions,
        approvedSubmissions,
        grantProgramsCount,
        totalFunding,
        members
      ] = await Promise.all([
        // Total submissions (for committees - reviewing, for teams - submitting)
        db.select({ count: sql<number>`count(*)` })
          .from(submissions)
          .where(group.type === 'committee' 
            ? eq(submissions.reviewerGroupId, group.id)
            : eq(submissions.submitterGroupId, group.id)),
        
        // Approved submissions
        db.select({ count: sql<number>`count(*)` })
          .from(submissions)
          .where(and(
            group.type === 'committee' 
              ? eq(submissions.reviewerGroupId, group.id)
              : eq(submissions.submitterGroupId, group.id),
            eq(submissions.status, 'approved')
          )),
        
        // Grant programs (only for committees)
        group.type === 'committee' 
          ? db.select({ count: sql<number>`count(*)` })
              .from(grantPrograms)
              .where(and(
                eq(grantPrograms.groupId, group.id),
                eq(grantPrograms.isActive, true)
              ))
          : Promise.resolve([{ count: 0 }]),
        
        // Total funding available (only for committees)
        group.type === 'committee'
          ? db.select({ 
              totalFunding: sql<number>`coalesce(sum(${grantPrograms.fundingAmount}), 0)` 
            })
              .from(grantPrograms)
              .where(and(
                eq(grantPrograms.groupId, group.id),
                eq(grantPrograms.isActive, true)
              ))
          : Promise.resolve([{ totalFunding: 0 }]),
        
        // Active members count
        db.select({ count: sql<number>`count(*)` })
          .from(groupMemberships)
          .where(and(
            eq(groupMemberships.groupId, group.id),
            eq(groupMemberships.isActive, true)
          ))
      ]);

      const totalSubmissionsCount = totalSubmissions[0]?.count || 0;
      const approvedSubmissionsCount = approvedSubmissions[0]?.count || 0;
      const approvalRate = totalSubmissionsCount > 0 
        ? Math.round((approvedSubmissionsCount / totalSubmissionsCount) * 100) 
        : 0;

      return {
        ...group,
        stats: {
          totalSubmissions: totalSubmissionsCount,
          approvedSubmissions: approvedSubmissionsCount,
          approvalRate,
          grantPrograms: grantProgramsCount[0]?.count || 0,
          totalFunding: totalFunding[0]?.totalFunding || 0,
          activeMembers: members[0]?.count || 0
        }
      };
    })
  );

  return groupsWithFullStats;
}

export async function getGroupWithDetails(groupId: number) {
  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
    with: {
      grantPrograms: {
        where: eq(grantPrograms.isActive, true),
        orderBy: [desc(grantPrograms.createdAt)]
      },
      members: {
        where: eq(groupMemberships.isActive, true),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              primaryRole: true,
            }
          }
        }
      }
    }
  });

  if (!group) return null;

  // Get submission stats based on group type
  const submissionField = group.type === 'committee' ? submissions.reviewerGroupId : submissions.submitterGroupId;
  
  const [totalSubmissions, approvedSubmissions, recentSubmissions] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(eq(submissionField, groupId)),
    
    db.select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(and(
        eq(submissionField, groupId),
        eq(submissions.status, 'approved')
      )),
    
    db.select()
      .from(submissions)
      .where(eq(submissionField, groupId))
      .orderBy(desc(submissions.createdAt))
      .limit(5)
  ]);

  const totalSubmissionsCount = totalSubmissions[0]?.count || 0;
  const approvedSubmissionsCount = approvedSubmissions[0]?.count || 0;
  const approvalRate = totalSubmissionsCount > 0 
    ? Math.round((approvedSubmissionsCount / totalSubmissionsCount) * 100) 
    : 0;

  return {
    ...group,
    stats: {
      totalSubmissions: totalSubmissionsCount,
      approvedSubmissions: approvedSubmissionsCount,
      approvalRate,
      totalFunding: group.grantPrograms.reduce((sum, prog) => sum + (prog.fundingAmount || 0), 0)
    },
    recentSubmissions
  };
}

export async function searchGroups(searchParams: {
  query?: string;
  type?: 'committee' | 'team';
  focusAreas?: string[];
  minFunding?: number;
  maxFunding?: number;
  approvalRateMin?: number;
}) {
  const { query, type, focusAreas, minFunding, maxFunding, approvalRateMin } = searchParams;
  
  let whereConditions = [eq(groups.isActive, true)];
  
  // Type filter
  if (type) {
    whereConditions.push(eq(groups.type, type));
  }
  
  // Text search on name and description
  if (query) {
    whereConditions.push(
      or(
        ilike(groups.name, `%${query}%`),
        ilike(groups.description, `%${query}%`)
      )!
    );
  }

  // Focus areas filter (JSON array contains any of the specified areas)
  if (focusAreas && focusAreas.length > 0) {
    focusAreas.forEach(area => {
      whereConditions.push(
        sql`${groups.focusAreas}::text ILIKE ${`%"${area}"%`}`
      );
    });
  }

  let results = await db
    .select()
    .from(groups)
    .where(and(...whereConditions))
    .orderBy(desc(groups.createdAt));

  // Post-process for funding and approval rate filters (requires stats calculation)
  if (minFunding || maxFunding || approvalRateMin) {
    const resultsWithStats = await Promise.all(
      results.map(async (group) => {
        const [totalFunding, submissionStats] = await Promise.all([
          group.type === 'committee' 
            ? db.select({ 
                totalFunding: sql<number>`coalesce(sum(${grantPrograms.fundingAmount}), 0)` 
              })
                .from(grantPrograms)
                .where(and(
                  eq(grantPrograms.groupId, group.id),
                  eq(grantPrograms.isActive, true)
                ))
            : Promise.resolve([{ totalFunding: 0 }]),
          
          db.select({ 
            total: sql<number>`count(*)`,
            approved: sql<number>`count(*) filter (where status = 'approved')`
          })
            .from(submissions)
            .where(group.type === 'committee' 
              ? eq(submissions.reviewerGroupId, group.id)
              : eq(submissions.submitterGroupId, group.id))
        ]);

        const funding = totalFunding[0]?.totalFunding || 0;
        const total = submissionStats[0]?.total || 0;
        const approved = submissionStats[0]?.approved || 0;
        const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

        return {
          ...group,
          calculatedFunding: funding,
          calculatedApprovalRate: approvalRate
        };
      })
    );

    // Apply funding and approval rate filters
    results = resultsWithStats.filter(group => {
      if (minFunding && group.calculatedFunding < minFunding) return false;
      if (maxFunding && group.calculatedFunding > maxFunding) return false;
      if (approvalRateMin && group.calculatedApprovalRate < approvalRateMin) return false;
      return true;
    });
  }

  return results;
}

// Group creation and management queries
export async function createGroup(data: {
  name: string;
  type: 'committee' | 'team';
  description?: string;
  logoUrl?: string;
  focusAreas?: string[];
  websiteUrl?: string;
  githubOrg?: string;
  walletAddress?: string;
  settings?: any;
}) {
  const [group] = await db
    .insert(groups)
    .values({
      name: data.name,
      type: data.type,
      description: data.description,
      logoUrl: data.logoUrl,
      focusAreas: data.focusAreas ? JSON.stringify(data.focusAreas) : null,
      websiteUrl: data.websiteUrl,
      githubOrg: data.githubOrg,
      walletAddress: data.walletAddress,
      settings: data.settings ? JSON.stringify(data.settings) : null,
      isActive: true
    })
    .returning();

  return group;
}

export async function updateGroup(groupId: number, data: Partial<{
  name: string;
  description: string;
  logoUrl: string;
  focusAreas: string[];
  websiteUrl: string;
  githubOrg: string;
  walletAddress: string;
  settings: any;
}>) {
  const updateData: any = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.focusAreas !== undefined) updateData.focusAreas = JSON.stringify(data.focusAreas);
  if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
  if (data.githubOrg !== undefined) updateData.githubOrg = data.githubOrg;
  if (data.walletAddress !== undefined) updateData.walletAddress = data.walletAddress;
  if (data.settings !== undefined) updateData.settings = JSON.stringify(data.settings);
  
  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(groups)
    .set(updateData)
    .where(eq(groups.id, groupId))
    .returning();

  return updated;
}

export async function addMemberToGroup(data: {
  groupId: number;
  userId: number;
  role?: 'admin' | 'member';
  permissions?: string[];
}) {
  const [membership] = await db
    .insert(groupMemberships)
    .values({
      groupId: data.groupId,
      userId: data.userId,
      role: data.role || 'member',
      permissions: data.permissions ? JSON.stringify(data.permissions) : null,
      isActive: true
    })
    .returning();

  return membership;
}

export async function removeMemberFromGroup(groupId: number, userId: number) {
  return await db
    .update(groupMemberships)
    .set({ 
      isActive: false,
      joinedAt: new Date() // Update timestamp when removing
    })
    .where(and(
      eq(groupMemberships.groupId, groupId),
      eq(groupMemberships.userId, userId)
    ));
}

export async function createGrantProgram(data: {
  groupId: number;
  name: string;
  description?: string;
  fundingAmount?: number;
  requirements?: any;
  applicationTemplate?: any;
  milestoneStructure?: any;
}) {
  const [program] = await db
    .insert(grantPrograms)
    .values({
      groupId: data.groupId,
      name: data.name,
      description: data.description,
      fundingAmount: data.fundingAmount,
      requirements: data.requirements ? JSON.stringify(data.requirements) : null,
      applicationTemplate: data.applicationTemplate ? JSON.stringify(data.applicationTemplate) : null,
      milestoneStructure: data.milestoneStructure ? JSON.stringify(data.milestoneStructure) : null,
      isActive: true
    })
    .returning();

  return program;
}

export async function updateGrantProgram(programId: number, data: Partial<{
  name: string;
  description: string;
  fundingAmount: number;
  requirements: any;
  applicationTemplate: any;
  milestoneStructure: any;
  isActive: boolean;
}>) {
  const updateData: any = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.fundingAmount !== undefined) updateData.fundingAmount = data.fundingAmount;
  if (data.requirements !== undefined) updateData.requirements = JSON.stringify(data.requirements);
  if (data.applicationTemplate !== undefined) updateData.applicationTemplate = JSON.stringify(data.applicationTemplate);
  if (data.milestoneStructure !== undefined) updateData.milestoneStructure = JSON.stringify(data.milestoneStructure);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(grantPrograms)
    .set(updateData)
    .where(eq(grantPrograms.id, programId))
    .returning();

  return updated;
}

// Discussion system functions
export async function getDiscussionForSubmission(submissionId: number) {
  return await db.query.discussions.findFirst({
    where: and(eq(discussions.submissionId, submissionId), eq(discussions.type, 'submission')),
    with: {
      messages: {
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              primaryRole: true
            }
          }
        },
        orderBy: [messages.createdAt]
      }
    }
  });
}

export async function getDiscussionForMilestone(milestoneId: number) {
  return await db.query.discussions.findFirst({
    where: and(eq(discussions.milestoneId, milestoneId), eq(discussions.type, 'milestone')),
    with: {
      messages: {
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              primaryRole: true
            }
          }
        },
        orderBy: [messages.createdAt]
      }
    }
  });
}

export async function createMessage(data: {
  discussionId: number;
  content: string;
  messageType?: string;
  metadata?: string;
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const result = await db.insert(messages).values({
    ...data,
    authorId: user.id,
    messageType: data.messageType || 'comment'
  }).returning();

  // Update discussion timestamp
  await db
    .update(discussions)
    .set({ updatedAt: new Date() })
    .where(eq(discussions.id, data.discussionId));

  return result[0];
}

export async function ensureDiscussionForSubmission(submissionId: number) {
  const existingDiscussion = await db.query.discussions.findFirst({
    where: and(eq(discussions.submissionId, submissionId), eq(discussions.type, 'submission'))
  });

  if (!existingDiscussion) {
    // Get the group ID from the submission
    const submission = await db
      .select({ reviewerGroupId: submissions.reviewerGroupId })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (!submission[0]) {
      throw new Error('Submission not found');
    }

    const result = await db.insert(discussions).values({
      submissionId,
      groupId: submission[0].reviewerGroupId,
      type: 'submission'
    }).returning();

    return result[0];
  }

  return existingDiscussion;
}

export async function ensureDiscussionForMilestone(milestoneId: number) {
  const existingDiscussion = await db.query.discussions.findFirst({
    where: and(eq(discussions.milestoneId, milestoneId), eq(discussions.type, 'milestone'))
  });

  if (!existingDiscussion) {
    // Get the group ID from the milestone
    const milestone = await db
      .select({ groupId: milestones.groupId })
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1);

    if (!milestone[0]) {
      throw new Error('Milestone not found');
    }

    const result = await db.insert(discussions).values({
      milestoneId,
      groupId: milestone[0].groupId,
      type: 'milestone'
    }).returning();

    return result[0];
  }

  return existingDiscussion;
}

export async function createNotification(data: {
  userId: number;
  type: string;
  content: string;
  submissionId?: number;
  discussionId?: number;
  milestoneId?: number;
  groupId?: number;
}) {
  const result = await db.insert(notifications).values(data).returning();
  return result[0];
}

export async function getReviewsForSubmission(submissionId: number) {
  return await db.query.reviews.findMany({
    where: eq(reviews.submissionId, submissionId),
    with: {
      reviewer: {
        columns: {
          id: true,
          name: true,
          primaryRole: true
        }
      },
      discussion: {
        columns: {
          id: true,
          type: true
        }
      }
    },
    orderBy: [desc(reviews.createdAt)]
  });
}

// Legacy functions for compatibility (updated for group model)
export async function checkIsReviewer(userId: number) {
  return await isUserReviewer(userId);
}

export async function getAllSubmissionsForReview(statusFilter?: string) {
  const user = await getUser();
  if (!user) {
    return [];
  }

  // Get groups where user is a member of committee-type groups
  const userGroups = await db
    .select({ groupId: groupMemberships.groupId })
    .from(groupMemberships)
    .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
    .where(and(
      eq(groupMemberships.userId, user.id),
      eq(groupMemberships.isActive, true),
      eq(groups.type, 'committee')
    ));

  // If user is not a member of any committee, return empty
  if (userGroups.length === 0) {
    return [];
  }

  const groupIds = userGroups.map(g => g.groupId);

  // Build where conditions
  let whereConditions = [
    sql`${submissions.reviewerGroupId} IN (${sql.join(groupIds.map(id => sql`${id}`), sql`, `)})`,
  ];

  if (statusFilter) {
    whereConditions.push(eq(submissions.status, statusFilter));
  }

  const submissionsData = await db.query.submissions.findMany({
    where: and(...whereConditions),
    with: {
      submitter: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      },
      reviewerGroup: {
        columns: {
          id: true,
          name: true,
          description: true,
          logoUrl: true,
          focusAreas: true,
          isActive: true
        }
      },
      grantProgram: {
        columns: {
          id: true,
          name: true,
          fundingAmount: true
        }
      }
    },
    orderBy: [desc(submissions.createdAt)]
  });

  // Fetch milestones separately to avoid relation issues
  const submissionsWithMilestones = await Promise.all(
    submissionsData.map(async (submission) => {
      const submissionMilestones = await db
        .select({
          id: milestones.id,
          title: milestones.title,
          status: milestones.status,
          amount: milestones.amount
        })
        .from(milestones)
        .where(eq(milestones.submissionId, submission.id));

      return {
        ...submission,
        milestones: submissionMilestones
      };
    })
  );

  return submissionsWithMilestones;
}

export async function getSubmissionStats() {
  const user = await getUser();
  if (!user) {
    return {
      total: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
    };
  }

  // Get groups where user is a member of committee-type groups
  const userGroups = await db
    .select({ groupId: groupMemberships.groupId })
    .from(groupMemberships)
    .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
    .where(and(
      eq(groupMemberships.userId, user.id),
      eq(groupMemberships.isActive, true),
      eq(groups.type, 'committee')
    ));

  // If user is not a member of any committee, return zeros
  if (userGroups.length === 0) {
    return {
      total: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
    };
  }

  const groupIds = userGroups.map(g => g.groupId);
  const groupFilter = sql`${submissions.reviewerGroupId} IN (${sql.join(groupIds.map(id => sql`${id}`), sql`, `)})`;

  const totalResult = await db.select().from(submissions).where(groupFilter);
  const submittedResult = await db.select().from(submissions).where(and(groupFilter, eq(submissions.status, 'pending')));
  const underReviewResult = await db.select().from(submissions).where(and(groupFilter, eq(submissions.status, 'under_review')));
  const approvedResult = await db.select().from(submissions).where(and(groupFilter, eq(submissions.status, 'approved')));
  const rejectedResult = await db.select().from(submissions).where(and(groupFilter, eq(submissions.status, 'rejected')));

  return {
    total: totalResult.length || 0,
    submitted: submittedResult.length || 0,
    underReview: underReviewResult.length || 0,
    approved: approvedResult.length || 0,
    rejected: rejectedResult.length || 0,
  };
}

// Backwards compatibility - return null since teams are replaced by group model
export async function getTeamForUser() {
  return null;
}

// Activity logs - simplified since we removed the table
export async function getActivityLogs() {
  return [];
}

// Get all pending actions that require current reviewer's response/approval
export async function getReviewerPendingActions() {
  const user = await getUser();
  if (!user) {
    return { submissionsNeedingVote: [], milestonesNeedingReview: [] };
  }

  // Get groups where user is a member of committee-type groups
  const userGroups = await db
    .select({ groupId: groupMemberships.groupId })
    .from(groupMemberships)
    .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
    .where(and(
      eq(groupMemberships.userId, user.id),
      eq(groupMemberships.isActive, true),
      eq(groups.type, 'committee')
    ));

  // If user is not a member of any committee, return empty
  if (userGroups.length === 0) {
    return { submissionsNeedingVote: [], milestonesNeedingReview: [] };
  }

  const groupIds = userGroups.map(g => g.groupId);

  // 1. Find submissions needing this reviewer's vote
  const submissionsInGroups = await db.query.submissions.findMany({
    where: and(
      sql`${submissions.reviewerGroupId} IN (${sql.join(groupIds.map(id => sql`${id}`), sql`, `)})`,
      or(
        eq(submissions.status, 'submitted'),
        eq(submissions.status, 'under_review')
      )
    ),
    with: {
      submitter: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      },
      reviewerGroup: {
        columns: {
          id: true,
          name: true,
          description: true,
          logoUrl: true,
          focusAreas: true
        }
      },
      grantProgram: {
        columns: {
          id: true,
          name: true,
          fundingAmount: true
        }
      }
    }
  });

  // Filter out submissions where this reviewer has already voted
  const submissionsNeedingVote = [];
  for (const submission of submissionsInGroups) {
    const existingVote = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.submissionId, submission.id),
        eq(reviews.reviewerId, user.id),
        isNull(reviews.milestoneId) // submission vote, not milestone vote
      )
    });
    
    if (!existingVote) {
      submissionsNeedingVote.push({
        ...submission,
        actionType: 'submission_vote',
        actionDescription: 'Vote needed on submission',
        daysOld: Math.floor((Date.now() - new Date(submission.appliedAt || submission.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      });
    }
  }

  // 2. Find milestones needing this reviewer's review
  // First get submission IDs for the reviewer groups
  const reviewerSubmissionIds = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(sql`${submissions.reviewerGroupId} IN (${sql.join(groupIds.map(id => sql`${id}`), sql`, `)})`);

  const submissionIds = reviewerSubmissionIds.map(s => s.id);

  const milestonesNeedingReview = submissionIds.length > 0 ? await db.query.milestones.findMany({
    where: and(
      sql`${milestones.submissionId} IN (${sql.join(submissionIds.map(id => sql`${id}`), sql`, `)})`,
      or(
        eq(milestones.status, 'submitted'),
        eq(milestones.status, 'under_review')
      )
    ),
    with: {
      submission: {
        columns: {
          id: true,
          title: true,
          status: true
        }
      }
    }
  }) : [];

  // Fetch additional submission details separately to avoid relation issues
  const milestonesWithDetails = await Promise.all(
    milestonesNeedingReview.map(async (milestone) => {
      const submissionDetails = await db.query.submissions.findFirst({
        where: eq(submissions.id, milestone.submission.id),
        with: {
          submitter: {
            columns: {
              id: true,
              name: true,
              email: true
            }
          },
          reviewerGroup: {
            columns: {
              id: true,
              name: true,
              description: true,
              logoUrl: true
            }
          }
        }
      });

      return {
        ...milestone,
        submission: {
          ...milestone.submission,
          submitter: submissionDetails?.submitter,
          reviewerGroup: submissionDetails?.reviewerGroup
        }
      };
    })
  );

  // Filter out milestones where this reviewer has already reviewed
  const milestonesNeedingReviewFiltered = [];
  for (const milestone of milestonesWithDetails) {
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.milestoneId, milestone.id),
        eq(reviews.reviewerId, user.id)
      )
    });
    
    if (!existingReview) {
      milestonesNeedingReviewFiltered.push({
        ...milestone,
        actionType: 'milestone_review',
        actionDescription: 'Milestone review needed',
        daysOld: milestone.submittedAt 
          ? Math.floor((Date.now() - new Date(milestone.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0
      });
    }
  }

  return {
    submissionsNeedingVote,
    milestonesNeedingReview: milestonesNeedingReviewFiltered
  };
}

// Enhanced submission data with all related information for reviewer review
export async function getSubmissionForReviewerReview(submissionId: number) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      submitter: {
        columns: {
          id: true,
          name: true,
          email: true,
          primaryRole: true,
          githubId: true
        }
      },
      reviewerGroup: {
        columns: {
          id: true,
          name: true,
          description: true,
          focusAreas: true
        }
      },
      grantProgram: {
        columns: {
          id: true,
          name: true,
          description: true,
          fundingAmount: true,
          requirements: true
        }
      },
      milestones: {
        with: {
          discussions: {
            with: {
              messages: {
                with: {
                  author: {
                    columns: {
                      id: true,
                      name: true,
                      primaryRole: true
                    }
                  }
                },
                orderBy: [messages.createdAt]
              }
            }
          },
          reviews: {
            with: {
              reviewer: {
                columns: {
                  id: true,
                  name: true,
                  primaryRole: true
                }
              }
            }
          },
          payouts: true
        },
        orderBy: [milestones.createdAt]
      },
      discussions: {
        with: {
          messages: {
            with: {
              author: {
                columns: {
                  id: true,
                  name: true,
                  primaryRole: true
                }
              }
            },
            orderBy: [messages.createdAt]
          }
        }
      },
      reviews: {
        with: {
          reviewer: {
            columns: {
              id: true,
              name: true,
              primaryRole: true
            }
          }
        },
        orderBy: [reviews.createdAt]
      },
      notifications: {
        orderBy: [notifications.createdAt]
      }
    }
  });

  return submission;
}

// Get current state data for a submission (recent activity, pending actions, etc.)
export async function getSubmissionCurrentState(submissionId: number) {
  const user = await getUser();
  if (!user) return null;

  // Get recent activity across all related entities
  // First get discussion IDs for this submission
  const submissionDiscussions = await db
    .select({ id: discussions.id })
    .from(discussions)
    .where(eq(discussions.submissionId, submissionId));
  
  const discussionIds = submissionDiscussions.map(d => d.id);
  
  const recentMessages = discussionIds.length > 0 ? await db.query.messages.findMany({
    where: inArray(messages.discussionId, discussionIds),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          primaryRole: true
        }
      },
      discussion: {
        columns: {
          id: true,
          type: true,
          submissionId: true,
          milestoneId: true
        }
      }
    },
    orderBy: [desc(messages.createdAt)],
    limit: 10
  }) : [];

  // Get pending reviews (submissions or milestones without reviewer's vote)
  const pendingSubmissionReviews = await db.query.reviews.findMany({
    where: and(
      eq(reviews.submissionId, submissionId),
      eq(reviews.reviewerId, user.id)
    )
  });

  const pendingMilestoneReviews = await db.query.reviews.findMany({
    where: and(
      sql`${reviews.milestoneId} IN (
        SELECT ${milestones.id} FROM ${milestones} WHERE ${milestones.submissionId} = ${submissionId}
      )`,
      eq(reviews.reviewerId, user.id)
    )
  });

  // Get active milestones (in_progress or submitted status)
  const activeMilestones = await db.query.milestones.findMany({
    where: and(
      eq(milestones.submissionId, submissionId),
      or(
        eq(milestones.status, 'in_progress'),
        eq(milestones.status, 'submitted'),
        eq(milestones.status, 'under_review')
      )
    ),
    with: {
      discussions: {
        with: {
          messages: {
            with: {
              author: {
                columns: {
                  id: true,
                  name: true,
                  primaryRole: true
                }
              }
            },
            orderBy: [desc(messages.createdAt)],
            limit: 3
          }
        }
      }
    },
    orderBy: [milestones.dueDate]
  });

  return {
    recentMessages,
    pendingSubmissionReviews,
    pendingMilestoneReviews,
    activeMilestones,
    hasUserVotedOnSubmission: pendingSubmissionReviews.length > 0,
    pendingActions: {
      submissionVote: pendingSubmissionReviews.length === 0,
      milestoneReviews: pendingMilestoneReviews.length,
      activeMilestonesCount: activeMilestones.length
    }
  };
}

// Get milestone overview data for a submission
export async function getSubmissionMilestonesOverview(submissionId: number) {
  const submissionMilestones = await db.query.milestones.findMany({
    where: eq(milestones.submissionId, submissionId),
    with: {
      discussions: {
        with: {
          messages: {
            with: {
              author: {
                columns: {
                  id: true,
                  name: true,
                  primaryRole: true
                }
              }
            },
            orderBy: [messages.createdAt]
          }
        }
      },
      reviews: {
        with: {
          reviewer: {
            columns: {
              id: true,
              name: true,
              primaryRole: true
            }
          }
        },
        orderBy: [reviews.createdAt]
      },
      payouts: {
        orderBy: [payouts.createdAt]
      }
    },
    orderBy: [milestones.createdAt]
  });

  // Calculate summary statistics
  const summary = {
    total: submissionMilestones.length,
    completed: submissionMilestones.filter((m: any) => m.status === 'completed').length,
    inProgress: submissionMilestones.filter((m: any) => m.status === 'in_progress').length,
    pending: submissionMilestones.filter((m: any) => m.status === 'pending').length,
    underReview: submissionMilestones.filter((m: any) => m.status === 'under_review').length,
    totalAmount: submissionMilestones.reduce((sum: number, m: any) => sum + (m.amount || 0), 0),
    paidAmount: submissionMilestones
      .filter((m: any) => m.status === 'completed')
      .reduce((sum: number, m: any) => sum + (m.amount || 0), 0)
  };

  return {
    milestones: submissionMilestones,
    summary
  };
}

// Missing functions for curator workflow
export async function checkIsCurator(userId: number): Promise<boolean> {
  return await isUserReviewer(userId);
}

export async function isUserCurator(userId: number): Promise<boolean> {
  return await isUserReviewer(userId);
}

export async function getCuratorPendingActions() {
  return await getReviewerPendingActions();
}

export async function getSubmissionForCuratorReview(submissionId: number) {
  return await getSubmissionForReviewerReview(submissionId);
}

export async function getUserCommittees(userId: number) {
  const userMemberships = await getUserGroups(userId);
  return userMemberships.filter(membership => membership.group.type === 'committee').map(membership => membership.group);
}


