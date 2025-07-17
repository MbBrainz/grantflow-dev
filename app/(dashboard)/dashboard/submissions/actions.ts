'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { submissions, milestones, type NewSubmission, type NewMilestone } from '@/lib/db/schema';
import { getUser, ensureDiscussionForSubmission, ensureDiscussionForMilestone } from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { GitHubPRData } from '@/lib/github/octokit';

// Validation schemas
const milestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required').max(200),
  description: z.string().min(1, 'Milestone description is required'),
  requirements: z.string().min(1, 'Acceptance criteria is required'), // Will be stored in description
  amount: z.string().min(1, 'Funding amount is required'),
  dueDate: z.string().optional(),
});

const submissionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(500),
  executiveSummary: z.string().min(1, 'Executive summary is required'),
  postGrantPlan: z.string().min(1, 'Post-grant plan is required'),
  githubRepoUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  totalAmount: z.string().min(1, 'Total amount is required'),
  labels: z.array(z.string()).min(1, 'At least one category is required'),
  milestones: z.array(milestoneSchema).min(1, 'At least one milestone is required'),
});

async function createGitHubPR(submissionData: any): Promise<string | null> {
  console.log('[createGitHubPR]: Creating GitHub PR for submission', { title: submissionData.title });
  
  try {
    const { createGrantProposalPR } = await import('@/lib/github/octokit');
    
    // Parse total amount
    const totalAmount = parseFloat(submissionData.totalAmount);
    if (isNaN(totalAmount)) {
      throw new Error('Invalid total amount');
    }

    // Prepare data for GitHub PR
    const prData: GitHubPRData = {
      title: submissionData.title,
      description: submissionData.description,
      executiveSummary: submissionData.executiveSummary,
      postGrantPlan: submissionData.postGrantPlan,
      milestones: submissionData.milestones.map((milestone: any) => ({
        ...milestone,
        amount: parseFloat(milestone.amount) || 0,
      })),
      labels: submissionData.labels || [],
      totalAmount: totalAmount,
    };

    const prUrl = await createGrantProposalPR(prData);
    console.log('[createGitHubPR]: Created PR successfully', { prUrl });
    
    return prUrl;
  } catch (error) {
    console.error('[createGitHubPR]: Error creating GitHub PR', error);
    // Return null to continue submission without PR (can be retried later)
    return null;
  }
}

export const createSubmission = validatedActionWithUser(
  submissionSchema,
  async (data, formData, user) => {
    console.log('[createSubmission]: Creating new submission for user', { userId: user.id, title: data.title });

    try {
      // Parse and validate data
      const totalAmount = parseFloat(data.totalAmount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        return { error: 'Invalid total amount' };
      }

      // Calculate milestones total
      const milestonesTotal = data.milestones.reduce((sum, milestone) => {
        const amount = parseFloat(milestone.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      // Validate milestones total doesn't exceed total amount
      if (milestonesTotal > totalAmount) {
        return { error: 'Milestones total cannot exceed total funding amount' };
      }

      // Create GitHub PR first
      const githubPrUrl = await createGitHubPR(data);
      
      // Store complete form data as JSON
      const completeFormData = {
        ...data,
        totalAmount: totalAmount,
        githubPrUrl,
      };

      // Create submission record
      const newSubmission: NewSubmission = {
        userId: user.id, // Use userId not submitterId
        githubPrId: githubPrUrl ? githubPrUrl.split('/').pop() : null,
        status: 'draft', // Start as draft
        labels: JSON.stringify(data.labels), // Store as JSON string
        formData: JSON.stringify(completeFormData), // Store complete form data
      };

      const [createdSubmission] = await db
        .insert(submissions)
        .values(newSubmission)
        .returning();

      if (!createdSubmission) {
        return { error: 'Failed to create submission' };
      }

      console.log('[createSubmission]: Created submission', { id: createdSubmission.id });

      // Create milestone records (combine description and requirements)
      const milestonePromises = data.milestones.map(async (milestone, index) => {
        const combinedDescription = `${milestone.description}\n\n**Acceptance Criteria:**\n${milestone.requirements}`;
        
        const newMilestone: NewMilestone = {
          submissionId: createdSubmission.id,
          title: milestone.title,
          description: combinedDescription, // Include requirements in description
          status: 'pending',
        };
        
        const [createdMilestone] = await db.insert(milestones).values(newMilestone).returning();
        
        // Create discussion thread for each milestone
        if (createdMilestone) {
          await ensureDiscussionForMilestone(createdMilestone.id);
          console.log('[createSubmission]: Created discussion for milestone', { milestoneId: createdMilestone.id });
        }
        
        return createdMilestone;
      });

      await Promise.all(milestonePromises);

      console.log('[createSubmission]: Created milestones', { count: data.milestones.length });

      // Create discussion thread for the submission
      await ensureDiscussionForSubmission(createdSubmission.id);
      console.log('[createSubmission]: Created discussion for submission', { submissionId: createdSubmission.id });

      // Update submission status to submitted if PR was created
      if (githubPrUrl) {
        await db
          .update(submissions)
          .set({ status: 'submitted' })
          .where(eq(submissions.id, createdSubmission.id));
      }

      // Revalidate the submissions page
      revalidatePath('/dashboard/submissions');

      console.log('[createSubmission]: Submission process completed successfully');
      
      // Redirect to submissions list
      redirect('/dashboard/submissions');

    } catch (error) {
      console.error('[createSubmission]: Error creating submission', error);
      return { 
        error: 'Failed to create submission. Please try again.' 
      };
    }
  }
);

// Get user's submissions
export async function getUserSubmissions() {
  const user = await getUser();
  if (!user) {
    return [];
  }

  try {
    const userSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, user.id))
      .orderBy(submissions.createdAt);

    return userSubmissions;
  } catch (error) {
    console.error('[getUserSubmissions]: Error fetching submissions', error);
    return [];
  }
} 