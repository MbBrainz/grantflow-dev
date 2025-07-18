'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DiscussionThread } from '@/components/discussion/discussion-thread';
import { 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  Target,
  GitBranch,
  Edit,
  Send,
  HelpCircle
} from 'lucide-react';

interface GranteeSubmissionViewProps {
  submission: any;
  currentUser: any;
  currentState: any;
  discussionData: any;
  reviews: any[];
  onPostMessage: (content: string, type?: string) => Promise<void>;
  onVoteSubmitted: () => Promise<void>;
}

export function GranteeSubmissionView({
  submission,
  currentUser,
  currentState,
  discussionData,
  reviews,
  onPostMessage,
  onVoteSubmitted
}: GranteeSubmissionViewProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'feedback' | 'milestones'>('status');

  // Determine current stage and required actions
  const getApplicationStage = () => {
    switch (submission.status) {
      case 'pending':
      case 'submitted':
        return {
          stage: 'Under Review',
          description: 'Your application is being reviewed by the committee curators.',
          color: 'blue',
          icon: Clock,
          nextStep: 'Wait for curator feedback and voting to complete.',
          canEdit: false
        };
      case 'changes_requested':
        return {
          stage: 'Changes Requested',
          description: 'The committee has requested changes to your application.',
          color: 'orange',
          icon: AlertCircle,
          nextStep: 'Review curator feedback and submit updated application.',
          canEdit: true
        };
      case 'approved':
        return {
          stage: 'Approved!',
          description: 'Congratulations! Your application has been approved.',
          color: 'green',
          icon: CheckCircle,
          nextStep: 'Begin working on your first milestone.',
          canEdit: false
        };
      case 'rejected':
        return {
          stage: 'Not Approved',
          description: 'Unfortunately, your application was not approved this time.',
          color: 'red',
          icon: AlertCircle,
          nextStep: 'Review feedback and consider applying again with improvements.',
          canEdit: false
        };
      default:
        return {
          stage: 'In Progress',
          description: 'Your application is being processed.',
          color: 'gray',
          icon: Clock,
          nextStep: 'Please wait for updates.',
          canEdit: false
        };
    }
  };

  const stage = getApplicationStage();
  const StageIcon = stage.icon;

  // Calculate funding timeline
  const activeMilestones = currentState?.activeMilestones || [];
  const completedMilestones = submission.milestones?.filter((m: any) => m.status === 'completed').length || 0;
  const totalMilestones = submission.milestones?.length || 0;

  return (
    <div className="space-y-6">
      {/* Status Hero */}
      <Card className={`p-6 border-l-4 ${
        stage.color === 'blue' ? 'border-l-blue-500 bg-blue-50/50' :
        stage.color === 'green' ? 'border-l-green-500 bg-green-50/50' :
        stage.color === 'orange' ? 'border-l-orange-500 bg-orange-50/50' :
        stage.color === 'red' ? 'border-l-red-500 bg-red-50/50' :
        'border-l-gray-500 bg-gray-50/50'
      }`}>
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-full ${
            stage.color === 'blue' ? 'bg-blue-100 text-blue-600' :
            stage.color === 'green' ? 'bg-green-100 text-green-600' :
            stage.color === 'orange' ? 'bg-orange-100 text-orange-600' :
            stage.color === 'red' ? 'bg-red-100 text-red-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            <StageIcon className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{stage.stage}</h2>
              {stage.canEdit && (
                <Badge className="bg-blue-100 text-blue-800">
                  Action Available
                </Badge>
              )}
            </div>
            <p className="text-gray-600 text-lg mb-4">{stage.description}</p>
            
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Next Step</span>
              </div>
              <p className="text-gray-700">{stage.nextStep}</p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Timeline</span>
            </div>
            <p className="text-sm text-gray-600">
              Applied {new Date(submission.appliedAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium">Funding</span>
            </div>
            <p className="text-lg font-bold">${submission.totalAmount?.toLocaleString() || 'TBD'}</p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Milestones</span>
            </div>
            <p className="text-sm">
              {completedMilestones} of {totalMilestones} completed
            </p>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-orange-600" />
              <span className="font-medium">Messages</span>
            </div>
            <p className="text-sm">
              {discussionData?.discussion?.messages?.length || 0} total
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {stage.canEdit && (
          <div className="mt-6 flex gap-3">
            <Button className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Application
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Submit Response
            </Button>
          </div>
        )}
      </Card>

      {/* Tabbed Content */}
      <Card className="p-6">
        <div className="flex items-center gap-1 mb-6 border-b">
          <Button
            variant={activeTab === 'status' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('status')}
            className="rounded-b-none"
          >
            <Clock className="w-4 h-4 mr-2" />
            Progress Status
          </Button>
          <Button
            variant={activeTab === 'feedback' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('feedback')}
            className="rounded-b-none"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback & Discussion
          </Button>
          <Button
            variant={activeTab === 'milestones' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('milestones')}
            className="rounded-b-none"
          >
            <Target className="w-4 h-4 mr-2" />
            Milestones
          </Button>
        </div>

        {/* Status Tab */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Review Progress */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Application Submitted</p>
                    <p className="text-sm text-gray-600">
                      {new Date(submission.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    reviews.length > 0 ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Clock className={`w-4 h-4 ${
                      reviews.length > 0 ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">Curator Review</p>
                    <p className="text-sm text-gray-600">
                      {reviews.length > 0 ? `${reviews.length} curator(s) reviewed` : 'Waiting for review'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    submission.status === 'approved' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <CheckCircle className={`w-4 h-4 ${
                      submission.status === 'approved' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">Final Decision</p>
                    <p className="text-sm text-gray-600">
                      {submission.status === 'approved' ? 'Approved!' : 
                       submission.status === 'rejected' ? 'Not approved' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Voting Results */}
            {reviews.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Curator Voting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Approve</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {reviews.filter(r => r.decision === 'approve').length}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="font-medium">Concerns</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {reviews.filter(r => r.decision === 'reject').length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Curator Feedback Summary */}
            {reviews.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Curator Feedback</h3>
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={review.decision === 'approve' ? 
                          'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'
                        }>
                          {review.decision}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.feedback || 'No specific feedback provided'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion Thread */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Discussion</h3>
              <DiscussionThread
                discussion={discussionData?.discussion}
                submissionId={submission.id}
                currentUser={currentUser}
                onPostMessage={onPostMessage}
                title={submission.title}
                isPublic={true}
              />
            </div>
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Project Milestones</h3>
              {submission.status === 'approved' && (
                <Button variant="outline" size="sm">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Submit Update
                </Button>
              )}
            </div>

            {submission.milestones?.length > 0 ? (
              <div className="space-y-4">
                {submission.milestones.map((milestone: any, index: number) => (
                  <div key={milestone.id} className="p-4 border rounded-lg">
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
                    
                    {milestone.requirements && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium text-gray-700 mb-1">Requirements:</p>
                        <p className="text-sm text-gray-600">{milestone.requirements}</p>
                      </div>
                    )}

                    {milestone.dueDate && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No milestones defined yet</p>
                <p className="text-sm text-gray-500">Milestones will be set up after approval</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Help & Support */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900">Need Help?</h3>
            <p className="text-sm text-blue-700 mb-3">
              If you have questions about your application or need assistance with the process, 
              feel free to ask in the discussion thread or contact the committee directly.
            </p>
            <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
              Contact Support
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 