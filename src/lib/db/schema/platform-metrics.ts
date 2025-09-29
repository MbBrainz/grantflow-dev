import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  bigint,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export const platformMetrics = pgTable('platform_metrics', {
  id: serial('id').primaryKey(),
  period: varchar('period', { length: 20 }).notNull(), // 'monthly' | 'quarterly' | 'yearly'
  totalGroups: integer('total_groups').notNull().default(0),
  totalSubmissions: integer('total_submissions').notNull().default(0),
  totalFunding: bigint('total_funding', { mode: 'number' })
    .notNull()
    .default(0),
  averageSuccessRate: integer('average_success_rate').default(0), // percentage
  popularTags: text('popular_tags'), // JSON array of popular project tags
  trendingGroups: text('trending_groups'), // JSON array of group IDs
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const insertPlatformMetricsSchema = createInsertSchema(platformMetrics)
export const selectPlatformMetricsSchema = createSelectSchema(platformMetrics)

export type PlatformMetrics = typeof platformMetrics.$inferSelect
export type NewPlatformMetrics = typeof platformMetrics.$inferInsert
