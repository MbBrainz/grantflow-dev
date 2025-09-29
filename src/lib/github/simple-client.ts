/**
 * Simplified GitHub REST API client for reading public repositories
 * No GitHub App authentication needed - just basic REST calls
 */

export interface GitHubCommit {
  sha: string
  shortSha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
  committer: {
    name: string
    email: string
    date: string
  }
  url: string
  stats?: {
    additions: number
    deletions: number
    total: number
  }
}

export interface GitHubCommitDetail extends GitHubCommit {
  files: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
    changes: number
  }>
}

/**
 * Parse GitHub repository URL to extract owner and repo
 */
export function parseGitHubRepoUrl(
  repoUrl: string
): { owner: string; repo: string } | null {
  const match = repoUrl.match(
    /https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/.*)?$/
  )
  if (!match) return null

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''), // Remove .git suffix if present
  }
}

/**
 * Create GitHub API request headers
 * Includes personal access token if available for better rate limits
 */
function createHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GrantFlow/1.0.0',
  }

  // Add token if available for better rate limits (5000/hour vs 60/hour)
  const token =
    process.env.NEXT_PUBLIC_GITHUB_TOKEN ||
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  if (token) {
    headers['Authorization'] = `token ${token}`
  }

  return headers
}

/**
 * Make GitHub API request with error handling
 */
async function githubApiRequest<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: createHeaders(),
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[github-simple]: Resource not found:', url)
        return null
      }

      if (response.status === 403) {
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining')
        console.warn(
          '[github-simple]: Rate limit exceeded. Remaining:',
          rateLimitRemaining
        )
        throw new Error(
          'GitHub API rate limit exceeded. Please add GITHUB_TOKEN environment variable for higher limits.'
        )
      }

      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    console.error('[github-simple]: API request failed:', { url, error })
    return null
  }
}

/**
 * Get commits from a repository with optional date range
 */
export async function getRepositoryCommits(
  repoUrl: string,
  options: {
    since?: Date
    until?: Date
    author?: string
    branch?: string
    perPage?: number
  } = {}
): Promise<GitHubCommit[] | null> {
  try {
    console.log('[github-simple]: Fetching commits from repository', {
      repoUrl,
      options,
    })

    const repoInfo = parseGitHubRepoUrl(repoUrl)
    if (!repoInfo) {
      console.error('[github-simple]: Invalid repository URL', { repoUrl })
      return null
    }

    const params = new URLSearchParams()
    params.append('per_page', String(options.perPage || 50))

    if (options.since) {
      params.append('since', options.since.toISOString())
    }
    if (options.until) {
      params.append('until', options.until.toISOString())
    }
    if (options.author) {
      params.append('author', options.author)
    }
    if (options.branch) {
      params.append('sha', options.branch)
    }

    const url = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits?${params.toString()}`
    const commits = await githubApiRequest<any[]>(url)

    if (!commits) {
      return null
    }

    console.log('[github-simple]: Successfully fetched commits', {
      count: commits.length,
      repo: `${repoInfo.owner}/${repoInfo.repo}`,
    })

    return commits.map(commit => ({
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name || 'Unknown',
        email: commit.commit.author?.email || '',
        date: commit.commit.author?.date || '',
      },
      committer: {
        name: commit.commit.committer?.name || 'Unknown',
        email: commit.commit.committer?.email || '',
        date: commit.commit.committer?.date || '',
      },
      url: commit.html_url,
      stats: commit.stats
        ? {
            additions: commit.stats.additions || 0,
            deletions: commit.stats.deletions || 0,
            total: commit.stats.total || 0,
          }
        : undefined,
    }))
  } catch (error) {
    console.error('[github-simple]: Error fetching repository commits', {
      repoUrl,
      error,
    })
    return null
  }
}

/**
 * Get commits since a specific commit SHA, or all commits if no SHA provided (first milestone)
 */
export async function getCommitsSince(
  repoUrl: string,
  sinceCommitSha?: string,
  options: {
    branch?: string
    perPage?: number
  } = {}
): Promise<GitHubCommit[] | null> {
  try {
    console.log('[github-simple]: Fetching commits since SHA', {
      repoUrl,
      sinceCommitSha,
      options,
    })

    const repoInfo = parseGitHubRepoUrl(repoUrl)
    if (!repoInfo) {
      console.error('[github-simple]: Invalid repository URL', { repoUrl })
      return null
    }
    // for the first milestone, we need to get all commits
    sinceCommitSha = undefined

    const params = new URLSearchParams()
    params.append('per_page', String(options.perPage || 50))

    // If no sinceCommitSha provided, get all commits (first milestone case)
    if (!sinceCommitSha) {
      console.log(
        '[github-simple]: No commit SHA provided, fetching all commits'
      )

      if (options.branch) {
        params.append('sha', options.branch)
      }

      const url = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits?${params.toString()}`
      const commits = await githubApiRequest<any[]>(url)

      if (!commits) {
        return null
      }

      console.log('[github-simple]: Successfully fetched all commits', {
        count: commits.length,
        repo: `${repoInfo.owner}/${repoInfo.repo}`,
      })

      return commits.map(commit => ({
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || 'Unknown',
          email: commit.commit.author?.email || '',
          date: commit.commit.author?.date || '',
        },
        committer: {
          name: commit.commit.committer?.name || 'Unknown',
          email: commit.commit.committer?.email || '',
          date: commit.commit.committer?.date || '',
        },
        url: commit.html_url,
      }))
    }

    // If sinceCommitSha provided, get commits since that specific commit
    const refCommitUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits/${sinceCommitSha}`
    const refCommit = await githubApiRequest<any>(refCommitUrl)

    if (!refCommit) {
      console.error('[github-simple]: Could not find reference commit', {
        sinceCommitSha,
      })
      return null
    }

    const sinceDate = new Date(
      refCommit.commit.committer?.date || refCommit.commit.author?.date || ''
    )

    // Add 1 second to exclude the reference commit itself
    sinceDate.setSeconds(sinceDate.getSeconds() + 1)

    params.append('since', sinceDate.toISOString())

    if (options.branch) {
      params.append('sha', options.branch)
    }

    const url = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits?${params.toString()}`
    const commits = await githubApiRequest<any[]>(url)

    if (!commits) {
      return null
    }

    console.log('[github-simple]: Successfully fetched commits since SHA', {
      count: commits.length,
      sinceCommitSha,
      repo: `${repoInfo.owner}/${repoInfo.repo}`,
    })

    return commits.map(commit => ({
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name || 'Unknown',
        email: commit.commit.author?.email || '',
        date: commit.commit.author?.date || '',
      },
      committer: {
        name: commit.commit.committer?.name || 'Unknown',
        email: commit.commit.committer?.email || '',
        date: commit.commit.committer?.date || '',
      },
      url: commit.html_url,
    }))
  } catch (error) {
    console.error('[github-simple]: Error fetching commits since SHA', {
      repoUrl,
      sinceCommitSha,
      error,
    })
    return null
  }
}

/**
 * Get commit details including file changes
 */
export async function getCommitDetails(
  repoUrl: string,
  commitSha: string
): Promise<GitHubCommitDetail | null> {
  try {
    console.log('[github-simple]: Fetching commit details', {
      repoUrl,
      commitSha,
    })

    const repoInfo = parseGitHubRepoUrl(repoUrl)
    if (!repoInfo) {
      console.error('[github-simple]: Invalid repository URL', { repoUrl })
      return null
    }

    const url = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits/${commitSha}`
    const commit = await githubApiRequest<any>(url)

    if (!commit) {
      return null
    }

    console.log('[github-simple]: Successfully fetched commit details', {
      commitSha,
      filesChanged: commit.files?.length || 0,
      repo: `${repoInfo.owner}/${repoInfo.repo}`,
    })

    return {
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name || 'Unknown',
        email: commit.commit.author?.email || '',
        date: commit.commit.author?.date || '',
      },
      committer: {
        name: commit.commit.committer?.name || 'Unknown',
        email: commit.commit.committer?.email || '',
        date: commit.commit.committer?.date || '',
      },
      url: commit.html_url,
      stats: {
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
        total: commit.stats?.total || 0,
      },
      files:
        commit.files?.map((file: any) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions || 0,
          deletions: file.deletions || 0,
          changes: file.changes || 0,
        })) || [],
    }
  } catch (error) {
    console.error('[github-simple]: Error fetching commit details', {
      repoUrl,
      commitSha,
      error,
    })
    return null
  }
}

/**
 * Get repository information (public repositories only)
 */
export async function getRepositoryInfo(repoUrl: string): Promise<{
  name: string
  fullName: string
  description: string | null
  defaultBranch: string
  stars: number
  forks: number
  language: string | null
  isPrivate: boolean
} | null> {
  try {
    const repoInfo = parseGitHubRepoUrl(repoUrl)
    if (!repoInfo) {
      return null
    }

    const url = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`
    const repo = await githubApiRequest<any>(url)

    if (!repo) {
      return null
    }

    return {
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      defaultBranch: repo.default_branch,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      isPrivate: repo.private,
    }
  } catch (error) {
    console.error('[github-simple]: Error fetching repository info', {
      repoUrl,
      error,
    })
    return null
  }
}
