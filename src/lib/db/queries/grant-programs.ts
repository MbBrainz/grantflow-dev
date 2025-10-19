import { eq, and } from 'drizzle-orm'
import { db } from '../drizzle'
import { grantPrograms, groupMemberships } from '../schema'
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
