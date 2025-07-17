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
  role: varchar('role', { length: 20 }).notNull().default('member'),
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

export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  githubPrId: varchar('github_pr_id', { length: 64 }),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  labels: text('labels'), // comma-separated or JSON
  walletAddress: varchar('wallet_address', { length: 64 }),
  formData: text('form_data'), // JSON stringified
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const milestones = pgTable('milestones', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').notNull().references(() => submissions.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  repoUrl: varchar('repo_url', { length: 255 }),
  branch: varchar('branch', { length: 128 }),
  commit: varchar('commit', { length: 64 }),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Discussion system tables
export const discussions = pgTable('discussions', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').references(() => submissions.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  type: varchar('type', { length: 20 }).notNull(), // 'submission' | 'milestone'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  discussionId: integer('discussion_id').notNull().references(() => discussions.id),
  authorId: integer('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 20 }).notNull().default('comment'), // 'comment' | 'status_change' | 'vote'
  metadata: text('metadata'), // JSON for structured data like votes
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(),
  submissionId: integer('submission_id').references(() => submissions.id),
  discussionId: integer('discussion_id').references(() => discussions.id),
  read: boolean('read').notNull().default(false),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Updated reviews table to support both submissions and milestones
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id').references(() => submissions.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  curatorId: integer('curator_id').notNull().references(() => users.id),
  discussionId: integer('discussion_id').references(() => discussions.id),
  vote: varchar('vote', { length: 16 }), // approve, reject, abstain
  feedback: text('feedback'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  milestoneId: integer('milestone_id').notNull().references(() => milestones.id),
  txHash: varchar('tx_hash', { length: 128 }),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  amount: bigint('amount', { mode: 'number' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
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
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
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
  reviews: many(reviews),
  payout: many(payouts),
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
  submission: one(submissions, {
    fields: [notifications.submissionId],
    references: [submissions.id],
  }),
  discussion: one(discussions, {
    fields: [notifications.discussionId],
    references: [discussions.id],
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
  milestone: one(milestones, {
    fields: [payouts.milestoneId],
    references: [milestones.id],
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

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
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
