import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  bigint,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { One, Many } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).unique(), // not always required for wallet-only
  passwordHash: text('password_hash'), // optional for wallet-only
  githubId: varchar('github_id', { length: 64 }),
  walletAddress: varchar('wallet_address', { length: 64 }),
  role: varchar('role', { length: 20 }).notNull().default('grantee'), // 'grantee' | 'curator' | 'admin'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// Grant committee/organization tables
export const committees = pgTable('committees', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 255 }),
  focusAreas: text('focus_areas'), // JSON array of focus areas
  websiteUrl: varchar('website_url', { length: 255 }),
  githubOrg: varchar('github_org', { length: 100 }),
  walletAddress: varchar('wallet_address', { length: 64 }),
  isActive: boolean('is_active').notNull().default(true),
  votingThreshold: integer('voting_threshold').notNull().default(2), // minimum votes needed
  approvalWorkflow: text('approval_workflow'), // JSON configuration
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const committeeCurators = pgTable('committee_curators', {
  id: serial('id').primaryKey(),
  committeeId: integer('committee_id')
    .notNull()
    .references(() => committees.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  role: varchar('role', { length: 20 }).notNull().default('curator'), // 'admin' | 'curator' | 'reviewer'
  permissions: text('permissions'), // JSON array of permissions
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
});

export const grantPrograms = pgTable('grant_programs', {
  id: serial('id').primaryKey(),
  committeeId: integer('committee_id')
    .notNull()
    .references(() => committees.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  fundingAmount: bigint('funding_amount', { mode: 'number' }),
  requirements: text('requirements'), // JSON structured requirements
  applicationTemplate: text('application_template'), // JSON form template
  milestoneStructure: text('milestone_structure'), // JSON milestone template
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  grantProgramId: integer('grant_program_id')
    .notNull()
    .references(() => grantPrograms.id),
  committeeId: integer('committee_id')
    .notNull()
    .references(() => committees.id),
  submitterId: integer('submitter_id').notNull().references(() => users.id), // renamed from userId for clarity
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  executiveSummary: text('executive_summary'),
  milestones: text('milestones'), // JSON milestone data
  postGrantPlan: text('post_grant_plan'),
  labels: text('labels'), // JSON array of project labels
  githubRepoUrl: varchar('github_repo_url', { length: 255 }), // Reference only, no PR creation
  walletAddress: varchar('wallet_address', { length: 64 }), // Grantee wallet
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  totalAmount: bigint('total_amount', { mode: 'number' }),
  appliedAt: timestamp('applied_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const milestones = pgTable('milestones', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').notNull().references(() => submissions.id),
  committeeId: integer('committee_id')
    .notNull()
    .references(() => committees.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  requirements: text('requirements'),
  amount: bigint('amount', { mode: 'number' }),
  dueDate: timestamp('due_date'),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  deliverables: text('deliverables'), // JSON deliverable data
  githubRepoUrl: varchar('github_repo_url', { length: 255 }),
  githubPrUrl: varchar('github_pr_url', { length: 255 }),
  githubCommitHash: varchar('github_commit_hash', { length: 64 }),
  codeAnalysis: text('code_analysis'), // JSON AI analysis of code changes
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Discussion system tables (committee-specific)
export const discussions = pgTable('discussions', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').references(() => submissions.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  committeeId: integer('committee_id')
    .notNull()
    .references(() => committees.id),
  type: varchar('type', { length: 20 }).notNull(), // 'submission' | 'milestone' | 'committee_internal'
  isPublic: boolean('is_public').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  discussionId: integer('discussion_id').notNull().references(() => discussions.id),
  authorId: integer('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 30 }).notNull().default('comment'), // 'comment' | 'status_change' | 'vote' | 'committee_decision'
  metadata: text('metadata'), // JSON for structured data like votes, committee decisions
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  committeeId: integer('committee_id').references(() => committees.id),
  type: varchar('type', { length: 50 }).notNull(),
  submissionId: integer('submission_id').references(() => submissions.id),
  discussionId: integer('discussion_id').references(() => discussions.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  read: boolean('read').notNull().default(false),
  content: text('content').notNull(),
  priority: varchar('priority', { length: 10 }).notNull().default('normal'), // 'low' | 'normal' | 'high'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  readAt: timestamp('read_at'),
});

// Committee curator reviews
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').references(() => submissions.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  committeeId: integer('committee_id')
    .notNull()
    .references(() => committees.id),
  curatorId: integer('curator_id').notNull().references(() => users.id),
  discussionId: integer('discussion_id').references(() => discussions.id),
  vote: varchar('vote', { length: 16 }), // approve, reject, abstain
  feedback: text('feedback'),
  reviewType: varchar('review_type', { length: 20 }).notNull().default('standard'), // 'standard' | 'final' | 'milestone'
  weight: integer('weight').notNull().default(1), // voting weight for this curator
  isBinding: boolean('is_binding').notNull().default(false), // whether this review is binding
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').notNull().references(() => submissions.id),
  milestoneId: integer('milestone_id').notNull().references(() => milestones.id),
  committeeId: integer('committee_id')
    .notNull()
    .references(() => committees.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  transactionHash: varchar('transaction_hash', { length: 128 }),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  triggeredBy: integer('triggered_by').references(() => users.id), // curator who triggered
  approvedBy: text('approved_by'), // JSON array of curator IDs who approved
  walletFrom: varchar('wallet_from', { length: 64 }), // committee wallet
  walletTo: varchar('wallet_to', { length: 64 }), // grantee wallet
  createdAt: timestamp('created_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
});

// Analytics tables
export const committeeAnalytics = pgTable('committee_analytics', {
  id: serial('id').primaryKey(),
  committeeId: integer('committee_id')
    .notNull()
    .references(() => committees.id),
  period: varchar('period', { length: 20 }).notNull(), // 'monthly' | 'quarterly' | 'yearly'
  totalSubmissions: integer('total_submissions').notNull().default(0),
  approvedSubmissions: integer('approved_submissions').notNull().default(0),
  totalFunding: bigint('total_funding', { mode: 'number' }).notNull().default(0),
  averageApprovalTime: integer('average_approval_time'), // in hours
  curatorActivity: text('curator_activity'), // JSON curator activity data
  publicRating: integer('public_rating').default(0), // 1-5 rating
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const platformMetrics = pgTable('platform_metrics', {
  id: serial('id').primaryKey(),
  period: varchar('period', { length: 20 }).notNull(), // 'monthly' | 'quarterly' | 'yearly'
  totalCommittees: integer('total_committees').notNull().default(0),
  totalSubmissions: integer('total_submissions').notNull().default(0),
  totalFunding: bigint('total_funding', { mode: 'number' }).notNull().default(0),
  averageSuccessRate: integer('average_success_rate').default(0), // percentage
  popularTags: text('popular_tags'), // JSON array of popular project tags
  trendingCommittees: text('trending_committees'), // JSON array of committee IDs
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  submissions: many(submissions),
  messages: many(messages),
  reviews: many(reviews),
  notifications: many(notifications),
  committeeMemberships: many(committeeCurators),
}));

// Committee relations
export const committeesRelations = relations(committees, ({ many }) => ({
  curators: many(committeeCurators),
  grantPrograms: many(grantPrograms),
  submissions: many(submissions),
  discussions: many(discussions),
  reviews: many(reviews),
  milestones: many(milestones),
  payouts: many(payouts),
  notifications: many(notifications),
  analytics: many(committeeAnalytics),
}));

export const committeeCuratorsRelations = relations(committeeCurators, ({ one }) => ({
  committee: one(committees, {
    fields: [committeeCurators.committeeId],
    references: [committees.id],
  }),
  user: one(users, {
    fields: [committeeCurators.userId],
    references: [users.id],
  }),
}));

export const grantProgramsRelations = relations(grantPrograms, ({ one, many }) => ({
  committee: one(committees, {
    fields: [grantPrograms.committeeId],
    references: [committees.id],
  }),
  submissions: many(submissions),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  submitter: one(users, {
    fields: [submissions.submitterId],
    references: [users.id],
  }),
  committee: one(committees, {
    fields: [submissions.committeeId],
    references: [committees.id],
  }),
  grantProgram: one(grantPrograms, {
    fields: [submissions.grantProgramId],
    references: [grantPrograms.id],
  }),
  milestones: many(milestones),
  discussions: many(discussions),
  reviews: many(reviews),
  notifications: many(notifications),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  submission: one(submissions, {
    fields: [milestones.submissionId],
    references: [submissions.id],
  }),
  committee: one(committees, {
    fields: [milestones.committeeId],
    references: [committees.id],
  }),
  reviews: many(reviews),
  payouts: many(payouts),
  discussions: many(discussions),
}));

export const discussionsRelations = relations(discussions, ({ one, many }) => ({
  submission: one(submissions, {
    fields: [discussions.submissionId],
    references: [submissions.id],
  }),
  milestone: one(milestones, {
    fields: [discussions.milestoneId],
    references: [milestones.id],
  }),
  committee: one(committees, {
    fields: [discussions.committeeId],
    references: [committees.id],
  }),
  messages: many(messages),
  reviews: many(reviews),
  notifications: many(notifications),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  discussion: one(discussions, {
    fields: [messages.discussionId],
    references: [discussions.id],
  }),
  author: one(users, {
    fields: [messages.authorId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  committee: one(committees, {
    fields: [notifications.committeeId],
    references: [committees.id],
  }),
  submission: one(submissions, {
    fields: [notifications.submissionId],
    references: [submissions.id],
  }),
  discussion: one(discussions, {
    fields: [notifications.discussionId],
    references: [discussions.id],
  }),
  milestone: one(milestones, {
    fields: [notifications.milestoneId],
    references: [milestones.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  submission: one(submissions, {
    fields: [reviews.submissionId],
    references: [submissions.id],
  }),
  milestone: one(milestones, {
    fields: [reviews.milestoneId],
    references: [milestones.id],
  }),
  committee: one(committees, {
    fields: [reviews.committeeId],
    references: [committees.id],
  }),
  curator: one(users, {
    fields: [reviews.curatorId],
    references: [users.id],
  }),
  discussion: one(discussions, {
    fields: [reviews.discussionId],
    references: [discussions.id],
  }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  submission: one(submissions, {
    fields: [payouts.submissionId],
    references: [submissions.id],
  }),
  milestone: one(milestones, {
    fields: [payouts.milestoneId],
    references: [milestones.id],
  }),
  committee: one(committees, {
    fields: [payouts.committeeId],
    references: [committees.id],
  }),
  triggeredByUser: one(users, {
    fields: [payouts.triggeredBy],
    references: [users.id],
  }),
}));

// Analytics relations
export const committeeAnalyticsRelations = relations(committeeAnalytics, ({ one }) => ({
  committee: one(committees, {
    fields: [committeeAnalytics.committeeId],
    references: [committees.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

// Committee-related types
export type Committee = typeof committees.$inferSelect;
export type NewCommittee = typeof committees.$inferInsert;
export type CommitteeCurator = typeof committeeCurators.$inferSelect;
export type NewCommitteeCurator = typeof committeeCurators.$inferInsert;
export type GrantProgram = typeof grantPrograms.$inferSelect;
export type NewGrantProgram = typeof grantPrograms.$inferInsert;

// Core application types
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
export type Discussion = typeof discussions.$inferSelect;
export type NewDiscussion = typeof discussions.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;

// Analytics types
export type CommitteeAnalytics = typeof committeeAnalytics.$inferSelect;
export type NewCommitteeAnalytics = typeof committeeAnalytics.$inferInsert;
export type PlatformMetrics = typeof platformMetrics.$inferSelect;
export type NewPlatformMetrics = typeof platformMetrics.$inferInsert;

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

// Complex committee types for marketplace features
export type CommitteeWithCurators = Committee & {
  curators: (CommitteeCurator & {
    user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  })[];
  grantPrograms: GrantProgram[];
};

export type SubmissionWithDetails = Submission & {
  submitter: Pick<User, 'id' | 'name' | 'email'>;
  committee: Pick<Committee, 'id' | 'name' | 'logoUrl'>;
  grantProgram: Pick<GrantProgram, 'id' | 'name' | 'fundingAmount'>;
  milestones: Milestone[];
  reviews: (Review & {
    curator: Pick<User, 'id' | 'name'>;
  })[];
};

export type CommitteeWithAnalytics = Committee & {
  analytics: CommitteeAnalytics[];
  _stats?: {
    totalSubmissions: number;
    approvalRate: number;
    averagePayoutTime: number;
    totalFunded: number;
  };
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
