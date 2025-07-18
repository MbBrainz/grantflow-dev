'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed checkbox import - will use HTML input instead
import { 
  Target, 
  Github, 
  GitCommit, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  FileText,
  Users
} from 'lucide-react';
import { getRepositoryCommits, getCommitsSince, GitHubCommit } from '@/lib/github/simple-client';

// Use GitHubCommit type from simple-client
type Commit = GitHubCommit;

interface Milestone {
  id: number;
  title: string;
  description: string | null;
  requirements: string | null;
  amount: number | null;
  dueDate: Date | null;
  status: string;
  deliverables: string | null;
  githubRepoUrl: string | null;
  githubCommitHash: string | null; // Last completed milestone commit
}

interface MilestoneSubmissionFormProps {
  milestone: Milestone;
  submissionRepoUrl: string | null;
  previousMilestoneCommitSha?: string | null; // Last approved milestone commit
  onSubmit: (data: {
    milestoneId: number;
    selectedCommits: string[];
    deliverables: string;
    githubCommitHashes: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

export function MilestoneSubmissionForm({
  milestone,
  submissionRepoUrl,
  previousMilestoneCommitSha,
  onSubmit,
  onCancel
}: MilestoneSubmissionFormProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set());
  const [deliverables, setDeliverables] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse requirements from milestone
  const requirements = milestone.requirements 
    ? JSON.parse(milestone.requirements) 
    : ['Complete milestone objectives'];

  // Parse existing deliverables if any
  const existingDeliverables = milestone.deliverables 
    ? JSON.parse(milestone.deliverables) 
    : [];

  useEffect(() => {
    async function fetchCommits() {
      if (!submissionRepoUrl) {
        setError('No GitHub repository URL found for this submission');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let fetchedCommits: Commit[] | null = null;

        if (previousMilestoneCommitSha) {
          // Fetch commits since the last milestone completion
          console.log('[MilestoneSubmissionForm]: Fetching commits since last milestone', {
            sinceCommit: previousMilestoneCommitSha
          });
          fetchedCommits = await getCommitsSince(submissionRepoUrl, previousMilestoneCommitSha);
        } else {
          // Fetch recent commits (last 30 days or 50 commits, whichever comes first)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          console.log('[MilestoneSubmissionForm]: Fetching recent commits', {
            since: thirtyDaysAgo.toISOString()
          });
          fetchedCommits = await getRepositoryCommits(submissionRepoUrl, {
            since: thirtyDaysAgo,
            perPage: 50
          });
        }

        if (fetchedCommits) {
          setCommits(fetchedCommits);
          
          // Auto-select all commits by default (as per requirement)
          const autoSelected = new Set(fetchedCommits.map(commit => commit.sha));
          setSelectedCommits(autoSelected);
          
          console.log('[MilestoneSubmissionForm]: Auto-selected commits', {
            count: autoSelected.size,
            commits: Array.from(autoSelected).map(sha => sha.substring(0, 7))
          });
        } else {
          setError('Failed to fetch commits from GitHub repository');
        }
      } catch (err) {
        console.error('[MilestoneSubmissionForm]: Error fetching commits', err);
        setError('Failed to fetch commits from GitHub repository');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCommits();
  }, [submissionRepoUrl, previousMilestoneCommitSha]);

  const handleCommitToggle = (commitSha: string) => {
    const newSelected = new Set(selectedCommits);
    if (newSelected.has(commitSha)) {
      newSelected.delete(commitSha);
    } else {
      newSelected.add(commitSha);
    }
    setSelectedCommits(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCommits.size === commits.length) {
      setSelectedCommits(new Set());
    } else {
      setSelectedCommits(new Set(commits.map(commit => commit.sha)));
    }
  };

  const handleSubmit = async () => {
    if (selectedCommits.size === 0) {
      setError('Please select at least one commit to submit with this milestone');
      return;
    }

    if (!deliverables.trim()) {
      setError('Please provide a description of deliverables for this milestone');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        milestoneId: milestone.id,
        selectedCommits: Array.from(selectedCommits),
        deliverables: deliverables.trim(),
        githubCommitHashes: Array.from(selectedCommits),
      });

      console.log('[MilestoneSubmissionForm]: Milestone submitted successfully', {
        milestoneId: milestone.id,
        selectedCommitsCount: selectedCommits.size
      });
    } catch (err) {
      console.error('[MilestoneSubmissionForm]: Error submitting milestone', err);
      setError('Failed to submit milestone. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalStats = () => {
    const selectedCommitObjects = commits.filter(commit => selectedCommits.has(commit.sha));
    return selectedCommitObjects.reduce(
      (total, commit) => ({
        additions: total.additions + (commit.stats?.additions || 0),
        deletions: total.deletions + (commit.stats?.deletions || 0),
        total: total.total + (commit.stats?.total || 0),
      }),
      { additions: 0, deletions: 0, total: 0 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Milestone Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <CardTitle>Submit Milestone: {milestone.title}</CardTitle>
          </div>
          <CardDescription>
            Select the commits that demonstrate completion of this milestone's requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Milestone Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium">
                ${milestone.amount?.toLocaleString() || 0}
              </span>
            </div>
            {milestone.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm">
                  Due: {new Date(milestone.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Requirements */}
          <div>
            <h4 className="font-medium mb-2">Requirements to Complete:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {requirements.map((req: string, index: number) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>

          {/* Description */}
          {milestone.description && (
            <div>
              <h4 className="font-medium mb-2">Description:</h4>
              <p className="text-sm text-gray-600">{milestone.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commit Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              <CardTitle>Select Commits</CardTitle>
            </div>
            {commits.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedCommits.size === commits.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
          <CardDescription>
            {previousMilestoneCommitSha 
              ? 'Commits since the last approved milestone are auto-selected'
              : 'Recent commits from the repository are auto-selected'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="w-6 h-6 animate-spin mr-2" />
              <span>Loading commits from GitHub...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 py-4 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : commits.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <GitCommit className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commits found for this milestone period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Commit Statistics */}
              {selectedCommits.size > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">Selected: {selectedCommits.size} commits</span>
                    {(() => {
                      const stats = getTotalStats();
                      return (
                        <div className="flex gap-3">
                          <span className="text-green-600">+{stats.additions}</span>
                          <span className="text-red-600">-{stats.deletions}</span>
                          <span className="text-gray-600">{stats.total} changes</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Commit List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {commits.map((commit) => (
                  <div
                    key={commit.sha}
                    className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                      selectedCommits.has(commit.sha)
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                                         <input
                       type="checkbox"
                       checked={selectedCommits.has(commit.sha)}
                       onChange={() => handleCommitToggle(commit.sha)}
                       className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                     />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {commit.shortSha}
                        </code>
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {commit.message.split('\n')[0]}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{commit.author.name}</span>
                        <span>{formatDate(commit.author.date)}</span>
                        {commit.stats && (
                          <div className="flex gap-2">
                            <span className="text-green-600">+{commit.stats.additions}</span>
                            <span className="text-red-600">-{commit.stats.deletions}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deliverables Description */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <CardTitle>Deliverables Description</CardTitle>
          </div>
          <CardDescription>
            Describe what you've delivered for this milestone and how the selected commits fulfill the requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
                         <label className="text-sm font-medium">Deliverables Description *</label>
            <textarea
              id="deliverables"
              className="w-full min-h-[120px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              placeholder="Provide a detailed description of what you've delivered for this milestone. Explain how the selected commits demonstrate completion of the requirements..."
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Be specific about features implemented, bugs fixed, and requirements addressed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedCommits.size === 0 || !deliverables.trim()}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Submit Milestone
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
} 