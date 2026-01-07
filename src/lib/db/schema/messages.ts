import { relations } from 'drizzle-orm'
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { createSchemaFactory } from 'drizzle-zod'
import { discussions } from './discussions'
import { users } from './users'

const { createInsertSchema, createSelectSchema } = createSchemaFactory({
  coerce: {
    number: true, // Handle form inputs
    date: true,
    boolean: true,
  },
})

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  discussionId: integer('discussion_id')
    .notNull()
    .references(() => discussions.id),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 30 })
    .notNull()
    .default('comment'), // 'comment' | 'status_change' | 'vote' | 'group_decision'
  metadata: text('metadata'), // JSON for structured data like votes, group decisions
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const messagesRelations = relations(messages, ({ one }) => ({
  discussion: one(discussions, {
    fields: [messages.discussionId],
    references: [discussions.id],
  }),
  author: one(users, {
    fields: [messages.authorId],
    references: [users.id],
  }),
}))

export const insertMessageSchema = createInsertSchema(messages)
export const selectMessageSchema = createSelectSchema(messages)

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
