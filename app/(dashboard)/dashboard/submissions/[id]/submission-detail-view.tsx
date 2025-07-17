'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
import { DiscussionThread } from '@/components/discussion/discussion-thread';
import { CuratorVoting } from '@/components/discussion/curator-voting';
import { ArrowLeft, Calendar, Github, DollarSign, Target, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSubmissionDiscussion, getSubmissionReviews, postMessageToSubmission } from '../discussion-actions';
import type { Submission, Milestone, User } from '@/lib/db/schema';

interface SubmissionWithMilestones {
  id: number;
  grantProgramId: number;
  committeeId: number;
  submitterId: number;
  title: string;
  description: string | null;
  executiveSummary: string | null;
  milestones: Milestone[]; // Related milestone records
  postGrantPlan: string | null;
  labels: string | null;
  githubRepoUrl: string | null;
  walletAddress: string | null;
  status: string;
  totalAmount: number | null;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  // Legacy field support for backward compatibility
  formData?: string | null;
}

interface SubmissionDetailViewProps {
  submission: SubmissionWithMilestones;
  currentUser: User | null;
}

function parseFormData(formDataString: string | null) {
  if (!formDataString) return null;
  try {
    return JSON.parse(formDataString);
  } catch {
    return null;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
}

export function SubmissionDetailView({ submission, currentUser }: SubmissionDetailViewProps) {
  const router = useRouter();
  const [discussionData, setDiscussionData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formData = parseFormData(submission.formData || null);
  const labels = submission.labels ? JSON.parse(submission.labels) : [];

  useEffect(() => {
    async function loadDiscussionAndReviews() {
      try {
        const [discussionData, reviewsData] = await Promise.all([
          getSubmissionDiscussion(submission.id),
          getSubmissionReviews(submission.id)
        ]);
        
        setDiscussionData(discussionData);
        setReviews(reviewsData.reviews);
      } catch (error) {
        console.error('[SubmissionDetailView]: Error loading data', error);
      } finally {
        setLoading(false);
      }
    }

    loadDiscussionAndReviews();
  }, [submission.id]);

  const handlePostMessage = async (content: string, messageType = 'comment') => {
    try {
      const formData = new FormData();
      const result = await postMessageToSubmission({
        content,
        submissionId: submission.id,
        messageType: messageType as any,
      }, formData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Reload discussion data
      const data = await getSubmissionDiscussion(submission.id);
      setDiscussionData(data);
    } catch (error) {
      console.error('[SubmissionDetailView]: Error posting message', error);
      throw error;
    }
  };

  const handleVoteSubmitted = async () => {
    try {
      // Reload both discussion and reviews data
      const [discussionData, reviewsData] = await Promise.all([
        getSubmissionDiscussion(submission.id),
        getSubmissionReviews(submission.id)
      ]);
      
      setDiscussionData(discussionData);
      setReviews(reviewsData.reviews);
    } catch (error) {
      console.error('[SubmissionDetailView]: Error reloading data after vote', error);
    }
  };

  if (!formData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <Card className="p-8 text-center">
          <p className="text-gray-500">Unable to load submission details</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Back to Submissions
        </Button>
        
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(submission.status)}`}>
          {submission.status?.toUpperCase() || 'PENDING'}
        </span>
      </div>

      {/* Submission Overview */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formData.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {formData.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {labels.map((label: string, index: number) => (
              <span key={index} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Total: <strong>${formData.totalAmount || 'Not specified'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Milestones: <strong>{submission.milestones.length}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Created: <strong>{new Date(submission.createdAt).toLocaleDateString()}</strong>
              </span>
            </div>
          </div>

          {formData.githubRepoUrl && (
            <div className="pt-4 border-t">
              <a 
                href={formData.githubRepoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Github className="w-4 h-4" />
                View Repository
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Executive Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{formData.executiveSummary}</p>
        </div>
      </Card>

      {/* Post-Grant Plan */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Post-Grant Plan</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{formData.postGrantPlan}</p>
        </div>
      </Card>

      {/* Milestones */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Milestones</h2>
        <div className="space-y-4">
          {submission.milestones.map((milestone, index) => (
            <Card key={milestone.id} className="p-4 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">
                  {index + 1}. {milestone.title}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(milestone.status)}`}>
                  {milestone.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {milestone.description}
              </p>
            </Card>
          ))}
        </div>
      </Card>

      {/* Discussion Thread */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Discussion & Review</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Curator Voting Section */}
            <CuratorVoting
              submissionId={submission.id}
              currentUser={discussionData?.currentUser}
              existingVotes={reviews}
              onVoteSubmitted={handleVoteSubmitted}
              isOpen={true}
            />

            {/* Discussion Thread */}
            <DiscussionThread
              discussion={discussionData?.discussion}
              submissionId={submission.id}
              currentUser={discussionData?.currentUser}
              onPostMessage={handlePostMessage}
              title={formData.title}
              isPublic={false}
            />
          </div>
        )}
      </Card>
    </div>
  );
} 