'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { User } from '@/lib/db/schema';

interface Vote {
  id: number;
  curatorId: number;
  vote: string;
  feedback: string | null;
  createdAt: string;
  curator: {
    id: number;
    name: string | null;
    role: string;
  };
}

interface CuratorVotingProps {
  submissionId: number;
  milestoneId?: number;
  currentUser: User | null;
  existingVotes: Vote[];
  onVoteSubmitted: () => void;
  isOpen?: boolean;
}

const voteOptions = [
  { 
    value: 'approve', 
    label: 'Approve', 
    icon: CheckCircle, 
    color: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
    description: 'This submission meets the requirements and should be approved'
  },
  { 
    value: 'request_changes', 
    label: 'Request Changes', 
    icon: AlertCircle, 
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100',
    description: 'This submission needs improvements before approval'
  },
  { 
    value: 'reject', 
    label: 'Reject', 
    icon: XCircle, 
    color: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100',
    description: 'This submission does not meet the requirements'
  }
];

export function CuratorVoting({
  submissionId,
  milestoneId,
  currentUser,
  existingVotes,
  onVoteSubmitted,
  isOpen = true
}: CuratorVotingProps) {
  const [selectedVote, setSelectedVote] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showVotingInterface, setShowVotingInterface] = useState(false);

  // Check if current user is a curator
  const isCurator = currentUser && (currentUser.role === 'curator' || currentUser.role === 'admin');
  
  // Check if current user has already voted
  const userVote = existingVotes.find(vote => vote.curatorId === currentUser?.id);
  
  // Calculate vote summary
  const voteSummary = existingVotes.reduce((acc, vote) => {
    acc[vote.vote] = (acc[vote.vote] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleVoteSubmit = async () => {
    if (!selectedVote || !currentUser) return;

    startTransition(async () => {
      try {
        // Create a vote message in the discussion
        const content = `**${selectedVote.replace('_', ' ').toUpperCase()}** ${feedback ? `\n\n${feedback}` : ''}`;

        // Use the existing postMessageToSubmission or postMessageToMilestone action
        const { postMessageToSubmission, postMessageToMilestone } = await import('@/app/(dashboard)/dashboard/submissions/discussion-actions');
        
        let result;
        if (milestoneId) {
          result = await postMessageToMilestone({
            content,
            milestoneId: Number(milestoneId),
            messageType: 'vote'
          }, new FormData());
        } else {
          result = await postMessageToSubmission({
            content,
            submissionId: Number(submissionId),
            messageType: 'vote'
          }, new FormData());
        }

        if (result.error) {
          throw new Error(result.error);
        }

        // Reset form
        setSelectedVote('');
        setFeedback('');
        setShowVotingInterface(false);
        onVoteSubmitted();

      } catch (error) {
        console.error('[CuratorVoting]: Error submitting vote', error);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <Card className="p-6 border-2 border-blue-100 bg-blue-50/30">
      <div className="space-y-4">
        {/* Vote Summary */}
        {existingVotes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Curator Reviews ({existingVotes.length})
            </h4>
            
            <div className="flex gap-4 text-sm">
              {Object.entries(voteSummary).map(([vote, count]) => {
                const option = voteOptions.find(opt => opt.value === vote);
                if (!option) return null;
                const Icon = option.icon;
                
                return (
                  <div key={vote} className="flex items-center gap-1">
                    <Icon className="w-4 h-4" />
                    <span className="capitalize">{vote.replace('_', ' ')}: {count}</span>
                  </div>
                );
              })}
            </div>

            {/* Show individual votes */}
            <div className="space-y-2">
              {existingVotes.map((vote) => (
                <div key={vote.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{vote.curator.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                      vote.vote === 'approve' ? 'bg-green-100 text-green-800' :
                      vote.vote === 'reject' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {vote.vote.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(vote.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {vote.feedback && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{vote.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voting Interface */}
        {isCurator && !userVote && (
          <div className="space-y-4">
            {!showVotingInterface ? (
              <Button 
                onClick={() => setShowVotingInterface(true)}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Cast Your Vote
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vote-options" className="text-sm font-medium mb-3 block">
                    Select your review decision:
                  </Label>
                  <div id="vote-options" className="grid gap-2">
                    {voteOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedVote(option.value)}
                          className={`p-3 border-2 rounded-lg text-left transition-colors ${
                            selectedVote === option.value 
                              ? option.color 
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-600">{option.description}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedVote && (
                  <div>
                    <Label htmlFor="feedback" className="text-sm font-medium">
                      Comments {selectedVote === 'approve' ? '(optional)' : '(recommended)'}
                    </Label>
                    <textarea
                      id="feedback"
                      placeholder={
                        selectedVote === 'approve' 
                          ? 'Any additional comments on this submission...'
                          : selectedVote === 'request_changes'
                          ? 'What changes are needed for approval?'
                          : 'Why should this submission be rejected?'
                      }
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="mt-2 w-full p-3 border border-gray-300 rounded-lg min-h-[100px] resize-y"
                    />
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowVotingInterface(false);
                      setSelectedVote('');
                      setFeedback('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleVoteSubmit}
                    disabled={!selectedVote || isPending}
                    className="flex items-center gap-2"
                  >
                    {isPending ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User already voted */}
        {isCurator && userVote && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ✓ You have already submitted your review: <span className="font-medium capitalize">{userVote.vote.replace('_', ' ')}</span>
            </p>
          </div>
        )}

        {/* Non-curator message */}
        {!isCurator && currentUser && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              Only curators can vote on submissions. You can participate in the discussion above.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
} 