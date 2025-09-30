import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { submissions } from './submissions'
import { milestones } from './milestones'
import { groups } from './groups'
import { messages } from './messages'

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
})

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
}))

export const insertDiscussionSchema = createInsertSchema(discussions)
export const selectDiscussionSchema = createSelectSchema(discussions)

export type Discussion = typeof discussions.$inferSelect
export type NewDiscussion = typeof discussions.$inferInsert

// Discussion with relations
import type { Message } from './messages'
export type DiscussionWithMessages = Discussion & {
  messages: (Message & {
    author: {
      id: number
      name: string | null
      primaryRole: string
    }
  })[]
}
