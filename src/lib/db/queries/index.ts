// Re-export all organized query functions

// User queries
export * from './users'

// Group queries
export * from './groups'

// Discussion queries
export * from './discussions'

// Milestone queries
export * from './milestones'

// Submission queries
export * from './submissions'

// Review queries
export * from './reviews'

// Payout queries
export * from './payouts'

// Notification queries
export * from './notifications'

// Re-export write functions for convenience
export {
  createGroup,
  updateGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  createGrantProgram,
  updateGrantProgram,
} from '../writes/groups'

export {
  ensureDiscussionForSubmission,
  ensureDiscussionForMilestone,
  createMessage,
} from '../writes/discussions'

export { createPayout, completeMilestoneWithPayout } from '../writes/payouts'

export {
  createNotification,
  markNotificationAsRead,
} from '../writes/notifications'
