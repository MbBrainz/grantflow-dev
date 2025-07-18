'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/db/schema';

interface SubmissionUserContext {
  user: User | null;
  isAuthenticated: boolean;
  role: 'curator' | 'grantee' | 'admin' | null;
  
  // Submission-specific permissions
  isSubmissionOwner: boolean;
  isCommitteeCurator: boolean;
  canVote: boolean;
  canEditSubmission: boolean;
  canViewPrivateDiscussions: boolean;
  canManageWorkflow: boolean;
  canTriggerPayouts: boolean;
  
  // View determination
  viewType: 'curator' | 'grantee' | 'public';
  
  // Loading state
  isLoading: boolean;
}

interface SubmissionWithMilestones {
  id: number;
  submitterId: number;
  committeeId: number;
  status: string;
  // ... other fields
}

export function useSubmissionContext(
  submission: SubmissionWithMilestones | null,
  currentUser: User | null
): SubmissionUserContext {
  const [context, setContext] = useState<SubmissionUserContext>({
    user: null,
    isAuthenticated: false,
    role: null,
    isSubmissionOwner: false,
    isCommitteeCurator: false,
    canVote: false,
    canEditSubmission: false,
    canViewPrivateDiscussions: false,
    canManageWorkflow: false,
    canTriggerPayouts: false,
    viewType: 'public',
    isLoading: true,
  });

  useEffect(() => {
    async function determineUserContext() {
      if (!submission) {
        setContext(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const isAuthenticated = !!currentUser;
      const role = currentUser?.role as 'curator' | 'grantee' | 'admin' | null;
      
      // Basic ownership and committee checks
      const isSubmissionOwner = currentUser?.id === submission.submitterId;
      
      // Check if user is curator for this submission's committee
      let isCommitteeCurator = false;
      if (currentUser && role === 'curator') {
        try {
          // This would ideally be a server action or API call
          // For now, we'll assume curators have access to review submissions
          // TODO: Implement proper committee membership check
          isCommitteeCurator = role === 'curator';
        } catch (error) {
          console.error('[useSubmissionContext]: Error checking curator status', error);
        }
      }

      // Determine permissions based on role and relationship
      const canVote = isCommitteeCurator && !isSubmissionOwner;
      const canEditSubmission = isSubmissionOwner && (
        submission.status === 'draft' || 
        submission.status === 'changes_requested'
      );
      const canViewPrivateDiscussions = isCommitteeCurator || currentUser?.role === 'admin';
      const canManageWorkflow = isCommitteeCurator || currentUser?.role === 'admin';
      const canTriggerPayouts = isCommitteeCurator || currentUser?.role === 'admin';

      // Determine primary view type
      let viewType: 'curator' | 'grantee' | 'public' = 'public';
      if (isCommitteeCurator) {
        viewType = 'curator';
      } else if (isSubmissionOwner) {
        viewType = 'grantee';
      }

      setContext({
        user: currentUser,
        isAuthenticated,
        role,
        isSubmissionOwner,
        isCommitteeCurator,
        canVote,
        canEditSubmission,
        canViewPrivateDiscussions,
        canManageWorkflow,
        canTriggerPayouts,
        viewType,
        isLoading: false,
      });
    }

    determineUserContext();
  }, [submission, currentUser]);

  return context;
} 