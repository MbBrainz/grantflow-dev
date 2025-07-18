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
  committeeRole: 'admin' | 'curator' | 'reviewer' | null;
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
  submission: any | null, // Accept any submission-like object
  currentUser: User | null
): SubmissionUserContext {
  const [context, setContext] = useState<SubmissionUserContext>({
    user: null,
    isAuthenticated: false,
    role: null,
    isSubmissionOwner: false,
    isCommitteeCurator: false,
    committeeRole: null,
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
      const role = currentUser?.primaryRole as 'committee' | 'team' | null;
      
      // Basic ownership and committee checks
      const isSubmissionOwner = currentUser?.id === submission.submitterId;
      
      // Check if user is curator for this submission's committee
      let isCommitteeCurator = false;
      let committeeRole: 'admin' | 'curator' | 'reviewer' | null = null;
      
      if (currentUser && role === 'committee' && (submission as any).reviewerGroupId) {
        try {
          // Check if user is member of the reviewing committee group
          const response = await fetch(`/api/user/committee-membership?userId=${currentUser.id}&groupId=${(submission as any).reviewerGroupId}`);
          if (response.ok) {
            const membership = await response.json();
            isCommitteeCurator = membership.isMember;
            committeeRole = membership.role;
          } else {
            // Fallback: assume committee role has general access
            isCommitteeCurator = role === 'committee';
          }
        } catch (error) {
          console.error('[useSubmissionContext]: Error checking curator status', error);
          // Fallback: assume committee role has general access  
          isCommitteeCurator = role === 'committee';
        }
      }

      // Determine permissions based on role and relationship
      const canVote = isCommitteeCurator && !isSubmissionOwner;
      const canEditSubmission = isSubmissionOwner && (
        submission.status === 'draft' || 
        submission.status === 'changes_requested'
      );
      const canViewPrivateDiscussions = isCommitteeCurator || currentUser?.primaryRole === 'committee';
      const canManageWorkflow = isCommitteeCurator || currentUser?.primaryRole === 'committee';
      const canTriggerPayouts = isCommitteeCurator || currentUser?.primaryRole === 'committee';

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
        role: role === 'committee' ? 'curator' as const : role === 'team' ? 'grantee' as const : null,
        isSubmissionOwner,
        isCommitteeCurator,
        committeeRole,
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