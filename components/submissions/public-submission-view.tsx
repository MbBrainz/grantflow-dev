'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye,
  Calendar, 
  DollarSign, 
  Target,
  CheckCircle,
  Clock,
  Users,
  GitBranch,
  Award,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

interface PublicSubmissionViewProps {
  submission: any;
  currentState: any;
  discussionData: any;
  reviews: any[];
}

export function PublicSubmissionView({
  submission,
  currentState,
  discussionData,
  reviews
}: PublicSubmissionViewProps) {
  
  // Calculate public metrics
  const approveVotes = reviews?.filter(r => r.decision === 'approve').length || 0;
  const totalVotes = reviews?.length || 0;
  const completedMilestones = submission.milestones?.filter((m: any) => m.status === 'completed').length || 0;
  const totalMilestones = submission.milestones?.length || 0;
  const publicMessages = discussionData?.discussion?.messages?.filter((m: any) => !m.isPrivate) || [];

  return (
    <div className="space-y-6">
      {/* Public Overview Hero */}
      <Card className="p-6 border-l-4 border-l-purple-500 bg-purple-50/50">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <Eye className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">Public Transparency View</h2>
              <Badge className="bg-green-100 text-green-800">
                Open for Review
              </Badge>
            </div>
            <p className="text-gray-600 text-lg">
              This submission is publicly viewable as part of our transparency commitment. 
              All voting, decisions, and progress are open for community review.
            </p>
          </div>
        </div>

        {/* Public Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Committee Votes</span>
            </div>
            <p className="text-lg font-bold">{approveVotes}/{totalVotes}</p>
            <p className="text-xs text-gray-600">Approve/Total</p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium">Funding</span>
            </div>
            <p className="text-lg font-bold">${submission.totalAmount?.toLocaleString() || 'TBD'}</p>
            <p className="text-xs text-gray-600">Requested</p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-orange-600" />
              <span className="font-medium">Progress</span>
            </div>
            <p className="text-lg font-bold">{completedMilestones}/{totalMilestones}</p>
            <p className="text-xs text-gray-600">Milestones</p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Timeline</span>
            </div>
            <p className="text-sm font-medium">
              {Math.floor((Date.now() - new Date(submission.appliedAt).getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
            <p className="text-xs text-gray-600">Since applied</p>
          </div>
        </div>
      </Card>

      {/* Project Summary */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-semibold">Project Summary</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Executive Summary</h4>
              <p className="text-gray-700">{submission.executiveSummary}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Project Goals</h4>
              <p className="text-gray-700">{submission.description}</p>
            </div>

            {submission.postGrantPlan && (
              <div>
                <h4 className="font-medium mb-2">Post-Grant Development</h4>
                <p className="text-gray-700">{submission.postGrantPlan}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Project Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Applied:</span>
                  <span>{new Date(submission.appliedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={`${
                    submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Milestones:</span>
                  <span>{totalMilestones}</span>
                </div>
                {submission.githubRepoUrl && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Repository:</span>
                    <a 
                      href={submission.githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <GitBranch className="w-3 h-3" />
                      View Code
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Labels */}
            {submission.labels && (
              <div>
                <h4 className="font-medium mb-2">Project Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(submission.labels).map((label: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Voting Results */}
      {reviews.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold">Committee Review Results</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Voting Summary</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Approve</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">
                    {approveVotes}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span className="font-medium">Concerns/Reject</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">
                    {totalVotes - approveVotes}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Review Timeline</h4>
              <div className="space-y-2">
                {reviews.slice(0, 3).map((review: any, index: number) => (
                  <div key={review.id} className="flex items-center gap-3 p-2 border rounded">
                    <div className={`w-3 h-3 rounded-full ${
                      review.decision === 'approve' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Curator {index + 1} • {review.decision}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {reviews.length > 3 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{reviews.length - 3} more reviews
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Milestone Progress */}
      {submission.milestones?.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold">Milestone Progress</h3>
          </div>
          
          <div className="space-y-4">
            {submission.milestones.map((milestone: any, index: number) => (
              <div key={milestone.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      milestone.status === 'completed' ? 'bg-green-500' :
                      milestone.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{milestone.title}</h4>
                      <p className="text-sm text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                      milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {milestone.status.replace('_', ' ')}
                    </Badge>
                    <p className="text-sm font-medium mt-1">
                      ${milestone.amount?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
                
                {milestone.status === 'completed' && milestone.githubRepoUrl && (
                  <div className="mt-2 p-2 bg-green-50 rounded flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-green-600" />
                    <a 
                      href={milestone.githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 hover:underline"
                    >
                      View Deliverables
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Public Discussion */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-semibold">Public Discussion</h3>
        </div>
        
        {publicMessages.length > 0 ? (
          <div className="space-y-3">
            {publicMessages.slice(0, 5).map((message: any) => (
              <div key={message.id} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {message.author?.name?.[0] || 'U'}
                    </span>
                  </div>
                  <span className="font-medium text-sm">{message.author?.name || 'Anonymous'}</span>
                  <Badge variant="outline" className="text-xs">
                    {message.author?.role || 'user'}
                  </Badge>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{message.content}</p>
              </div>
            ))}
            {publicMessages.length > 5 && (
              <div className="text-center py-2">
                <Button variant="outline" size="sm">
                  View All Discussion ({publicMessages.length} messages)
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No public discussion yet</p>
            <p className="text-sm text-gray-500">Public comments will appear here</p>
          </div>
        )}
      </Card>

      {/* Transparency Footer */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-gray-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900">Transparency Commitment</h3>
            <p className="text-sm text-gray-700 mb-3">
              This submission is part of our public transparency initiative. All committee decisions, 
              voting rationale, and project progress are openly shared with the community to build 
              trust and accountability.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Learn About Our Process
              </Button>
              <Button variant="outline" size="sm">
                View Committee Info
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 