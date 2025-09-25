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
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: text('password_hash'),
  githubId: varchar('github_id', { length: 64 }),
  walletAddress: varchar('wallet_address', { length: 64 }),
  primaryGroupId: integer('primary_group_id'), // Will reference groups.id
  primaryRole: varchar('primary_role', { length: 20 }).notNull().default('team'), // 'committee' | 'team'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Unified groups table for both committees and teams
export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 255 }),
  type: varchar('type', { length: 20 }).notNull(), // 'committee' | 'team'
  focusAreas: text('focus_areas'), // JSON array of focus areas
  websiteUrl: varchar('website_url', { length: 255 }),
  githubOrg: varchar('github_org', { length: 100 }),
  walletAddress: varchar('wallet_address', { length: 64 }),
  isActive: boolean('is_active').notNull().default(true),
  settings: text('settings'), // JSON configuration (voting thresholds, approval workflows, etc.)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Unified memberships for all groups (committees and teams)
export const groupMemberships = pgTable('group_memberships', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  role: varchar('role', { length: 20 }).notNull().default('member'), // 'admin' | 'member'
  permissions: text('permissions'), // JSON array of permissions
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
});

export const grantPrograms = pgTable('grant_programs', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
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
  submitterGroupId: integer('submitter_group_id')
    .notNull()
    .references(() => groups.id), // team that submitted
  reviewerGroupId: integer('reviewer_group_id')
    .notNull()
    .references(() => groups.id), // committee reviewing
  submitterId: integer('submitter_id').notNull().references(() => users.id), // individual who submitted
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  executiveSummary: text('executive_summary'),
  milestones: text('milestones'), // JSON milestone data
  postGrantPlan: text('post_grant_plan'),
  labels: text('labels'), // JSON array of project labels
  githubRepoUrl: varchar('github_repo_url', { length: 255 }),
  walletAddress: varchar('wallet_address', { length: 64 }), // Grantee wallet
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  totalAmount: bigint('total_amount', { mode: 'number' }),
  appliedAt: timestamp('applied_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const discussions = pgTable('discussions', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').references(() => submissions.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  type: varchar('type', { length: 20 }).notNull().default('submission'), // 'submission' | 'milestone' | 'group_internal'
  isPublic: boolean('is_public').notNull().default(true), // Public transparency
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  discussionId: integer('discussion_id').notNull().references(() => discussions.id),
  authorId: integer('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 30 }).notNull().default('comment'), // 'comment' | 'status_change' | 'vote' | 'group_decision'
  metadata: text('metadata'), // JSON for structured data like votes, group decisions
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const milestones = pgTable('milestones', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').notNull().references(() => submissions.id),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  requirements: text('requirements'), // What needs to be delivered
  amount: bigint('amount', { mode: 'number' }),
  dueDate: timestamp('due_date'),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  deliverables: text('deliverables'), // JSON array of deliverable items
  githubRepoUrl: varchar('github_repo_url', { length: 255 }),
  githubPrUrl: varchar('github_pr_url', { length: 255 }),
  githubCommitHash: varchar('github_commit_hash', { length: 64 }),
  codeAnalysis: text('code_analysis'), // AI analysis of code changes
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Group reviews (committee members reviewing submissions/milestones)
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').references(() => submissions.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  reviewerId: integer('reviewer_id').notNull().references(() => users.id),
  discussionId: integer('discussion_id').references(() => discussions.id),
  vote: varchar('vote', { length: 16 }), // approve, reject, abstain
  feedback: text('feedback'),
  reviewType: varchar('review_type', { length: 20 }).notNull().default('standard'), // 'standard' | 'final' | 'milestone'
  weight: integer('weight').notNull().default(1), // voting weight for this reviewer
  isBinding: boolean('is_binding').notNull().default(false), // whether this review is binding
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').references(() => submissions.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  transactionHash: varchar('transaction_hash', { length: 128 }),
  blockExplorerUrl: varchar('block_explorer_url', { length: 500 }),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  triggeredBy: integer('triggered_by').references(() => users.id), // group member who triggered
  approvedBy: integer('approved_by').references(() => users.id), // final approver
  walletFrom: varchar('wallet_from', { length: 64 }), // group wallet
  walletTo: varchar('wallet_to', { length: 64 }), // recipient wallet
  createdAt: timestamp('created_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  groupId: integer('group_id').references(() => groups.id), // group-specific notifications
  type: varchar('type', { length: 32 }).notNull(),
  submissionId: integer('submission_id').references(() => submissions.id),
  discussionId: integer('discussion_id').references(() => discussions.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  read: boolean('read').notNull().default(false),
  content: text('content').notNull(),
  priority: varchar('priority', { length: 16 }).notNull().default('normal'), // 'low' | 'normal' | 'high' | 'urgent'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  readAt: timestamp('read_at'),
});

// Analytics tables
export const groupAnalytics = pgTable('group_analytics', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  period: varchar('period', { length: 20 }).notNull(), // 'monthly' | 'quarterly' | 'yearly'
  totalSubmissions: integer('total_submissions').notNull().default(0),
  approvedSubmissions: integer('approved_submissions').notNull().default(0),
  totalFunding: bigint('total_funding', { mode: 'number' }).notNull().default(0),
  averageApprovalTime: integer('average_approval_time'), // in hours
  memberActivity: text('member_activity'), // JSON member activity data
  publicRating: integer('public_rating').default(0), // 1-5 rating
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const platformMetrics = pgTable('platform_metrics', {
  id: serial('id').primaryKey(),
  period: varchar('period', { length: 20 }).notNull(), // 'monthly' | 'quarterly' | 'yearly'
  totalGroups: integer('total_groups').notNull().default(0),
  totalSubmissions: integer('total_submissions').notNull().default(0),
  totalFunding: bigint('total_funding', { mode: 'number' }).notNull().default(0),
  averageSuccessRate: integer('average_success_rate').default(0), // percentage
  popularTags: text('popular_tags'), // JSON array of popular project tags
  trendingGroups: text('trending_groups'), // JSON array of group IDs
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  primaryGroup: one(groups, {
    fields: [users.primaryGroupId],
    references: [groups.id],
  }),
  groupMemberships: many(groupMemberships),
  submissions: many(submissions),
  discussionMessages: many(messages),
  reviews: many(reviews),
  notifications: many(notifications),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  grantPrograms: many(grantPrograms),
  members: many(groupMemberships),
  submittedSubmissions: many(submissions, { relationName: 'submitterGroup' }),
  reviewingSubmissions: many(submissions, { relationName: 'reviewerGroup' }),
  discussions: many(discussions),
  milestones: many(milestones, { relationName: 'milestoneGroup' }),
  reviews: many(reviews),
  payouts: many(payouts),
  analytics: many(groupAnalytics),
  primaryUsers: many(users),
}));

export const groupMembershipsRelations = relations(groupMemberships, ({ one }) => ({
  group: one(groups, {
    fields: [groupMemberships.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMemberships.userId],
    references: [users.id],
  }),
}));

export const grantProgramsRelations = relations(grantPrograms, ({ one, many }) => ({
  group: one(groups, {
    fields: [grantPrograms.groupId],
    references: [groups.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  grantProgram: one(grantPrograms, {
    fields: [submissions.grantProgramId],
    references: [grantPrograms.id],
  }),
  submitterGroup: one(groups, {
    fields: [submissions.submitterGroupId],
    references: [groups.id],
    relationName: 'submitterGroup',
  }),
  reviewerGroup: one(groups, {
    fields: [submissions.reviewerGroupId],
    references: [groups.id],
    relationName: 'reviewerGroup',
  }),
  submitter: one(users, {
    fields: [submissions.submitterId],
    references: [users.id],
  }),
  discussions: many(discussions),
  milestones: many(milestones),
  reviews: many(reviews),
  payouts: many(payouts),
  notifications: many(notifications),
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
  group: one(groups, {
    fields: [discussions.groupId],
    references: [groups.id],
  }),
  messages: many(messages),
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

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  submission: one(submissions, {
    fields: [milestones.submissionId],
    references: [submissions.id],
  }),
  group: one(groups, {
    fields: [milestones.groupId],
    references: [groups.id],
    relationName: 'milestoneGroup',
  }),
  discussions: many(discussions),
  reviews: many(reviews),
  payouts: many(payouts),
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
  group: one(groups, {
    fields: [reviews.groupId],
    references: [groups.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
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
  group: one(groups, {
    fields: [payouts.groupId],
    references: [groups.id],
  }),
  triggeredByUser: one(users, {
    fields: [payouts.triggeredBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [payouts.approvedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [notifications.groupId],
    references: [groups.id],
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

export const groupAnalyticsRelations = relations(groupAnalytics, ({ one }) => ({
  group: one(groups, {
    fields: [groupAnalytics.groupId],
    references: [groups.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertGroupSchema = createInsertSchema(groups);
export const selectGroupSchema = createSelectSchema(groups);
export const insertGroupMembershipSchema = createInsertSchema(groupMemberships);
export const selectGroupMembershipSchema = createSelectSchema(groupMemberships);
export const insertGrantProgramSchema = createInsertSchema(grantPrograms);
export const selectGrantProgramSchema = createSelectSchema(grantPrograms);
export const insertSubmissionSchema = createInsertSchema(submissions);
export const selectSubmissionSchema = createSelectSchema(submissions);
export const insertDiscussionSchema = createInsertSchema(discussions);
export const selectDiscussionSchema = createSelectSchema(discussions);
export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export const insertMilestoneSchema = createInsertSchema(milestones);
export const selectMilestoneSchema = createSelectSchema(milestones);
export const insertReviewSchema = createInsertSchema(reviews);
export const selectReviewSchema = createSelectSchema(reviews);
export const insertPayoutSchema = createInsertSchema(payouts);
export const selectPayoutSchema = createSelectSchema(payouts);
export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMembership = typeof groupMemberships.$inferSelect;
export type NewGroupMembership = typeof groupMemberships.$inferInsert;
export type GrantProgram = typeof grantPrograms.$inferSelect;
export type NewGrantProgram = typeof grantPrograms.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type Discussion = typeof discussions.$inferSelect;
export type NewDiscussion = typeof discussions.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type GroupAnalytics = typeof groupAnalytics.$inferSelect;
export type NewGroupAnalytics = typeof groupAnalytics.$inferInsert;
export type PlatformMetrics = typeof platformMetrics.$inferSelect;
export type NewPlatformMetrics = typeof platformMetrics.$inferInsert;

// Submission with related data
export type SubmissionWithMilestones = Submission & {
  milestones: Milestone[];
  submitter: User;
  submitterGroup: Group;
  reviewerGroup: Group;
  grantProgram: GrantProgram;
};

// Activity types for logging
export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_SUBMISSION = 'CREATE_SUBMISSION',
  UPDATE_SUBMISSION = 'UPDATE_SUBMISSION',
  DELETE_SUBMISSION = 'DELETE_SUBMISSION',
  ADD_MILESTONE = 'ADD_MILESTONE',
  UPDATE_MILESTONE = 'UPDATE_MILESTONE',
  SUBMIT_REVIEW = 'SUBMIT_REVIEW',
  CREATE_GROUP = 'CREATE_GROUP',
  JOIN_GROUP = 'JOIN_GROUP',
  LEAVE_GROUP = 'LEAVE_GROUP',
}
