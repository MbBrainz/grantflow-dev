import { eq, and, sql } from 'drizzle-orm'
import { db } from '../drizzle'
import {
  grantPrograms,
  groupMemberships,
  submissions,
  milestones,
} from '../schema'
import { getUser } from './users'

/**
 * Get grant program by ID with related data including group, members, and submissions
 */
export async function getGrantProgramWithDetails(id: number) {
  const program = await db.query.grantPrograms.findFirst({
    where: eq(grantPrograms.id, id),
    with: {
      group: {
        with: {
          members: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  primaryRole: true,
                },
              },
            },
            where: eq(groupMemberships.isActive, true),
          },
        },
      },
      submissions: {
        orderBy: (submissions, { desc }) => [desc(submissions.createdAt)],
        limit: 10,
        with: {
          submitter: {
            columns: {
              id: true,
              name: true,
            },
          },
          submitterGroup: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  return program
}

/**
 * Check if the current user is an admin of the grant program's committee
 */
export async function isGrantProgramAdmin(programId: number): Promise<boolean> {
  const user = await getUser()
  if (!user) return false

  const program = await db.query.grantPrograms.findFirst({
    where: eq(grantPrograms.id, programId),
  })

  if (!program) return false

  const membership = await db.query.groupMemberships.findFirst({
    where: and(
      eq(groupMemberships.userId, user.id),
      eq(groupMemberships.groupId, program.groupId),
      eq(groupMemberships.isActive, true)
    ),
  })

  return membership?.role === 'admin'
}

/**
 * Get all active grant programs
 */
export async function getActiveGrantPrograms() {
  return await db.query.grantPrograms.findMany({
    where: eq(grantPrograms.isActive, true),
    with: {
      group: {
        columns: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
    },
  })
}

export type GrantProgramWithDetails = Awaited<
  ReturnType<typeof getGrantProgramWithDetails>
>

export interface GrantProgramFinancial {
  programId: number
  totalBudget: number
  allocated: number
  spent: number
  remaining: number
  available: number
}

/**
 * Get financial metrics for a grant program
 * Returns total budget, allocated funds (approved grants), and spent funds (completed milestones)
 */
export async function getGrantProgramFinancials(
  programId: number
): Promise<GrantProgramFinancial | null> {
  // Get the program to access fundingAmount
  const program = await db.query.grantPrograms.findFirst({
    where: eq(grantPrograms.id, programId),
  })

  if (!program) {
    return null
  }

  // Calculate allocated: sum of totalAmount for approved submissions
  const allocatedResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${submissions.totalAmount}), 0)`,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.grantProgramId, programId),
        eq(submissions.status, 'approved')
      )
    )

  const allocated = Number(allocatedResult[0]?.total ?? 0)

  // Calculate spent: sum of amount for completed milestones
  // Join milestones with submissions to filter by program
  const spentResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${milestones.amount}), 0)`,
    })
    .from(milestones)
    .innerJoin(submissions, eq(milestones.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.grantProgramId, programId),
        eq(milestones.status, 'completed')
      )
    )

  const spent = Number(spentResult[0]?.total ?? 0)

  return {
    programId,
    totalBudget: program.fundingAmount ?? 0,
    allocated,
    spent,
    remaining: (program.fundingAmount ?? 0) - allocated,
    available: allocated - spent,
  }
}

/**
 * Get financial metrics for multiple grant programs
 */
export async function getGrantProgramsFinancials(programIds: number[]) {
  if (programIds.length === 0) return []

  const financials = await Promise.all(
    programIds.map(id => getGrantProgramFinancials(id))
  )

  return financials.filter(f => f !== null)
}
