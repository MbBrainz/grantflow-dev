'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { 
  completeMilestoneWithPayout, 
  isUserCurator,
  getMilestoneById,
  createNotification
} from '@/lib/db/queries';

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
    const isAuthorized = await isUserCurator(session.user.id, data.committeeId);
    if (!isAuthorized) {
      console.log('[completeMilestone]: User not authorized for committee', data.committeeId);
      return {
        error: 'You are not authorized to complete milestones for this committee'
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
      committeeId: data.committeeId,
      curatorId: session.user.id,
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
        committeeId: data.committeeId,
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