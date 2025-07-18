'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { milestones } from '@/lib/db/schema';
import { 
  completeMilestoneWithPayout, 
  isUserCurator,
  getMilestoneById,
  getSubmissionById,
  createNotification,
  ensureDiscussionForMilestone,
  createMessage
} from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';

const CompleteMilestoneSchema = z.object({
  milestoneId: z.number(),
  committeeId: z.number(),
  transactionHash: z.string().min(1, 'Transaction hash is required').max(128, 'Transaction hash is too long'),
  blockExplorerUrl: z.string().url('Must be a valid URL').max(500, 'URL is too long'),
  amount: z.number().min(0, 'Amount must be positive'),
  walletFrom: z.string().optional(),
  walletTo: z.string().optional(),
});

export async function completeMilestone(formData: FormData) {
  console.log('[completeMilestone]: Starting milestone completion process');
  
  const session = await getSession();
  if (!session || !session.user) {
    console.log('[completeMilestone]: No authenticated user');
    redirect('/sign-in');
  }

  const rawData = {
    milestoneId: parseInt(formData.get('milestoneId') as string),
    committeeId: parseInt(formData.get('committeeId') as string),
    transactionHash: formData.get('transactionHash') as string,
    blockExplorerUrl: formData.get('blockExplorerUrl') as string,
    amount: parseFloat(formData.get('amount') as string),
    walletFrom: formData.get('walletFrom') as string || undefined,
    walletTo: formData.get('walletTo') as string || undefined,
  };

  console.log('[completeMilestone]: Processing data for milestone', rawData.milestoneId);

  const validation = CompleteMilestoneSchema.safeParse(rawData);
  if (!validation.success) {
    console.log('[completeMilestone]: Validation failed', validation.error.issues);
    return {
      error: 'Invalid form data: ' + validation.error.issues.map(i => i.message).join(', ')
    };
  }

  const data = validation.data;

  try {
    // Verify user is a curator for this committee
    const isAuthorized = await isUserCurator(session.user.id);
    if (!isAuthorized) {
      console.log('[completeMilestone]: User not authorized');
      return {
        error: 'You are not authorized to complete milestones'
      };
    }

    // Get milestone details for notification
    const milestone = await getMilestoneById(data.milestoneId);
    if (!milestone) {
      return {
        error: 'Milestone not found'
      };
    }

    // Complete the milestone with payout
    const result = await completeMilestoneWithPayout({
      milestoneId: data.milestoneId,
      groupId: milestone.groupId,
      reviewerId: session.user.id,
      transactionHash: data.transactionHash,
      blockExplorerUrl: data.blockExplorerUrl,
      amount: data.amount,
      walletFrom: data.walletFrom,
      walletTo: data.walletTo,
    });

    console.log('[completeMilestone]: Milestone completed successfully', result.milestone.id);

    // Create notification for the submission owner
    try {
      await createNotification({
        userId: milestone.submissionId, // This should be the submitter ID, need to get it properly
        type: 'milestone_completed',
        content: `Milestone "${milestone.title}" has been completed and payment has been processed.`,
        submissionId: milestone.submissionId,
        milestoneId: data.milestoneId,
        groupId: milestone.groupId,
      });
    } catch (notificationError) {
      console.log('[completeMilestone]: Failed to create notification', notificationError);
      // Don't fail the whole operation for notification errors
    }

    // Revalidate relevant pages
    revalidatePath('/dashboard/submissions');
    revalidatePath(`/dashboard/submissions/${milestone.submissionId}`);
    revalidatePath('/dashboard/curator');

    return {
      success: true,
      message: 'Milestone completed and payment processed successfully',
      payout: result.payout
    };

  } catch (error) {
    console.error('[completeMilestone]: Error completing milestone', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to complete milestone'
    };
  }
}

export async function validateTransactionHash(hash: string, explorerUrl: string) {
  console.log('[validateTransactionHash]: Validating transaction', hash);
  
  // Basic validation - in a real app you might want to validate against blockchain
  if (!hash || hash.length < 10) {
    return { valid: false, error: 'Invalid transaction hash format' };
  }

  if (!explorerUrl.includes(hash)) {
    return { valid: false, error: 'Transaction hash does not match the explorer URL' };
  }

  // You could add more sophisticated validation here:
  // - Check if the URL is from a known block explorer
  // - Validate the transaction exists on-chain
  // - Verify the transaction amount matches
  
  return { valid: true };
}

// Schema for milestone submission validation
const submitMilestoneSchema = z.object({
  milestoneId: z.number().min(1, 'Invalid milestone ID'),
  selectedCommits: z.array(z.string()).min(1, 'At least one commit must be selected'),
  deliverables: z.string().min(10, 'Deliverables description must be at least 10 characters'),
  githubCommitHashes: z.array(z.string()).min(1, 'GitHub commit hashes are required'),
});

type SubmitMilestoneData = z.infer<typeof submitMilestoneSchema>;

export const submitMilestone = validatedActionWithUser(
  submitMilestoneSchema,
  async (data: SubmitMilestoneData, formData: FormData, user: { id: number; email: string | null }) => {
    console.log('[submitMilestone]: Starting milestone submission', {
      milestoneId: data.milestoneId,
      commitsCount: data.selectedCommits.length,
      userId: user.id
    });

    try {
      // Get milestone details to verify ownership and status
      const milestone = await getMilestoneById(data.milestoneId);
      if (!milestone) {
        console.log('[submitMilestone]: Milestone not found', { milestoneId: data.milestoneId });
        return { error: 'Milestone not found' };
      }

      // Get the submission to verify ownership
      const submission = await getSubmissionById(milestone.submissionId);
      if (!submission) {
        console.log('[submitMilestone]: Submission not found', { submissionId: milestone.submissionId });
        return { error: 'Submission not found' };
      }

      // Verify user is the submitter of this submission
      if (submission.submitterId !== user.id) {
        console.log('[submitMilestone]: User not authorized to submit this milestone', {
          userId: user.id,
          submitterId: submission.submitterId,
          milestoneId: data.milestoneId
        });
        return { error: 'You are not authorized to submit this milestone' };
      }

      // Verify milestone can be submitted (status should be 'pending' or 'in_progress')
      if (!['pending', 'in_progress'].includes(milestone.status)) {
        console.log('[submitMilestone]: Milestone cannot be submitted in current status', {
          milestoneId: data.milestoneId,
          currentStatus: milestone.status
        });
        return { error: `Cannot submit milestone with status: ${milestone.status}` };
      }

      // Check if previous milestones are completed (sequential milestone requirement)
      const { getMilestonesBySubmission } = await import('@/lib/db/queries');
      const allMilestones = await getMilestonesBySubmission(submission.id);
      
      // Sort milestones by creation order
      const sortedMilestones = allMilestones.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      const targetMilestoneIndex = sortedMilestones.findIndex((m: any) => m.id === data.milestoneId);
      
      // Check all previous milestones are completed
      for (let i = 0; i < targetMilestoneIndex; i++) {
        const previousMilestone = sortedMilestones[i];
        if (previousMilestone.status !== 'completed') {
          console.log('[submitMilestone]: Previous milestone not completed', {
            milestoneId: data.milestoneId,
            blockedBy: previousMilestone.id,
            blockedByTitle: previousMilestone.title,
            blockedByStatus: previousMilestone.status
          });
          return { 
            error: `You must complete "${previousMilestone.title}" before submitting this milestone.` 
          };
        }
      }

      // Update milestone with submission data
      const updateData = {
        deliverables: JSON.stringify({
          description: data.deliverables,
          commits: data.selectedCommits.map(sha => ({
            sha,
            shortSha: sha.substring(0, 7),
            url: `${submission.githubRepoUrl}/commit/${sha}` // Construct GitHub URL
          })),
          submittedAt: new Date().toISOString(),
          submittedBy: user.id
        }),
        githubCommitHash: data.selectedCommits[data.selectedCommits.length - 1], // Use latest commit as primary
        status: 'submitted' as const,
        submittedAt: new Date(),
        updatedAt: new Date()
      };

      const [updatedMilestone] = await db
        .update(milestones)
        .set(updateData)
        .where(eq(milestones.id, data.milestoneId))
        .returning();

      if (!updatedMilestone) {
        console.log('[submitMilestone]: Failed to update milestone', { milestoneId: data.milestoneId });
        return { error: 'Failed to submit milestone' };
      }

      console.log('[submitMilestone]: Milestone updated successfully', {
        milestoneId: data.milestoneId,
        newStatus: updatedMilestone.status,
        commitsCount: data.selectedCommits.length
      });

      // Create milestone discussion thread if it doesn't exist
      await ensureDiscussionForMilestone(data.milestoneId);

      // Post message to milestone discussion about submission
      const message = `🚀 **Milestone Submitted**\n\nThis milestone has been submitted for review with ${data.selectedCommits.length} commits.\n\n**Deliverables Summary:**\n${data.deliverables}\n\n**Commits Included:**\n${data.selectedCommits.map(sha => `- \`${sha.substring(0, 7)}\``).join('\n')}`;

      await createMessage({
        discussionId: (await ensureDiscussionForMilestone(data.milestoneId)).id,
        content: message,
        messageType: 'status_change',
        metadata: JSON.stringify({
          action: 'milestone_submitted',
          milestoneId: data.milestoneId,
          commitsCount: data.selectedCommits.length,
          commits: data.selectedCommits
        })
      });

      // Create notification for committee curators
      try {
        await createNotification({
          userId: submission.reviewerGroupId, // This should be updated to notify actual curators
          type: 'milestone_submitted',
          content: `New milestone submission: "${milestone.title}" by ${user.email}`,
          submissionId: submission.id,
          milestoneId: data.milestoneId,
          groupId: submission.reviewerGroupId
        });
        console.log('[submitMilestone]: Created notification for curators', { milestoneId: data.milestoneId });
      } catch (notificationError) {
        console.log('[submitMilestone]: Failed to create notification', notificationError);
        // Don't fail the whole operation for notification errors
      }

      // Revalidate relevant pages
      revalidatePath(`/dashboard/submissions/${submission.id}`);
      revalidatePath('/dashboard/submissions');
      revalidatePath('/dashboard/curator');

      console.log('[submitMilestone]: Milestone submission completed successfully', {
        milestoneId: data.milestoneId,
        submissionId: submission.id
      });

      return { 
        success: true, 
        milestoneId: data.milestoneId,
        message: 'Milestone submitted successfully for review'
      };

    } catch (error) {
      console.error('[submitMilestone]: Unexpected error', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  }
); 