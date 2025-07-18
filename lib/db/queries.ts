import { eq, desc, and, or, ilike, sql, inArray } from 'drizzle-orm';
import { db } from './drizzle';
import { 
  users, 
  committees,
  committeeCurators,
  grantPrograms,
  submissions, 
  discussions, 
  messages, 
  milestones,
  reviews,
  notifications,
  type User,
  type Submission,
  type SubmissionWithMilestones,
  type Committee,
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

// Committee-related queries
export async function getCommittees(): Promise<Committee[]> {
  return await db
    .select()
    .from(committees)
    .where(eq(committees.isActive, true))
    .orderBy(desc(committees.createdAt));
}

export async function getCommitteeById(committeeId: number): Promise<Committee | null> {
  const result = await db
    .select()
    .from(committees)
    .where(eq(committees.id, committeeId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getGrantProgramsByCommittee(committeeId: number): Promise<GrantProgram[]> {
  return await db
    .select()
    .from(grantPrograms)
    .where(and(
      eq(grantPrograms.committeeId, committeeId),
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

// Check if user is a curator for a committee
export async function isUserCurator(userId: number, committeeId?: number): Promise<boolean> {
  const result = await db
    .select()
    .from(committeeCurators)
    .where(and(
      eq(committeeCurators.userId, userId),
      eq(committeeCurators.isActive, true),
      committeeId ? eq(committeeCurators.committeeId, committeeId) : undefined
    ))
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

export async function getSubmissionsByCommittee(committeeId: number): Promise<Submission[]> {
  return await db
    .select()
    .from(submissions)
    .where(eq(submissions.committeeId, committeeId))
    .orderBy(desc(submissions.createdAt));
}

export async function getSubmissionById(submissionId: number): Promise<SubmissionWithMilestones | null> {
  const result = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      submitter: true,
      committee: true,
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
          role: true,
        },
      },
    },
    orderBy: [discussions.createdAt],
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
  committeeId: number;
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
      committeeId: data.committeeId,
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
  committeeId: number;
  curatorId: number;
  transactionHash: string;
  blockExplorerUrl: string;
  amount: number;
  walletFrom?: string;
  walletTo?: string;
}) {
  // Verify the curator has permission for this committee
  const isAuthorized = await isUserCurator(data.curatorId, data.committeeId);
  if (!isAuthorized) {
    throw new Error('User is not authorized to complete milestones for this committee');
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
        committeeId: data.committeeId,
        amount: data.amount,
        transactionHash: data.transactionHash,
        blockExplorerUrl: data.blockExplorerUrl,
        status: 'completed',
        triggeredBy: data.curatorId,
        approvedBy: data.curatorId,
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

export async function getCommitteePayouts(committeeId: number) {
  return await db.query.payouts.findMany({
    where: eq(payouts.committeeId, committeeId),
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

// Committee curator queries
export async function getCuratorsByCommittee(committeeId: number) {
  return await db.query.committeeCurators.findMany({
    where: and(
      eq(committeeCurators.committeeId, committeeId),
      eq(committeeCurators.isActive, true)
    ),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function getUserCommittees(userId: number) {
  return await db.query.committeeCurators.findMany({
    where: and(
      eq(committeeCurators.userId, userId),
      eq(committeeCurators.isActive, true)
    ),
    with: {
      committee: true,
    },
  });
}

// Enhanced committee marketplace queries
export async function getCommitteesWithStats() {
  const committeesWithStats = await db
    .select({
      id: committees.id,
      name: committees.name,
      description: committees.description,
      logoUrl: committees.logoUrl,
      focusAreas: committees.focusAreas,
      websiteUrl: committees.websiteUrl,
      githubOrg: committees.githubOrg,
      walletAddress: committees.walletAddress,
      isActive: committees.isActive,
      votingThreshold: committees.votingThreshold,
      approvalWorkflow: committees.approvalWorkflow,
      createdAt: committees.createdAt,
      updatedAt: committees.updatedAt,
    })
    .from(committees)
    .where(eq(committees.isActive, true))
    .orderBy(desc(committees.createdAt));

  // For each committee, get additional stats
  const committeesWithFullStats = await Promise.all(
    committeesWithStats.map(async (committee) => {
      const [
        totalSubmissions,
        approvedSubmissions,
        grantProgramsCount,
        totalFunding,
        curators
      ] = await Promise.all([
        // Total submissions
        db.select({ count: sql<number>`count(*)` })
          .from(submissions)
          .where(eq(submissions.committeeId, committee.id)),
        
        // Approved submissions
        db.select({ count: sql<number>`count(*)` })
          .from(submissions)
          .where(and(
            eq(submissions.committeeId, committee.id),
            eq(submissions.status, 'approved')
          )),
        
        // Grant programs
        db.select({ count: sql<number>`count(*)` })
          .from(grantPrograms)
          .where(and(
            eq(grantPrograms.committeeId, committee.id),
            eq(grantPrograms.isActive, true)
          )),
        
        // Total funding available
        db.select({ 
          totalFunding: sql<number>`coalesce(sum(${grantPrograms.fundingAmount}), 0)` 
        })
          .from(grantPrograms)
          .where(and(
            eq(grantPrograms.committeeId, committee.id),
            eq(grantPrograms.isActive, true)
          )),
        
        // Active curators count
        db.select({ count: sql<number>`count(*)` })
          .from(committeeCurators)
          .where(and(
            eq(committeeCurators.committeeId, committee.id),
            eq(committeeCurators.isActive, true)
          ))
      ]);

      const totalSubmissionsCount = totalSubmissions[0]?.count || 0;
      const approvedSubmissionsCount = approvedSubmissions[0]?.count || 0;
      const approvalRate = totalSubmissionsCount > 0 
        ? Math.round((approvedSubmissionsCount / totalSubmissionsCount) * 100) 
        : 0;

      return {
        ...committee,
        stats: {
          totalSubmissions: totalSubmissionsCount,
          approvedSubmissions: approvedSubmissionsCount,
          approvalRate,
          grantPrograms: grantProgramsCount[0]?.count || 0,
          totalFunding: totalFunding[0]?.totalFunding || 0,
          activeCurators: curators[0]?.count || 0
        }
      };
    })
  );

  return committeesWithFullStats;
}

export async function getCommitteeWithDetails(committeeId: number) {
  const committee = await db.query.committees.findFirst({
    where: eq(committees.id, committeeId),
    with: {
      grantPrograms: {
        where: eq(grantPrograms.isActive, true),
        orderBy: [desc(grantPrograms.createdAt)]
      },
      curators: {
        where: eq(committeeCurators.isActive, true),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          }
        }
      }
    }
  });

  if (!committee) return null;

  // Get submission stats
  const [totalSubmissions, approvedSubmissions, recentSubmissions] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(eq(submissions.committeeId, committeeId)),
    
    db.select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(and(
        eq(submissions.committeeId, committeeId),
        eq(submissions.status, 'approved')
      )),
    
    db.select()
      .from(submissions)
      .where(eq(submissions.committeeId, committeeId))
      .orderBy(desc(submissions.createdAt))
      .limit(5)
  ]);

  const totalSubmissionsCount = totalSubmissions[0]?.count || 0;
  const approvedSubmissionsCount = approvedSubmissions[0]?.count || 0;
  const approvalRate = totalSubmissionsCount > 0 
    ? Math.round((approvedSubmissionsCount / totalSubmissionsCount) * 100) 
    : 0;

  return {
    ...committee,
    stats: {
      totalSubmissions: totalSubmissionsCount,
      approvedSubmissions: approvedSubmissionsCount,
      approvalRate,
      totalFunding: committee.grantPrograms.reduce((sum, prog) => sum + (prog.fundingAmount || 0), 0)
    },
    recentSubmissions
  };
}

export async function searchCommittees(searchParams: {
  query?: string;
  focusAreas?: string[];
  minFunding?: number;
  maxFunding?: number;
  approvalRateMin?: number;
}) {
  const { query, focusAreas, minFunding, maxFunding, approvalRateMin } = searchParams;
  
  let whereConditions = [eq(committees.isActive, true)];
  
  // Text search on name and description
  if (query) {
    whereConditions.push(
      or(
        ilike(committees.name, `%${query}%`),
        ilike(committees.description, `%${query}%`)
      )!
    );
  }

  // Focus areas filter (JSON array contains any of the specified areas)
  if (focusAreas && focusAreas.length > 0) {
    focusAreas.forEach(area => {
      whereConditions.push(
        sql`${committees.focusAreas}::text ILIKE ${`%"${area}"%`}`
      );
    });
  }

  let results = await db
    .select()
    .from(committees)
    .where(and(...whereConditions))
    .orderBy(desc(committees.createdAt));

  // Post-process for funding and approval rate filters (requires stats calculation)
  if (minFunding || maxFunding || approvalRateMin) {
    const resultsWithStats = await Promise.all(
      results.map(async (committee) => {
        const [totalFunding, submissionStats] = await Promise.all([
          db.select({ 
            totalFunding: sql<number>`coalesce(sum(${grantPrograms.fundingAmount}), 0)` 
          })
            .from(grantPrograms)
            .where(and(
              eq(grantPrograms.committeeId, committee.id),
              eq(grantPrograms.isActive, true)
            )),
          
          db.select({ 
            total: sql<number>`count(*)`,
            approved: sql<number>`count(*) filter (where status = 'approved')`
          })
            .from(submissions)
            .where(eq(submissions.committeeId, committee.id))
        ]);

        const funding = totalFunding[0]?.totalFunding || 0;
        const total = submissionStats[0]?.total || 0;
        const approved = submissionStats[0]?.approved || 0;
        const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

        return {
          ...committee,
          calculatedFunding: funding,
          calculatedApprovalRate: approvalRate
        };
      })
    );

    // Apply funding and approval rate filters
    results = resultsWithStats.filter(committee => {
      if (minFunding && committee.calculatedFunding < minFunding) return false;
      if (maxFunding && committee.calculatedFunding > maxFunding) return false;
      if (approvalRateMin && committee.calculatedApprovalRate < approvalRateMin) return false;
      return true;
    });
  }

  return results;
}

// Committee creation and management queries
export async function createCommittee(data: {
  name: string;
  description?: string;
  logoUrl?: string;
  focusAreas?: string[];
  websiteUrl?: string;
  githubOrg?: string;
  walletAddress?: string;
  votingThreshold?: number;
  approvalWorkflow?: any;
}) {
  const [committee] = await db
    .insert(committees)
    .values({
      name: data.name,
      description: data.description,
      logoUrl: data.logoUrl,
      focusAreas: data.focusAreas ? JSON.stringify(data.focusAreas) : null,
      websiteUrl: data.websiteUrl,
      githubOrg: data.githubOrg,
      walletAddress: data.walletAddress,
      votingThreshold: data.votingThreshold || 2,
      approvalWorkflow: data.approvalWorkflow ? JSON.stringify(data.approvalWorkflow) : null,
      isActive: true
    })
    .returning();

  return committee;
}

export async function updateCommittee(committeeId: number, data: Partial<{
  name: string;
  description: string;
  logoUrl: string;
  focusAreas: string[];
  websiteUrl: string;
  githubOrg: string;
  walletAddress: string;
  votingThreshold: number;
  approvalWorkflow: any;
}>) {
  const updateData: any = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.focusAreas !== undefined) updateData.focusAreas = JSON.stringify(data.focusAreas);
  if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
  if (data.githubOrg !== undefined) updateData.githubOrg = data.githubOrg;
  if (data.walletAddress !== undefined) updateData.walletAddress = data.walletAddress;
  if (data.votingThreshold !== undefined) updateData.votingThreshold = data.votingThreshold;
  if (data.approvalWorkflow !== undefined) updateData.approvalWorkflow = JSON.stringify(data.approvalWorkflow);
  
  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(committees)
    .set(updateData)
    .where(eq(committees.id, committeeId))
    .returning();

  return updated;
}

export async function addCuratorToCommittee(data: {
  committeeId: number;
  userId: number;
  role?: 'admin' | 'curator' | 'reviewer';
  permissions?: string[];
}) {
  const [curator] = await db
    .insert(committeeCurators)
    .values({
      committeeId: data.committeeId,
      userId: data.userId,
      role: data.role || 'curator',
      permissions: data.permissions ? JSON.stringify(data.permissions) : null,
      isActive: true
    })
    .returning();

  return curator;
}

export async function removeCuratorFromCommittee(committeeId: number, userId: number) {
  return await db
    .update(committeeCurators)
    .set({ 
      isActive: false,
      joinedAt: new Date() // Update timestamp when removing
    })
    .where(and(
      eq(committeeCurators.committeeId, committeeId),
      eq(committeeCurators.userId, userId)
    ));
}

export async function createGrantProgram(data: {
  committeeId: number;
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
      committeeId: data.committeeId,
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
              role: true
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
              role: true
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
    // Get the committee ID from the submission
    const submission = await db
      .select({ committeeId: submissions.committeeId })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (!submission[0]) {
      throw new Error('Submission not found');
    }

    const result = await db.insert(discussions).values({
      submissionId,
      committeeId: submission[0].committeeId,
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
    // Get the committee ID from the milestone
    const milestone = await db
      .select({ committeeId: milestones.committeeId })
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1);

    if (!milestone[0]) {
      throw new Error('Milestone not found');
    }

    const result = await db.insert(discussions).values({
      milestoneId,
      committeeId: milestone[0].committeeId,
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
  committeeId?: number;
}) {
  const result = await db.insert(notifications).values(data).returning();
  return result[0];
}

export async function getReviewsForSubmission(submissionId: number) {
  return await db.query.reviews.findMany({
    where: eq(reviews.submissionId, submissionId),
    with: {
      curator: {
        columns: {
          id: true,
          name: true,
          role: true
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

// Legacy functions for compatibility (to be updated/removed in marketplace implementation)
export async function checkIsCurator(userId: number) {
  const user = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user.length > 0 && (user[0].role === 'curator' || user[0].role === 'admin');
}

export async function getAllSubmissionsForReview(statusFilter?: string) {
  const user = await getUser();
  if (!user) {
    return [];
  }

  // Get committees where user is a curator
  const userCommittees = await db
    .select({ committeeId: committeeCurators.committeeId })
    .from(committeeCurators)
    .where(and(
      eq(committeeCurators.userId, user.id),
      eq(committeeCurators.isActive, true)
    ));

  // If user is not a curator of any committee, return empty
  if (userCommittees.length === 0) {
    return [];
  }

  const committeeIds = userCommittees.map(c => c.committeeId);

  // Build where conditions
  let whereConditions = [
    sql`${submissions.committeeId} IN (${sql.join(committeeIds.map(id => sql`${id}`), sql`, `)})`,
  ];

  if (statusFilter) {
    whereConditions.push(eq(submissions.status, statusFilter));
  }

  return await db.query.submissions.findMany({
    where: and(...whereConditions),
    with: {
      submitter: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      },
      committee: {
        columns: {
          id: true,
          name: true
        }
      },
      grantProgram: {
        columns: {
          id: true,
          name: true,
          fundingAmount: true
        }
      },
      milestones: {
        columns: {
          id: true,
          title: true,
          status: true
        }
      }
    },
    orderBy: [desc(submissions.createdAt)]
  });
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

  // Get committees where user is a curator
  const userCommittees = await db
    .select({ committeeId: committeeCurators.committeeId })
    .from(committeeCurators)
    .where(and(
      eq(committeeCurators.userId, user.id),
      eq(committeeCurators.isActive, true)
    ));

  // If user is not a curator of any committee, return zeros
  if (userCommittees.length === 0) {
    return {
      total: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
    };
  }

  const committeeIds = userCommittees.map(c => c.committeeId);
  const committeeFilter = sql`${submissions.committeeId} IN (${sql.join(committeeIds.map(id => sql`${id}`), sql`, `)})`;

  const totalResult = await db.select().from(submissions).where(committeeFilter);
  const submittedResult = await db.select().from(submissions).where(and(committeeFilter, eq(submissions.status, 'pending')));
  const underReviewResult = await db.select().from(submissions).where(and(committeeFilter, eq(submissions.status, 'under_review')));
  const approvedResult = await db.select().from(submissions).where(and(committeeFilter, eq(submissions.status, 'approved')));
  const rejectedResult = await db.select().from(submissions).where(and(committeeFilter, eq(submissions.status, 'rejected')));

  return {
    total: totalResult.length || 0,
    submitted: submittedResult.length || 0,
    underReview: underReviewResult.length || 0,
    approved: approvedResult.length || 0,
    rejected: rejectedResult.length || 0,
  };
}

// Backwards compatibility - return null since teams are removed
export async function getTeamForUser() {
  return null;
}

// Activity logs - simplified since we removed the table
export async function getActivityLogs() {
  // Return empty array since we removed activity logs table
  // In future, could be replaced with user action history from other tables
  return [];
}

// Enhanced submission data with all related information for curator review
export async function getSubmissionForCuratorReview(submissionId: number) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      submitter: {
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
          githubId: true
        }
      },
      committee: {
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
                      role: true
                    }
                  }
                },
                orderBy: [messages.createdAt]
              }
            }
          },
          reviews: {
            with: {
              curator: {
                columns: {
                  id: true,
                  name: true,
                  role: true
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
                  role: true
                }
              }
            },
            orderBy: [messages.createdAt]
          }
        }
      },
      reviews: {
        with: {
          curator: {
            columns: {
              id: true,
              name: true,
              role: true
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
          role: true
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

  // Get pending reviews (submissions or milestones without curator's vote)
  const pendingSubmissionReviews = await db.query.reviews.findMany({
    where: and(
      eq(reviews.submissionId, submissionId),
      eq(reviews.curatorId, user.id)
    )
  });

  const pendingMilestoneReviews = await db.query.reviews.findMany({
    where: and(
      sql`${reviews.milestoneId} IN (
        SELECT ${milestones.id} FROM ${milestones} WHERE ${milestones.submissionId} = ${submissionId}
      )`,
      eq(reviews.curatorId, user.id)
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
                  role: true
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
                  role: true
                }
              }
            },
            orderBy: [messages.createdAt]
          }
        }
      },
      reviews: {
        with: {
          curator: {
            columns: {
              id: true,
              name: true,
              role: true
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
