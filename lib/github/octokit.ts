import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { getUser } from '@/lib/db/queries';

export interface GitHubPRData {
  title: string;
  description: string;
  executiveSummary: string;
  postGrantPlan: string;
  milestones: Array<{
    title: string;
    description: string;
    requirements: string;
    amount: number;
    dueDate: string;
  }>;
  labels: string[];
  totalAmount: number;
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  targetBranch?: string;
}

// Default target repository for grant submissions
const DEFAULT_GITHUB_CONFIG: GitHubConfig = {
  owner: process.env.GITHUB_TARGET_OWNER || 'grantflow-dev',
  repo: process.env.GITHUB_TARGET_REPO || 'submissions',
  targetBranch: 'main',
};

/**
 * Create Octokit instance using GitHub App authentication
 * This provides better security, rate limits, and permissions management
 */
async function createOctokit(): Promise<Octokit> {
  console.log('[createOctokit]: Creating Octokit instance with GitHub App authentication');
  
  // GitHub App authentication
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

  if (!appId || !privateKey || !installationId) {
    throw new Error('[octokit]: Missing GitHub App configuration. Please set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_APP_INSTALLATION_ID environment variables.');
  }

  // Create GitHub App authentication
  const auth = createAppAuth({
    appId: parseInt(appId),
    privateKey: privateKey.replace(/\\n/g, '\n'), // Handle newlines in env var
    installationId: parseInt(installationId),
  });

  // Create Octokit instance with App authentication
  const octokit = new Octokit({
    auth,
    userAgent: 'GrantFlow/1.0.0',
  });

  console.log('[createOctokit]: Successfully created Octokit instance');
  return octokit;
}

/**
 * Generate markdown content for the grant proposal PR
 */
function generateProposalMarkdown(data: GitHubPRData): string {
  const milestonesMarkdown = data.milestones
    .map((milestone, index) => `
### Milestone ${index + 1}: ${milestone.title}

**Description:** ${milestone.description}

**Acceptance Criteria:**
${milestone.requirements}

**Amount:** $${milestone.amount.toLocaleString()}
**Due Date:** ${milestone.dueDate}
`)
    .join('\n');

  return `# Grant Proposal: ${data.title}

## Executive Summary

${data.executiveSummary}

## Project Description

${data.description}

## Project Labels

${data.labels.map(label => `- ${label}`).join('\n')}

## Milestones

${milestonesMarkdown}

## Post-Grant Development Plan

${data.postGrantPlan}

## Funding Summary

**Total Funding Requested:** $${data.totalAmount.toLocaleString()}

---

*This proposal was submitted via the GrantFlow platform.*
`;
}

/**
 * Create a new branch for the grant proposal
 */
async function createProposalBranch(
  octokit: Octokit,
  config: GitHubConfig,
  branchName: string
): Promise<void> {
  try {
    console.log('[octokit]: Creating branch', { branchName, config });

    // Get the reference of the target branch (usually 'main')
    const { data: ref } = await octokit.rest.git.getRef({
      owner: config.owner,
      repo: config.repo,
      ref: `heads/${config.targetBranch}`,
    });

    // Create new branch from target branch
    await octokit.rest.git.createRef({
      owner: config.owner,
      repo: config.repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });

    console.log('[octokit]: Branch created successfully', { branchName });
  } catch (error: any) {
    if (error.status === 422 && error.message?.includes('already exists')) {
      console.log('[octokit]: Branch already exists, using existing branch', { branchName });
      return;
    }
    throw error;
  }
}

/**
 * Create or update a file in the repository
 */
async function createProposalFile(
  octokit: Octokit,
  config: GitHubConfig,
  branchName: string,
  fileName: string,
  content: string,
  commitMessage: string
): Promise<void> {
  try {
    console.log('[octokit]: Creating/updating file', { fileName, branchName });

    // Try to get existing file to check if it exists
    let sha: string | undefined;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path: fileName,
        ref: branchName,
      });

      if ('sha' in existingFile) {
        sha = existingFile.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
      // File doesn't exist, that's fine
    }

    // Create or update the file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: config.owner,
      repo: config.repo,
      path: fileName,
      message: commitMessage,
      content: Buffer.from(content).toString('base64'),
      branch: branchName,
      sha, // Include SHA if updating existing file
    });

    console.log('[octokit]: File created/updated successfully', { fileName });
  } catch (error) {
    console.error('[octokit]: Error creating file', { fileName, error });
    throw error;
  }
}

/**
 * Create a pull request for the grant proposal
 */
async function createPullRequest(
  octokit: Octokit,
  config: GitHubConfig,
  branchName: string,
  data: GitHubPRData
): Promise<string> {
  try {
    console.log('[octokit]: Creating pull request', { branchName, title: data.title });

    const prTitle = `Grant Proposal: ${data.title}`;
    const prBody = `## Grant Proposal Submission

**Project:** ${data.title}
**Total Funding:** $${data.totalAmount.toLocaleString()}
**Milestones:** ${data.milestones.length}

### Executive Summary
${data.executiveSummary}

### Labels
${data.labels.map(label => `- ${label}`).join('\n')}

---

Please review the full proposal in the \`proposal.md\` file in this PR.

*Submitted via GrantFlow platform*
`;

    const { data: pr } = await octokit.rest.pulls.create({
      owner: config.owner,
      repo: config.repo,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: config.targetBranch || 'main',
    });

    console.log('[octokit]: Pull request created successfully', {
      prNumber: pr.number,
      prUrl: pr.html_url,
    });

    return pr.html_url;
  } catch (error) {
    console.error('[octokit]: Error creating pull request', error);
    throw error;
  }
}

/**
 * Main function to create a GitHub PR for a grant proposal
 */
export async function createGrantProposalPR(
  proposalData: GitHubPRData,
  config: GitHubConfig = DEFAULT_GITHUB_CONFIG
): Promise<string> {
  try {
    console.log('[octokit]: Starting GitHub PR creation process', {
      title: proposalData.title,
      config,
    });

    const octokit = await createOctokit();
    
    // Generate unique branch name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const sanitizedTitle = proposalData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const branchName = `proposal/${timestamp}-${sanitizedTitle}`;

    // Create proposal branch
    await createProposalBranch(octokit, config, branchName);

    // Generate proposal content
    const proposalContent = generateProposalMarkdown(proposalData);
    const fileName = `proposals/${sanitizedTitle}.md`;
    const commitMessage = `Add grant proposal: ${proposalData.title}`;

    // Create proposal file
    await createProposalFile(
      octokit,
      config,
      branchName,
      fileName,
      proposalContent,
      commitMessage
    );

    // Create pull request
    const prUrl = await createPullRequest(octokit, config, branchName, proposalData);

    console.log('[octokit]: GitHub PR creation completed successfully', { prUrl });
    return prUrl;

  } catch (error) {
    console.error('[octokit]: Failed to create GitHub PR', error);
    throw new Error(`Failed to create GitHub PR: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get PR details from URL
 */
export function parsePRUrl(prUrl: string): { owner: string; repo: string; prNumber: number } | null {
  const match = prUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
  if (!match) return null;
  
  return {
    owner: match[1],
    repo: match[2],
    prNumber: parseInt(match[3], 10),
  };
}

/**
 * Get PR status and details
 */
export async function getPRStatus(prUrl: string): Promise<{
  state: string;
  merged: boolean;
  mergeable: boolean | null;
  comments: number;
  reviews: number;
} | null> {
  try {
    const prInfo = parsePRUrl(prUrl);
    if (!prInfo) return null;

    const octokit = await createOctokit();
    
    const { data: pr } = await octokit.rest.pulls.get({
      owner: prInfo.owner,
      repo: prInfo.repo,
      pull_number: prInfo.prNumber,
    });

    const { data: reviews } = await octokit.rest.pulls.listReviews({
      owner: prInfo.owner,
      repo: prInfo.repo,
      pull_number: prInfo.prNumber,
    });

    return {
      state: pr.state,
      merged: pr.merged,
      mergeable: pr.mergeable,
      comments: pr.comments,
      reviews: reviews.length,
    };
  } catch (error) {
    console.error('[octokit]: Error getting PR status', error);
    return null;
  }
} 