'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DiscussionThread } from '@/components/discussion/discussion-thread';
import { CuratorVoting } from '@/components/discussion/curator-voting';
import { ArrowLeft, Calendar, Github, DollarSign, Target, MessageSquare, Activity, CheckCircle, Clock, AlertTriangle, FileText, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  getSubmissionDiscussion, 
  getSubmissionReviews, 
  postMessageToSubmission,
  getSubmissionCurrentState,
  getSubmissionMilestonesOverview,
  getSubmissionForCuratorReview,
  postMessageToMilestone
} from '../discussion-actions';
import type { Submission, Milestone, User } from '@/lib/db/schema';
import { useSubmissionContext } from '@/lib/hooks/use-submission-context';
import { CuratorSubmissionView } from '@/components/submissions/curator-submission-view';
import { GranteeSubmissionView } from '@/components/submissions/grantee-submission-view';
import { PublicSubmissionView } from '@/components/submissions/public-submission-view';

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

type ViewMode = 'current' | 'milestones' | 'overview';

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

function getMilestoneStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'under_review': return 'bg-yellow-100 text-yellow-800';
    case 'pending': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Current State View Component
function CurrentStateView({ submission, currentUser }: { submission: SubmissionWithMilestones, currentUser: User | null }) {
  const [currentState, setCurrentState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentState() {
      try {
        const formData = new FormData();
        formData.append('submissionId', String(submission.id));
        const result = await getSubmissionCurrentState({}, formData);
        
        if (!result.error && 'currentState' in result) {
          setCurrentState(result.currentState);
        }
      } catch (error) {
        console.error('[CurrentStateView]: Error loading current state', error);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentState();
  }, [submission.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Actions */}
      <Card className="p-6 border-l-4 border-l-orange-500">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Pending Actions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Submission Vote</span>
            </div>
            <p className="text-sm text-gray-600">
              {currentState?.pendingActions?.submissionVote ? 'Vote required' : 'Vote cast ✓'}
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-yellow-600" />
              <span className="font-medium">Milestone Reviews</span>
            </div>
            <p className="text-sm text-gray-600">
              {currentState?.pendingActions?.milestoneReviews || 0} pending
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="font-medium">Active Milestones</span>
            </div>
            <p className="text-sm text-gray-600">
              {currentState?.pendingActions?.activeMilestonesCount || 0} in progress
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        
        <div className="space-y-3">
          {currentState?.recentMessages?.length > 0 ? (
            currentState.recentMessages.map((message: any) => (
              <div key={message.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {message.author?.name?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{message.author?.name || 'Unknown'}</span>
                    <Badge variant="outline" className="text-xs">
                      {message.discussion?.type === 'milestone' ? 'Milestone' : 'Submission'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">{message.content}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </Card>

      {/* Active Milestones */}
      {currentState?.activeMilestones?.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Active Milestones</h3>
          </div>
          
          <div className="space-y-4">
            {currentState.activeMilestones.map((milestone: any) => (
              <div key={milestone.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{milestone.title}</h4>
                  <Badge className={getMilestoneStatusColor(milestone.status)}>
                    {milestone.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                
                {milestone.discussions?.[0]?.messages?.length > 0 && (
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Latest Discussion:</p>
                    <p className="text-sm text-gray-600">
                      {milestone.discussions[0].messages[milestone.discussions[0].messages.length - 1].content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// Milestones Overview Component
function MilestonesOverview({ submission, currentUser }: { submission: SubmissionWithMilestones, currentUser: User | null }) {
  const [milestonesData, setMilestonesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);

  useEffect(() => {
    async function loadMilestonesOverview() {
      try {
        const formData = new FormData();
        formData.append('submissionId', String(submission.id));
        const result = await getSubmissionMilestonesOverview({}, formData);
        
        if (!result.error && 'milestonesOverview' in result) {
          setMilestonesData(result.milestonesOverview);
        }
      } catch (error) {
        console.error('[MilestonesOverview]: Error loading milestones', error);
      } finally {
        setLoading(false);
      }
    }

    loadMilestonesOverview();
  }, [submission.id]);

  const handlePostMilestoneMessage = async (milestoneId: number, content: string) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('milestoneId', String(milestoneId));
      formData.append('messageType', 'comment');
      
      const result = await postMessageToMilestone({}, formData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Reload milestones data
      const reloadFormData = new FormData();
      reloadFormData.append('submissionId', String(submission.id));
      const reloadResult = await getSubmissionMilestonesOverview({}, reloadFormData);
      
      if (!reloadResult.error && 'milestonesOverview' in reloadResult) {
        setMilestonesData(reloadResult.milestonesOverview);
      }
    } catch (error) {
      console.error('[MilestonesOverview]: Error posting milestone message', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Milestones Summary</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{milestonesData?.summary?.total || 0}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{milestonesData?.summary?.completed || 0}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{milestonesData?.summary?.inProgress || 0}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{milestonesData?.summary?.pending || 0}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>Progress: ${milestonesData?.summary?.paidAmount?.toLocaleString() || 0} paid</span>
            <span>Total: ${milestonesData?.summary?.totalAmount?.toLocaleString() || 0}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ 
                width: `${milestonesData?.summary?.totalAmount > 0 ? 
                  (milestonesData.summary.paidAmount / milestonesData.summary.totalAmount) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        {milestonesData?.milestones?.map((milestone: any, index: number) => (
          <Card key={milestone.id} className="overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">
                  Milestone {index + 1}: {milestone.title}
                </h4>
                <div className="flex items-center gap-2">
                  <Badge className={getMilestoneStatusColor(milestone.status)}>
                    {milestone.status.replace('_', ' ')}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedMilestone(
                      expandedMilestone === milestone.id ? null : milestone.id
                    )}
                  >
                    {expandedMilestone === milestone.id ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                <div>Amount: ${milestone.amount?.toLocaleString() || 0}</div>
                <div>Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No date set'}</div>
                <div>Messages: {milestone.discussions?.[0]?.messages?.length || 0}</div>
              </div>
              
              <p className="text-sm text-gray-700">{milestone.description}</p>
            </div>
            
            {expandedMilestone === milestone.id && (
              <div className="border-t bg-gray-50 p-4">
                <DiscussionThread
                  discussion={milestone.discussions?.[0]}
                  submissionId={submission.id}
                  milestoneId={milestone.id}
                  currentUser={currentUser}
                  onPostMessage={(content) => handlePostMilestoneMessage(milestone.id, content)}
                  title={`${milestone.title} Discussion`}
                  isPublic={false}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Project Overview Component
function ProjectOverview({ submission, currentUser }: { submission: SubmissionWithMilestones, currentUser: User | null }) {
  const formData = parseFormData(submission.formData || null);
  const labels = submission.labels ? JSON.parse(submission.labels) : [];

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Project Details</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Executive Summary</h4>
            <p className="text-gray-700">{submission.executiveSummary || formData?.executiveSummary}</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-gray-700">{submission.description || formData?.description}</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Post-Grant Plan</h4>
            <p className="text-gray-700">{submission.postGrantPlan || formData?.postGrantPlan}</p>
          </div>
        </div>
      </Card>

      {/* Project Metadata */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Project Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Total Amount:</span>
            <span className="ml-2">${submission.totalAmount?.toLocaleString() || 'TBD'}</span>
          </div>
          <div>
            <span className="font-medium">Applied:</span>
            <span className="ml-2">{submission.appliedAt ? new Date(submission.appliedAt).toLocaleDateString() : 'Unknown'}</span>
          </div>
          <div>
            <span className="font-medium">Status:</span>
            <Badge className={`ml-2 ${getStatusColor(submission.status)}`}>
              {submission.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Milestones:</span>
            <span className="ml-2">{submission.milestones?.length || 0} total</span>
          </div>
        </div>

        {labels.length > 0 && (
          <div className="mt-4">
            <span className="font-medium">Labels:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {labels.map((label: string, index: number) => (
                <Badge key={index} variant="outline">{label}</Badge>
              ))}
            </div>
          </div>
        )}

        {submission.githubRepoUrl && (
          <div className="mt-4">
            <span className="font-medium">GitHub Repository:</span>
            <a 
              href={submission.githubRepoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:underline flex items-center gap-1"
            >
              <Github className="w-4 h-4" />
              {submission.githubRepoUrl}
            </a>
          </div>
        )}
      </Card>

      {/* Timeline View */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Timeline</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-blue-600 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Application Submitted</div>
              <div className="text-sm text-gray-600">
                {submission.appliedAt ? new Date(submission.appliedAt).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>
          
          {submission.milestones?.map((milestone, index) => (
            <div key={milestone.id} className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-2 ${
                milestone.status === 'completed' ? 'bg-green-600' :
                milestone.status === 'in_progress' ? 'bg-blue-600' :
                milestone.status === 'under_review' ? 'bg-yellow-600' : 'bg-gray-400'
              }`}></div>
              <div>
                <div className="font-medium">{milestone.title}</div>
                <div className="text-sm text-gray-600">
                  Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No date set'}
                </div>
                <Badge className={`mt-1 ${getMilestoneStatusColor(milestone.status)}`}>
                  {milestone.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function SubmissionDetailView({ submission, currentUser }: SubmissionDetailViewProps) {
  const router = useRouter();
  const [discussionData, setDiscussionData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentState, setCurrentState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get user context and permissions for this submission
  const submissionContext = useSubmissionContext(submission, currentUser);

  const formData = parseFormData(submission.formData || null);

  useEffect(() => {
    async function loadAllData() {
      try {
        const [discussionData, reviewsData, currentStateData] = await Promise.all([
          getSubmissionDiscussion(submission.id),
          getSubmissionReviews(submission.id),
          (async () => {
            const formData = new FormData();
            formData.append('submissionId', String(submission.id));
            return await getSubmissionCurrentState({}, formData);
          })()
        ]);
        
        setDiscussionData(discussionData);
        setReviews(reviewsData.reviews);
        setCurrentState(currentStateData);
      } catch (error) {
        console.error('[SubmissionDetailView]: Error loading data', error);
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, [submission.id]);

  const handlePostMessage = async (content: string, type?: string) => {
    try {
      const messageType = (type === 'comment' || type === 'status_change' || type === 'vote') ? type : 'comment';
      const formData = new FormData();
      formData.append('content', content);
      formData.append('submissionId', String(submission.id));
      formData.append('messageType', messageType);
      
      const result = await postMessageToSubmission({}, formData);

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
      // Reload all data after vote
      const [discussionData, reviewsData, currentStateData] = await Promise.all([
        getSubmissionDiscussion(submission.id),
        getSubmissionReviews(submission.id),
        (async () => {
          const formData = new FormData();
          formData.append('submissionId', String(submission.id));
          return await getSubmissionCurrentState({}, formData);
        })()
      ]);
      
      setDiscussionData(discussionData);
      setReviews(reviewsData.reviews);
      setCurrentState(currentStateData);
    } catch (error) {
      console.error('[SubmissionDetailView]: Error reloading data after vote', error);
    }
  };

  // Show loading state
  if (loading || submissionContext.isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{submission.title || formData?.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>Submission #{submission.id}</span>
            <Badge className={getStatusColor(submission.status)}>
              {submission.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <span>Applied {submission.appliedAt ? new Date(submission.appliedAt).toLocaleDateString() : 'Unknown'}</span>
            {/* Role indicator */}
            <Badge variant="outline" className="text-xs">
              Viewing as: {submissionContext.viewType}
            </Badge>
          </div>
        </div>
      </div>

      {/* Role-Based View Routing */}
      {submissionContext.viewType === 'curator' && (
        <CuratorSubmissionView
          submission={submission}
          currentUser={currentUser}
          currentState={currentState}
          discussionData={discussionData}
          reviews={reviews}
          onPostMessage={handlePostMessage}
          onVoteSubmitted={handleVoteSubmitted}
        />
      )}

      {submissionContext.viewType === 'grantee' && (
        <GranteeSubmissionView
          submission={submission}
          currentUser={currentUser}
          currentState={currentState}
          discussionData={discussionData}
          reviews={reviews}
          onPostMessage={handlePostMessage}
          onVoteSubmitted={handleVoteSubmitted}
        />
      )}

      {submissionContext.viewType === 'public' && (
        <PublicSubmissionView
          submission={submission}
          currentState={currentState}
          discussionData={discussionData}
          reviews={reviews}
        />
      )}
    </div>
  );
} 