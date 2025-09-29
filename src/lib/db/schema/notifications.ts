import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { users } from './users'
import { groups } from './groups'
import { submissions } from './submissions'
import { discussions } from './discussions'
import { milestones } from './milestones'

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
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
})

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
}))

export const insertNotificationSchema = createInsertSchema(notifications)
export const selectNotificationSchema = createSelectSchema(notifications)

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
