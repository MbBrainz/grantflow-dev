'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { submissions, milestones, type NewSubmission, type NewMilestone } from '@/lib/db/schema';
import { getUser, ensureDiscussionForSubmission, ensureDiscussionForMilestone } from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';


// Validation schemas
const milestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required').max(200),
  description: z.string().min(1, 'Milestone description is required'),
  requirements: z.string().min(1, 'Acceptance criteria is required'), // Will be stored in description
  amount: z.string().min(1, 'Funding amount is required'),
  dueDate: z.string().optional(),
});

const createSubmissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  executiveSummary: z.string().min(50, 'Executive summary must be at least 50 characters'),
  postGrantPlan: z.string().min(20, 'Post-grant plan must be at least 20 characters'),
  githubRepoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  totalAmount: z.string().min(1, 'Total amount is required'),
  committeeId: z.coerce.number().min(1, 'Committee selection is required'),
  grantProgramId: z.coerce.number().min(1, 'Grant program selection is required'),
  labels: z.array(z.string()).optional().default([]),
  milestones: z.array(z.object({
    title: z.string().min(1, 'Milestone title is required'),
    description: z.string().min(10, 'Milestone description must be at least 10 characters'),
    requirements: z.string().min(5, 'Milestone requirements must be at least 5 characters'),
    amount: z.string().min(1, 'Milestone amount is required'),
    dueDate: z.string().min(1, 'Due date is required'),
  })).min(1, 'At least one milestone is required'),
});


export const createSubmission = async (prevState: any, formData: FormData) => {
  console.log('[createSubmission]: Starting submission creation');

  // Get authenticated user
  const user = await getUser();
  if (!user) {
    return { error: 'User not authenticated' };
  }

  try {
    // Parse FormData with special handling for JSON fields
    const rawData = Object.fromEntries(formData);
    console.log('[createSubmission]: Raw FormData entries:', {
      ...rawData,
      labels: typeof rawData.labels === 'string' ? `JSON string: ${rawData.labels.substring(0, 100)}...` : rawData.labels,
      milestones: typeof rawData.milestones === 'string' ? `JSON string: ${rawData.milestones.substring(0, 100)}...` : rawData.milestones,
    });

    // Parse JSON fields
    let parsedData;
    try {
      parsedData = {
        ...rawData,
        labels: typeof rawData.labels === 'string' ? JSON.parse(rawData.labels) : rawData.labels,
        milestones: typeof rawData.milestones === 'string' ? JSON.parse(rawData.milestones) : rawData.milestones,
      };
      console.log('[createSubmission]: Parsed data:', {
        ...parsedData,
        labels: parsedData.labels,
        labelsType: typeof parsedData.labels,
        labelsIsArray: Array.isArray(parsedData.labels),
        labelsLength: Array.isArray(parsedData.labels) ? parsedData.labels.length : 'not array',
        milestones: Array.isArray(parsedData.milestones) ? parsedData.milestones.length + ' milestones' : 'not array',
        milestonesType: typeof parsedData.milestones,
      });
    } catch (parseError) {
      console.error('[createSubmission]: JSON parsing error:', parseError);
      return { error: 'Invalid data format' };
    }

    // Validate parsed data
    const validationResult = createSubmissionSchema.safeParse(parsedData);
    if (!validationResult.success) {
      console.error('[createSubmission]: Validation error:', validationResult.error.issues);
      return { error: validationResult.error.issues[0].message };
    }

    const data = validationResult.data;
    console.log('[createSubmission]: Validation successful, proceeding with submission for user', { 
      userId: user.id, 
      title: data.title,
      labelsCount: data.labels.length,
      milestonesCount: data.milestones.length,
    });

    // Now continue with the submission logic
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

      // Store complete form data as JSON
      const completeFormData = {
        ...data,
        totalAmount: totalAmount,
      };

      // Create submission record with proper committee/grant program selection
      const newSubmission: NewSubmission = {
        grantProgramId: data.grantProgramId,
        committeeId: data.committeeId,
        submitterId: user.id, // Updated field name from userId
        title: data.title,
        description: data.description,
        executiveSummary: data.executiveSummary,
        milestones: JSON.stringify(data.milestones), // Store milestones as JSON in submission
        postGrantPlan: data.postGrantPlan,
        labels: JSON.stringify(data.labels),
        githubRepoUrl: data.githubRepoUrl || null,
        walletAddress: null, // TODO: Add wallet address field to form
        status: 'pending', // Start as pending for committee review
        totalAmount: Number(data.totalAmount.replace(/,/g, '')),
        appliedAt: new Date(),
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
          committeeId: 1, // Temporary: Use same committee as submission
          title: milestone.title,
          description: combinedDescription, // Include requirements in description
          requirements: milestone.requirements,
          amount: Number(milestone.amount.replace(/,/g, '')),
          dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
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

      // Submission is already set to 'submitted' status - no PR needed

      // Revalidate the submissions page
      revalidatePath('/dashboard/submissions');

      console.log('[createSubmission]: Submission process completed successfully');
      
      // Return success response (client will handle redirect)
      return { success: true, submissionId: createdSubmission.id };

  } catch (error) {
    console.error('[createSubmission]: Error creating submission', error);
    return { 
      error: 'Failed to create submission. Please try again.' 
    };
  }
};

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
      .where(eq(submissions.submitterId, user.id))
      .orderBy(submissions.createdAt);

    return userSubmissions;
  } catch (error) {
    console.error('[getUserSubmissions]: Error fetching submissions', error);
    return [];
  }
} 