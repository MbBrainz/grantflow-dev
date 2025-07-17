#!/usr/bin/env tsx

/**
 * GitHub App Configuration Verification Script
 * 
 * This script helps verify that your GitHub App is properly configured
 * and can successfully authenticate and access the target repository.
 */

import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

async function verifyGitHubApp() {
  console.log('🔍 Verifying GitHub App Configuration...\n');

  // Check required environment variables
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const targetOwner = process.env.GITHUB_TARGET_OWNER;
  const targetRepo = process.env.GITHUB_TARGET_REPO;

  console.log('📋 Environment Variables:');
  console.log(`   GITHUB_APP_ID: ${appId ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GITHUB_APP_PRIVATE_KEY: ${privateKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GITHUB_APP_INSTALLATION_ID: ${installationId ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GITHUB_TARGET_OWNER: ${targetOwner ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GITHUB_TARGET_REPO: ${targetRepo ? '✅ Set' : '❌ Missing'}\n`);

  if (!appId || !privateKey || !installationId) {
    console.error('❌ Missing required GitHub App configuration. Please set all required environment variables.');
    process.exit(1);
  }

  if (!targetOwner || !targetRepo) {
    console.error('❌ Missing target repository configuration. Please set GITHUB_TARGET_OWNER and GITHUB_TARGET_REPO.');
    process.exit(1);
  }

  try {
    // Create GitHub App authentication
    console.log('🔐 Creating GitHub App authentication...');
    const auth = createAppAuth({
      appId: parseInt(appId),
      privateKey: privateKey.replace(/\\n/g, '\n'),
      installationId: parseInt(installationId),
    });

    // Create Octokit instance
    console.log('🐙 Creating Octokit instance...');
    const octokit = new Octokit({
      auth,
      userAgent: 'GrantFlow/1.0.0',
    });

    // Test authentication by getting app info
    console.log('🔍 Testing app authentication...');
    const { data: app } = await octokit.rest.apps.getAuthenticated();
    // @ts-ignore - GitHub API types can be inconsistent
    console.log(`✅ Successfully authenticated as app: "${app.name || 'Unknown'}" (ID: ${app.id})`);

    // Test installation access
    console.log('🔍 Testing installation access...');
    const { data: installation } = await octokit.rest.apps.getInstallation({
      installation_id: parseInt(installationId),
    });
    // Handle both user and organization account types
    const accountName = (installation.account as any)?.login || 
                       (installation.account as any)?.name || 
                       'Unknown';
    console.log(`✅ Installation found for: ${accountName}`);

    // Test repository access
    console.log('🔍 Testing repository access...');
    const { data: repo } = await octokit.rest.repos.get({
      owner: targetOwner,
      repo: targetRepo,
    });
    console.log(`✅ Repository access confirmed: ${repo.full_name}`);
    console.log(`   Default branch: ${repo.default_branch}`);
    console.log(`   Permissions: ${repo.permissions?.push ? 'Write' : 'Read'} access`);

    // Test permissions
    console.log('🔍 Testing specific permissions...');
    try {
      await octokit.rest.repos.getContent({
        owner: targetOwner,
        repo: targetRepo,
        path: 'README.md',
      });
      console.log('✅ Contents permission: OK');
    } catch (error: any) {
      if (error.status === 404) {
        console.log('✅ Contents permission: OK (README.md not found, but permission exists)');
      } else {
        console.log('⚠️  Contents permission: Limited or error');
      }
    }

    console.log('\n🎉 GitHub App configuration is working correctly!');
    console.log('\nNext steps:');
    console.log('1. Start your development server: pnpm dev');
    console.log('2. Navigate to /dashboard/submissions/new');
    console.log('3. Submit a test grant proposal');
    console.log('4. Check that a PR is created in your target repository');

  } catch (error: any) {
    console.error('\n❌ GitHub App verification failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.status === 401) {
      console.error('   This usually means:');
      console.error('   - Invalid App ID or private key');
      console.error('   - App is not installed on the target repository');
    } else if (error.status === 404) {
      console.error('   This usually means:');
      console.error('   - Repository does not exist');
      console.error('   - App does not have access to the repository');
      console.error('   - Installation ID is incorrect');
    }
    
    process.exit(1);
  }
}

verifyGitHubApp().catch(console.error); 