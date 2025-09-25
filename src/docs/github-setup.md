# GitHub Integration Setup

This document explains how to set up GitHub integration for GrantFlow to enable automatic PR creation for grant submissions.

## Prerequisites

1. GitHub OAuth App (already configured for authentication)
2. GitHub Personal Access Token or GitHub App for API access
3. Target repository for grant submissions

## Setup Steps

### 1. GitHub OAuth (Already Configured)

The GitHub OAuth for user authentication should already be configured with these environment variables:

```bash
GITHUB_CLIENT_ID="your-github-oauth-app-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-client-secret"
GITHUB_REDIRECT_URI="http://localhost:3000/api/auth/github/callback"
```

### 2. GitHub App Setup (Recommended)

GitHub Apps provide better security, higher rate limits, and fine-grained permissions compared to personal access tokens.

#### Creating a GitHub App

1. Go to GitHub Settings > Developer settings > GitHub Apps
2. Click "New GitHub App"
3. Fill in the basic information:
   - **App name**: `GrantFlow-YourOrg` (must be unique)
   - **Homepage URL**: `https://your-domain.com` or `http://localhost:3000`
   - **Webhook URL**: `https://your-domain.com/api/webhooks/github` (optional for now)
   - **Webhook secret**: Leave blank for now

4. Set **Repository permissions**:
   - **Contents**: Read & Write (to create files and PRs)
   - **Pull requests**: Write (to create and manage PRs)
   - **Metadata**: Read (basic repo info)

5. **Where can this GitHub App be installed?**: Choose "Only on this account"
6. Click "Create GitHub App"

#### Configure the GitHub App

After creation, you'll get:
- **App ID** (found on the app's General tab)
- **Private Key** (generate and download from the app's General tab)

7. Generate a private key:
   - Scroll down to "Private keys" section
   - Click "Generate a private key"
   - Download the `.pem` file

8. Install the app on your target repository:
   - Go to the app's "Install App" tab
   - Click "Install" next to your account/organization
   - Choose the repositories where PRs should be created

9. Get the Installation ID:
   - After installation, note the installation ID from the URL (e.g., `/installations/12345678`)

#### Environment Variables

Add these to your `.env.local`:

```bash
# GitHub App Configuration
GITHUB_APP_ID="123456"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYour private key content here...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID="12345678"

# Target Repository (where PRs will be created)
GITHUB_TARGET_OWNER="your-org"
GITHUB_TARGET_REPO="grant-submissions"
```

**Important Notes:**
- Store the private key securely and never commit it to version control
- The private key can be stored as a single-line string in the environment variable (newlines will be handled automatically)
- For production deployment, use your hosting provider's secret management system

### 3. Target Repository Configuration

Set up the repository where grant submissions will be created as PRs:

```bash
GITHUB_TARGET_OWNER="your-organization-or-username"
GITHUB_TARGET_REPO="submissions"
```

For example:
- `GITHUB_TARGET_OWNER="grantflow-dev"`
- `GITHUB_TARGET_REPO="grant-submissions"`

### 4. Repository Structure

The target repository should have this structure:

```
your-submissions-repo/
├── README.md
├── proposals/
│   ├── project-name-1.md
│   ├── project-name-2.md
│   └── ...
└── .github/
    └── PULL_REQUEST_TEMPLATE.md
```

### 5. Testing the Integration

1. Start your development server: `pnpm dev`
2. Navigate to `/dashboard/submissions/new`
3. Fill out and submit a grant proposal
4. Check that a PR is created in your target repository
5. Verify the PR contains the properly formatted proposal

## How It Works

1. User submits grant proposal through GrantFlow
2. System creates a new branch in target repository
3. Proposal is formatted as Markdown and committed to the branch
4. Pull request is created with proposal content
5. PR URL is stored in the database and shown to user
6. Curators can review and discuss the proposal directly on GitHub

## Troubleshooting

### Common Issues

1. **"No GitHub token configured" error**
   - Ensure `GITHUB_TOKEN` or `GITHUB_APP_TOKEN` is set in your environment

2. **"Repository not found" error**
   - Verify `GITHUB_TARGET_OWNER` and `GITHUB_TARGET_REPO` are correct
   - Ensure your token has access to the target repository

3. **"Permission denied" error**
   - Check that your token has the required scopes/permissions
   - For GitHub Apps, ensure the app is installed on the target repository

4. **"Branch already exists" error**
   - This is normal and handled gracefully
   - The system will use the existing branch

### Debugging

Enable debug logging by checking the server console for logs starting with `[octokit]:`.

## Security Considerations

1. **Token Security**: Never commit tokens to your repository
2. **Scope Limitation**: Use minimal required scopes for tokens
3. **Repository Access**: Limit token access to only necessary repositories
4. **Webhook Security**: Implement webhook signature verification (for GitHub Apps)

## Production Deployment

For production:

1. Use GitHub App instead of Personal Access Token
2. Set up proper webhook endpoints
3. Implement token refresh logic
4. Use organization-owned repositories
5. Set up proper branch protection rules
6. Configure automated testing on PRs 