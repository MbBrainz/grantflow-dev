import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  bigint,
  boolean,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { groups } from './groups'
import { submissions } from './submissions'

export const grantPrograms = pgTable('grant_programs', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  fundingAmount: bigint('funding_amount', { mode: 'number' }),
  minGrantSize: bigint('min_grant_size', { mode: 'number' }), // Minimum total grant size per submission
  maxGrantSize: bigint('max_grant_size', { mode: 'number' }), // Maximum total grant size per submission
  minMilestoneSize: bigint('min_milestone_size', { mode: 'number' }), // Minimum payout per milestone
  maxMilestoneSize: bigint('max_milestone_size', { mode: 'number' }), // Maximum payout per milestone
  requirements: text('requirements'), // JSON structured requirements
  applicationTemplate: text('application_template'), // JSON form template
  milestoneStructure: text('milestone_structure'), // JSON milestone template
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const grantProgramsRelations = relations(
  grantPrograms,
  ({ one, many }) => ({
    group: one(groups, {
      fields: [grantPrograms.groupId],
      references: [groups.id],
    }),
    submissions: many(submissions),
  })
)

export const insertGrantProgramSchema = createInsertSchema(grantPrograms)
export const selectGrantProgramSchema = createSelectSchema(grantPrograms)

export type GrantProgram = typeof grantPrograms.$inferSelect
export type NewGrantProgram = typeof grantPrograms.$inferInsert
