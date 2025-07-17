'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { 
  getUser, 
  createMessage, 
  getDiscussionForSubmission, 
  getDiscussionForMilestone,
  ensureDiscussionForSubmission,
  ensureDiscussionForMilestone,
  createNotification,
  getReviewsForSubmission
} from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';

const messageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
  discussionId: z.number(),
  messageType: z.enum(['comment', 'status_change', 'vote']).default('comment'),
  metadata: z.string().optional(),
});

const discussionParamsSchema = z.object({
  submissionId: z.number().optional(),
  milestoneId: z.number().optional(),
});

export const postMessage = validatedActionWithUser(
  messageSchema,
  async (data, formData, user) => {
    console.log('[postMessage]: Creating new message', { 
      userId: user.id, 
      discussionId: data.discussionId,
      messageType: data.messageType 
    });

    try {
      // Create the message
      const newMessage = await createMessage({
        discussionId: data.discussionId,
        content: data.content,
        messageType: data.messageType,
        metadata: data.metadata || null,
        authorId: user.id, // This will be overridden in createMessage function
      });

      console.log('[postMessage]: Message created successfully', { messageId: newMessage.id });

      // TODO: Create notifications for relevant users
      // For now, we'll implement basic notification logic
      // This should notify submission authors and other participants

      // Revalidate the page to show the new message
      revalidatePath('/dashboard/submissions');
      
      return { success: true, messageId: newMessage.id };

    } catch (error) {
      console.error('[postMessage]: Error creating message', error);
      return { 
        error: 'Failed to post message. Please try again.' 
      };
    }
  }
);

export async function getSubmissionDiscussion(submissionId: number) {
  try {
    const user = await getUser();
    console.log('[getSubmissionDiscussion]: Fetching discussion', { submissionId, userId: user?.id });

    // Ensure discussion exists
    await ensureDiscussionForSubmission(submissionId);
    
    // Get discussion with messages
    const discussion = await getDiscussionForSubmission(submissionId);
    
    return { 
      discussion, 
      currentUser: user,
      canPost: !!user // Allow any authenticated user to post for now
    };
  } catch (error) {
    console.error('[getSubmissionDiscussion]: Error fetching discussion', error);
    return { 
      discussion: null, 
      currentUser: null,
      canPost: false 
    };
  }
}

export async function getMilestoneDiscussion(milestoneId: number) {
  try {
    const user = await getUser();
    console.log('[getMilestoneDiscussion]: Fetching discussion', { milestoneId, userId: user?.id });

    // Ensure discussion exists
    await ensureDiscussionForMilestone(milestoneId);
    
    // Get discussion with messages
    const discussion = await getDiscussionForMilestone(milestoneId);
    
    return { 
      discussion, 
      currentUser: user,
      canPost: !!user // Allow any authenticated user to post for now
    };
  } catch (error) {
    console.error('[getMilestoneDiscussion]: Error fetching discussion', error);
    return { 
      discussion: null, 
      currentUser: null,
      canPost: false 
    };
  }
}

export async function getSubmissionReviews(submissionId: number) {
  try {
    const user = await getUser();
    console.log('[getSubmissionReviews]: Fetching reviews', { submissionId, userId: user?.id });

    const reviews = await getReviewsForSubmission(submissionId);
    
    return { 
      reviews,
      currentUser: user
    };
  } catch (error) {
    console.error('[getSubmissionReviews]: Error fetching reviews', error);
    return { 
      reviews: [],
      currentUser: null
    };
  }
}

// Helper function to post a message with automatic discussion creation
export const postMessageToSubmission = validatedActionWithUser(
  z.object({
    content: z.string().min(1).max(2000),
    submissionId: z.number(),
    messageType: z.enum(['comment', 'status_change', 'vote']).default('comment'),
  }),
  async (data, formData, user) => {
    try {
      // Ensure discussion exists
      const discussion = await ensureDiscussionForSubmission(data.submissionId);
      
      // Create the message
      const message = await createMessage({
        discussionId: discussion.id,
        content: data.content,
        messageType: data.messageType,
        authorId: user.id,
      });

      console.log('[postMessageToSubmission]: Message posted successfully', { 
        messageId: message.id, 
        submissionId: data.submissionId 
      });

      // Revalidate the submissions page
      revalidatePath('/dashboard/submissions');
      revalidatePath(`/dashboard/submissions/${data.submissionId}`);
      
      return { success: true, messageId: message.id };
    } catch (error) {
      console.error('[postMessageToSubmission]: Error posting message', error);
      return { error: 'Failed to post message. Please try again.' };
    }
  }
);

export const postMessageToMilestone = validatedActionWithUser(
  z.object({
    content: z.string().min(1).max(2000),
    milestoneId: z.number(),
    messageType: z.enum(['comment', 'status_change', 'vote']).default('comment'),
  }),
  async (data, formData, user) => {
    try {
      // Ensure discussion exists
      const discussion = await ensureDiscussionForMilestone(data.milestoneId);
      
      // Create the message
      const message = await createMessage({
        discussionId: discussion.id,
        content: data.content,
        messageType: data.messageType,
        authorId: user.id,
      });

      console.log('[postMessageToMilestone]: Message posted successfully', { 
        messageId: message.id, 
        milestoneId: data.milestoneId 
      });

      // Revalidate the relevant pages
      revalidatePath('/dashboard/submissions');
      
      return { success: true, messageId: message.id };
    } catch (error) {
      console.error('[postMessageToMilestone]: Error posting message', error);
      return { error: 'Failed to post message. Please try again.' };
    }
  }
); 