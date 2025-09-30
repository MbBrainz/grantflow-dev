// Re-export all tables
export * from './schema/users'
export * from './schema/groups'
export * from './schema/group-memberships'
export * from './schema/grant-programs'
export * from './schema/submissions'
export * from './schema/discussions'
export * from './schema/messages'
export * from './schema/milestones'
export * from './schema/reviews'
export * from './schema/payouts'
export * from './schema/notifications'
export * from './schema/group-analytics'
export * from './schema/platform-metrics'

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

// Submission with related data
import type { User } from './schema/users'
import type { Group } from './schema/groups'
import type { GrantProgram } from './schema/grant-programs'
import type { Submission } from './schema/submissions'
import type { Milestone } from './schema/milestones'
import type { DiscussionWithMessages } from './schema/discussions'
import type { Review } from './schema/reviews'

export type SubmissionWithMilestones = Submission & {
  milestones: Milestone[]
  submitter: User
  submitterGroup: Group
  reviewerGroup: Group
  grantProgram: GrantProgram
  discussions?: DiscussionWithMessages[]
  reviews?: (Review & {
    reviewer: {
      id: number
      name: string | null
      primaryRole: string | null
    }
  })[]
  userContext?: {
    isSubmissionOwner: boolean
    isCommitteeReviewer: boolean
  }
}
