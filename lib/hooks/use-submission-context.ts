'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/db/schema';

interface SubmissionUserContext {
  user: User | null;
  isAuthenticated: boolean;
  role: 'reviewer' | 'grantee' | 'admin' | null;
  
  // Submission-specific permissions
  isSubmissionOwner: boolean;
  isCommitteeReviewer: boolean;
  committeeRole: 'admin' | 'reviewer' | null;
  canVote: boolean;
  canEditSubmission: boolean;
  canViewPrivateDiscussions: boolean;
  canManageWorkflow: boolean;
  canTriggerPayouts: boolean;
  
  // View determination
  viewType: 'reviewer' | 'grantee' | 'public';
  
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
    isCommitteeReviewer: false,
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
      
      // Check if user is reviewer for this submission's committee
      let isCommitteeReviewer = false;
      let committeeRole: 'admin' | 'reviewer' | null = null;
      
      if (currentUser && role === 'committee' && (submission as any).reviewerGroupId) {
        try {
          // Check if user is member of the reviewing committee group
          const response = await fetch(`/api/user/committee-membership?userId=${currentUser.id}&groupId=${(submission as any).reviewerGroupId}`);
          if (response.ok) {
            const membership = await response.json();
            isCommitteeReviewer = membership.isMember;
            committeeRole = membership.role;
          } else {
            // Fallback: assume committee role has general access
            isCommitteeReviewer = role === 'committee';
          }
        } catch (error) {
          console.error('[useSubmissionContext]: Error checking reviewer status', error);
          // Fallback: assume committee role has general access  
          isCommitteeReviewer = role === 'committee';
        }
      }

      // Determine permissions based on role and relationship
      const canVote = isCommitteeReviewer && !isSubmissionOwner;
      const canEditSubmission = isSubmissionOwner && (
        submission.status === 'draft' || 
        submission.status === 'changes_requested'
      );
      const canViewPrivateDiscussions = isCommitteeReviewer || currentUser?.primaryRole === 'committee';
      const canManageWorkflow = isCommitteeReviewer || currentUser?.primaryRole === 'committee';
      const canTriggerPayouts = isCommitteeReviewer || currentUser?.primaryRole === 'committee';

      // Determine primary view type
      let viewType: 'reviewer' | 'grantee' | 'public' = 'public';
      if (isCommitteeReviewer) {
        viewType = 'reviewer';
      } else if (isSubmissionOwner) {
        viewType = 'grantee';
      }

      setContext({
        user: currentUser,
        isAuthenticated,
        role: role === 'committee' ? 'reviewer' as const : role === 'team' ? 'grantee' as const : null,
        isSubmissionOwner,
        isCommitteeReviewer,
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