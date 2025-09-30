import type { User } from '@/lib/db/schema'

export interface SubmissionContext {
  isSubmissionOwner: boolean
  isCommitteeReviewer: boolean
  viewType: 'reviewer' | 'grantee' | 'public'
}

interface SubmissionWithContext {
  submitterId: number
  reviewerGroupId: number | null
  status: string
  userContext?: {
    isSubmissionOwner: boolean
    isCommitteeReviewer: boolean
  }
}

/**
 * Simple hook to determine view type from submission data
 * All permission checks should be done server-side
 */
export function useSubmissionContext(
  submission: SubmissionWithContext | null,
  currentUser: User | null
): SubmissionContext {
  if (!submission || !currentUser) {
    return {
      isSubmissionOwner: false,
      isCommitteeReviewer: false,
      viewType: 'public',
    }
  }

  // Use server-calculated context if available, otherwise fallback to client calculation
  const isSubmissionOwner =
    submission.userContext?.isSubmissionOwner ??
    submission.submitterId === currentUser.id
  const isCommitteeReviewer =
    submission.userContext?.isCommitteeReviewer ?? false

  // Determine view type
  let viewType: 'reviewer' | 'grantee' | 'public' = 'public'
  if (isCommitteeReviewer) {
    viewType = 'reviewer'
  } else if (isSubmissionOwner) {
    viewType = 'grantee'
  }

  return {
    isSubmissionOwner,
    isCommitteeReviewer,
    viewType,
  }
}
