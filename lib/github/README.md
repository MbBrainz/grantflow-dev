# GitHub Integration

This directory contains two approaches to GitHub API integration:

## 1. Simple Client (Recommended) 📄 `simple-client.ts`

**Use case:** Reading public repositories for milestone submissions

**Features:**
- ✅ Pure REST API calls with `fetch()`
- ✅ No authentication required for public repos
- ✅ Optional Personal Access Token for better rate limits
- ✅ Simple, lightweight, easy to understand
- ✅ Perfect for milestone commit analysis

**Rate Limits:**
- Without token: 60 requests/hour
- With personal token: 5,000 requests/hour

**Environment Variables:**
```bash
# Optional - improves rate limits
GITHUB_TOKEN="ghp_your_personal_access_token"
# or
GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_personal_access_token"
```

**Usage:**
```typescript
import { getRepositoryCommits, getCommitsSince } from '@/lib/github/simple-client';

// Get recent commits
const commits = await getRepositoryCommits('https://github.com/owner/repo', {
  since: new Date('2024-01-01'),
  perPage: 50
});

// Get commits since a specific SHA
const newCommits = await getCommitsSince('https://github.com/owner/repo', 'abc123');
```

## 2. Full Octokit Client (Complex) 📄 `octokit.ts`

**Use case:** Creating PRs, managing repositories, write operations

**Features:**
- ❌ Complex GitHub App authentication
- ❌ Requires private keys, installation IDs
- ❌ Heavyweight Octokit dependency
- ❌ Overkill for read-only operations
- ✅ Can create PRs and manage repositories

**Currently not used** - The plan.md states PR creation was removed.

## Migration Path

If you need to add PR creation back in the future:

1. **For public repo reading:** Keep using `simple-client.ts`
2. **For PR creation:** Use `octokit.ts` or create a hybrid approach
3. **For organization repos:** May need GitHub App authentication

## Which Client Should I Use?

| Operation | Recommended Client | Reason |
|-----------|-------------------|--------|
| Read commits from public repos | `simple-client.ts` | No auth needed, simpler |
| Read commits from private repos | `octokit.ts` | Needs authentication |
| Create PRs/branches | `octokit.ts` | Needs write permissions |
| Get repo metadata | `simple-client.ts` | Public data, no auth needed |
| Milestone submissions | `simple-client.ts` | Currently used approach |

## Benefits of Simple Client

1. **No setup complexity** - Just add optional token
2. **Fewer dependencies** - No `@octokit/*` packages needed
3. **Better security** - No private keys to manage
4. **Easier debugging** - Plain HTTP requests
5. **Faster startup** - No authentication overhead
6. **Rate limit friendly** - Works without tokens

## Personal Access Token Setup (Optional)

For better rate limits, create a GitHub Personal Access Token:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these scopes:
   - `public_repo` (for public repository access)
3. Add to environment: `GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"`

**Note:** Only needed if you hit rate limits (60/hour without token) 