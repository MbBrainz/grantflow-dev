import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { submissions } from './submissions'
import { milestones } from './milestones'
import { groups } from './groups'
import { users } from './users'
import { discussions } from './discussions'
import { createSchemaFactory } from 'drizzle-zod'

const { createInsertSchema, createSelectSchema } = createSchemaFactory({
  coerce: {
    number: true, // FormData sends numbers as strings
    date: true,
    boolean: true,
  },
})

const VOTE_OPTIONS = ['approve', 'reject', 'abstain'] as const
export const voteEnum = pgEnum('vote', VOTE_OPTIONS)

// Group reviews (committee members reviewing submissions/milestones)
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id')
    .notNull()
    .references(() => submissions.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  reviewerId: integer('reviewer_id')
    .notNull()
    .references(() => users.id),
  discussionId: integer('discussion_id').references(() => discussions.id),
  vote: voteEnum('vote'), // approve, reject, abstain
  feedback: text('feedback'),
  reviewType: varchar('review_type', { length: 20 })
    .notNull()
    .default('standard'), // 'standard' | 'final' | 'milestone'
  weight: integer('weight').notNull().default(1), // voting weight for this reviewer
  isBinding: boolean('is_binding').notNull().default(false), // whether this review is binding
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

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
}))
export const selectReviewSchema = createSelectSchema(reviews)
export const insertReviewSchema = createInsertSchema(reviews)

export type Vote = (typeof VOTE_OPTIONS)[number]
export type Review = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert
