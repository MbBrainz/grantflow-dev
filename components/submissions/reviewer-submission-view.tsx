'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DiscussionThread } from '@/components/discussion/discussion-thread';
import { ReviewerVoting } from '@/components/discussion/reviewer-voting';
import { Vote, AlertTriangle, Clock, Users, CheckCircle, XCircle, MessageSquare, GitBranch, DollarSign, Target } from 'lucide-react';
import { CommitteeInfoCard } from '@/components/committee/committee-info-card';

interface ReviewerSubmissionViewProps {
  submission: any;
  currentUser: any;
  currentState: any;
  discussionData: any;
  reviews: any[];
  submissionContext?: any;
  onPostMessage: (content: string, type?: string) => Promise<void>;
  onVoteSubmitted: () => Promise<void>;
}

export function ReviewerSubmissionView({
  submission,
  currentUser,
  currentState,
  discussionData,
  reviews,
  submissionContext,
  onPostMessage,
  onVoteSubmitted
}: ReviewerSubmissionViewProps) {
  const [activeTab, setActiveTab] = useState<'review' | 'technical' | 'analytics'>('review');

  // Calculate voting status - fix field names to match actual data structure
  const approveVotes = reviews?.filter(r => r.vote === 'approve').length || 0;
  const rejectVotes = reviews?.filter(r => r.vote === 'reject' || r.vote === 'request_changes').length || 0;
  const userHasVoted = reviews?.some(r => r.reviewerId === currentUser?.id);
  const needsMyVote = !userHasVoted && submissionContext?.isCommitteeReviewer;

  return (
    <div className="space-y-6">
      {/* Committee Context - Just show this submission's committee */}
      {submission.committee && (
        <CommitteeInfoCard
          committee={submission.committee}
          userRole={submissionContext?.committeeRole}
          isUserMember={submissionContext?.isCommitteeReviewer}
          className="border-l-4 border-l-blue-500"
        />
      )}

      {/* Reviewer Action Hero */}
      <Card className="p-6 border-l-4 border-l-blue-500 bg-blue-50/50">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <Vote className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">
                {needsMyVote ? 'Vote Required' : 'Review in Progress'}
              </h2>
              {needsMyVote && (
                <Badge className="bg-red-100 text-red-800 animate-pulse">
                  Action Required
                </Badge>
              )}
            </div>
            <p className="text-gray-600 text-lg">
              {needsMyVote 
                ? 'Your vote is needed to proceed with this submission review.'
                : 'Review the submission details and collaborate with other reviewers.'
              }
            </p>
          </div>
        </div>

        {/* Review Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">Approve Votes</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{approveVotes}</p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="font-medium">Reject Votes</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{rejectVotes}</p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="font-medium">Review Time</span>
            </div>
            <p className="text-sm text-gray-600">
              {Math.floor((Date.now() - new Date(submission.appliedAt).getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Funding</span>
            </div>
            <p className="text-sm font-medium">${submission.totalAmount?.toLocaleString() || 'TBD'}</p>
          </div>
        </div>

        {/* Voting Interface */}
        {needsMyVote && (
          <div className="bg-white rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Vote className="w-5 h-5" />
              Cast Your Vote
            </h3>
            <ReviewerVoting
              submissionId={submission.id}
              currentUser={currentUser}
              existingVotes={reviews}
              onVoteSubmitted={onVoteSubmitted}
              isOpen={true}
            />
          </div>
        )}
      </Card>

      {/* Tabbed Content */}
      <Card className="p-6">
        <div className="flex items-center gap-1 mb-6 border-b">
          <Button
            variant={activeTab === 'review' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('review')}
            className="rounded-b-none"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Review & Discussion
          </Button>
          <Button
            variant={activeTab === 'technical' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('technical')}
            className="rounded-b-none"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Technical Review
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('analytics')}
            className="rounded-b-none"
          >
            <Target className="w-4 h-4 mr-2" />
            Risk & Analytics
          </Button>
        </div>

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div className="space-y-6">


            {/* Public Discussion */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Public Discussion</h3>
              <DiscussionThread
                discussion={discussionData?.discussion}
                submissionId={submission.id}
                currentUser={currentUser}
                onPostMessage={onPostMessage}
                title={submission.title}
                isPublic={true}
                submissionContext={submissionContext}
              />
            </div>
          </div>
        )}

        {/* Technical Review Tab */}
        {activeTab === 'technical' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Repository Analysis</h3>
                {submission.githubRepoUrl ? (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="w-4 h-4" />
                      <a 
                        href={submission.githubRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        View Repository
                      </a>
                    </div>
                    <p className="text-sm text-gray-600">
                      AI-powered code analysis coming soon
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No repository linked</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Milestones</h3>
                <div className="space-y-2">
                  {submission.milestones?.map((milestone: any, index: number) => (
                    <div key={milestone.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Milestone {index + 1}</span>
                        <Badge variant="outline">{milestone.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{milestone.title}</p>
                      <p className="text-sm font-medium">${milestone.amount?.toLocaleString() || 0}</p>
                    </div>
                  )) || (
                    <p className="text-gray-500 italic">No milestones defined</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Funding amount within range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">New applicant - limited history</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">GitHub repository provided</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Similar Applications</h3>
                <div className="space-y-2">
                  <div className="p-3 border rounded">
                    <p className="font-medium text-sm">SDK Development Project</p>
                    <p className="text-xs text-gray-600">Approved • $85K • 6 months ago</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="font-medium text-sm">Developer Tools Suite</p>
                    <p className="text-xs text-gray-600">Approved • $120K • 1 year ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 