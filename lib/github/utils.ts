import { getPRStatus, parsePRUrl } from './octokit';

export interface PRStatus {
  state: 'open' | 'closed' | 'merged';
  status: 'draft' | 'review' | 'approved' | 'changes_requested' | 'merged' | 'unknown';
  color: 'gray' | 'yellow' | 'green' | 'red' | 'purple';
  label: string;
  comments: number;
  reviews: number;
}

/**
 * Get a simplified PR status for display
 */
export async function getSimplifiedPRStatus(prUrl: string): Promise<PRStatus | null> {
  try {
    const status = await getPRStatus(prUrl);
    if (!status) return null;

    let displayStatus: PRStatus['status'] = 'unknown';
    let color: PRStatus['color'] = 'gray';
    let label = 'Unknown';

    if (status.merged) {
      displayStatus = 'merged';
      color = 'purple';
      label = 'Merged';
    } else if (status.state === 'closed') {
      displayStatus = 'changes_requested';
      color = 'red';
      label = 'Closed';
    } else if (status.state === 'open') {
      if (status.reviews > 0) {
        displayStatus = 'review';
        color = 'yellow';
        label = 'Under Review';
      } else {
        displayStatus = 'draft';
        color = 'gray';
        label = 'Draft';
      }
    }

    return {
      state: status.state as 'open' | 'closed' | 'merged',
      status: displayStatus,
      color,
      label,
      comments: status.comments,
      reviews: status.reviews,
    };
  } catch (error) {
    console.error('[getSimplifiedPRStatus]: Error getting PR status', error);
    return null;
  }
}

/**
 * Check if a URL is a valid GitHub PR URL
 */
export function isValidGitHubPRUrl(url: string): boolean {
  return parsePRUrl(url) !== null;
}

/**
 * Extract PR number from GitHub PR URL
 */
export function extractPRNumber(prUrl: string): number | null {
  const parsed = parsePRUrl(prUrl);
  return parsed ? parsed.prNumber : null;
}

/**
 * Get repository info from PR URL
 */
export function getRepoInfo(prUrl: string): { owner: string; repo: string } | null {
  const parsed = parsePRUrl(prUrl);
  return parsed ? { owner: parsed.owner, repo: parsed.repo } : null;
}

/**
 * Format PR URL for display (shortened version)
 */
export function formatPRUrlForDisplay(prUrl: string): string {
  const parsed = parsePRUrl(prUrl);
  if (!parsed) return prUrl;
  
  return `${parsed.owner}/${parsed.repo}#${parsed.prNumber}`;
}

/**
 * Get badge color classes for PR status
 */
export function getPRStatusClasses(status: PRStatus['status']): string {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  switch (status) {
    case 'draft':
      return `${baseClasses} bg-gray-100 text-gray-800`;
    case 'review':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'approved':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'changes_requested':
      return `${baseClasses} bg-red-100 text-red-800`;
    case 'merged':
      return `${baseClasses} bg-purple-100 text-purple-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
} 