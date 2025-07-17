import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import {
  activityLogs,
  teamMembers,
  teams,
  users,
  submissions,
  milestones,
  discussions,
  messages,
  notifications,
  reviews
} from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import type { NewDiscussion, NewMessage, NewNotification, NewReview } from './schema';
import { sql } from 'drizzle-orm';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}

// Discussion System Functions

export async function createDiscussion(data: NewDiscussion) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const result = await db.insert(discussions).values(data).returning();
  return result[0];
}

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

export async function createMessage(data: NewMessage) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const result = await db.insert(messages).values({
    ...data,
    authorId: user.id
  }).returning();

  // Update discussion timestamp
  await db
    .update(discussions)
    .set({ updatedAt: new Date() })
    .where(eq(discussions.id, data.discussionId));

  return result[0];
}

export async function getMessagesForDiscussion(discussionId: number) {
  return await db.query.messages.findMany({
    where: eq(messages.discussionId, discussionId),
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
  });
}

export async function createNotification(data: NewNotification) {
  const result = await db.insert(notifications).values(data).returning();
  return result[0];
}

export async function getNotificationsForUser() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db.query.notifications.findMany({
    where: eq(notifications.userId, user.id),
    with: {
      submission: {
        columns: {
          id: true,
          title: true,
          description: true,
          status: true
        }
      },
      discussion: {
        columns: {
          id: true,
          type: true
        }
      }
    },
    orderBy: [desc(notifications.createdAt)]
  });
}

export async function markNotificationAsRead(notificationId: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)));
}

export async function createReview(data: NewReview) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const result = await db.insert(reviews).values({
    ...data,
    curatorId: user.id
  }).returning();

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

export async function getReviewsForMilestone(milestoneId: number) {
  return await db.query.reviews.findMany({
    where: eq(reviews.milestoneId, milestoneId),
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

// Curator-specific queries for dashboard
export async function getAllSubmissionsForReview(statusFilter?: string) {
  const whereClause = statusFilter ? eq(submissions.status, statusFilter) : undefined;

  return await db.query.submissions.findMany({
    where: whereClause,
    with: {
      submitter: {
        columns: {
          id: true,
          name: true,
          email: true
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

export async function getSubmissionWithReviews(submissionId: number) {
  return await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: {
      submitter: {
        columns: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      },
      milestones: {
        columns: {
          id: true,
          title: true,
          description: true,
          status: true
        }
      }
    }
  });
}

export async function getSubmissionStats() {
  const [submissionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(submissions);

  const [submittedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(submissions)
    .where(eq(submissions.status, 'submitted'));

  const [underReviewCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(submissions)
    .where(eq(submissions.status, 'under_review'));

  const [approvedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(submissions)
    .where(eq(submissions.status, 'approved'));

  const [rejectedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(submissions)
    .where(eq(submissions.status, 'rejected'));

  return {
    total: submissionCount.count || 0,
    submitted: submittedCount.count || 0,
    underReview: underReviewCount.count || 0,
    approved: approvedCount.count || 0,
    rejected: rejectedCount.count || 0,
  };
}

export async function checkIsCurator(userId: number) {
  const user = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user.length > 0 && (user[0].role === 'curator' || user[0].role === 'admin');
}

// Helper function to create discussion when submission is created
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

    return await createDiscussion({
      submissionId,
      committeeId: submission[0].committeeId,
      type: 'submission'
    });
  }

  return existingDiscussion;
}

// Helper function to create discussion when milestone is created
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

    return await createDiscussion({
      milestoneId,
      committeeId: milestone[0].committeeId,
      type: 'milestone'
    });
  }

  return existingDiscussion;
}
