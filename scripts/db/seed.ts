import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { hashPassword } from '@/lib/auth/session'
import type { NewMessage } from '../../src/lib/db/schema'
import {
  discussions,
  groupMemberships,
  groups,
  messages,
  milestones,
  notifications,
  payouts,
  reviews,
  submissions,
  users,
} from '../../src/lib/db/schema'

config()

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

// Multisig configuration from environment or defaults
// NOTE: These are test values for development. In production, the bounty-first
// setup flow will discover the actual curator and multisig from the chain.
// Paseo Bounty #31 was used as reference for realistic structure.
const PARENT_BOUNTY_ID = Number(process.env.PARENT_BOUNTY_ID ?? '31') // Paseo bounty #31
const CURATOR_PROXY_ADDRESS =
  process.env.CURATOR_PROXY_ADDRESS ??
  '15jgfpfSvcEF7FXd77LZ8eBh4MVeSfK5DbWJ6mQsonwvi7ZY' // Curator (Pure Proxy) for bounty #31
const MULTISIG_ADDRESS =
  process.env.MULTISIG_ADDRESS ??
  '16UkJk6ZuA6CdmT9YiyjnpNpgRUVh9fMGtkfmi8HCFSe6aqM' // Multisig controlling the curator
const SIGNATORY_1_ADDRESS =
  process.env.SIGNATORY_1_ADDRESS ??
  '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' // Test signatory 1 (dev purposes)
const SIGNATORY_2_ADDRESS =
  process.env.SIGNATORY_2_ADDRESS ??
  '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y' // Test signatory 2 (dev purposes)

async function seed() {
  console.log('🌱 Starting database seeding for committee testing...')

  // ============================================================================
  // USERS - Only reviewers (committee members)
  // ============================================================================

  console.log('Creating reviewer users...')

  const reviewerPassword = await hashPassword('reviewer123')

  // Reviewer 1 - Alex Chen (Signatory 1)
  const [reviewer1] = await db
    .insert(users)
    .values({
      email: 'reviewer1@test.com',
      passwordHash: reviewerPassword,
      name: 'Alex Chen',
      githubId: 'alex-reviewer',
      primaryRole: 'committee',
      walletAddress: SIGNATORY_1_ADDRESS,
    })
    .returning()

  // Reviewer 2 - Maria Rodriguez (Signatory 2)
  const [reviewer2] = await db
    .insert(users)
    .values({
      email: 'reviewer2@test.com',
      passwordHash: reviewerPassword,
      name: 'Maria Rodriguez',
      githubId: 'maria-reviewer',
      primaryRole: 'committee',
      walletAddress: SIGNATORY_2_ADDRESS,
    })
    .returning()

  // ============================================================================
  // GROUPS - One committee only + Teams for submissions
  // ============================================================================

  console.log('Creating committee and teams...')

  // SINGLE COMMITTEE - Infrastructure Development Committee
  const [infraCommittee] = await db
    .insert(groups)
    .values({
      name: 'Infrastructure Development Committee',
      type: 'committee',
      description:
        'Supporting core infrastructure, developer tools, and protocol improvements',
      focusAreas: [
        'Infrastructure',
        'Developer Tools',
        'Protocol Development',
        'Security',
      ],
      websiteUrl: 'https://infra-dev.org',
      githubOrg: 'infra-dev-committee',
      walletAddress: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      isActive: true,
      settings: {
        votingThreshold: 2, // Need 2 votes to approve
        requiredApprovalPercentage: 66,
        stages: [
          'initial_review',
          'technical_review',
          'security_review',
          'final_approval',
        ],
        multisig: {
          network: 'paseo',
          parentBountyId: PARENT_BOUNTY_ID,
          curatorProxyAddress: CURATOR_PROXY_ADDRESS,
          multisigAddress: MULTISIG_ADDRESS,
          signatories: [
            { address: SIGNATORY_1_ADDRESS },
            { address: SIGNATORY_2_ADDRESS },
          ],
          threshold: 1, // 1-of-2 multisig (matches Paseo bounty #31)
          approvalWorkflow: 'merged',
          votingTimeoutBlocks: 50400,
          automaticExecution: true,
        },
      },
      fundingAmount: 100,
      minGrantSize: 10,
      maxGrantSize: 100,
      minMilestoneSize: 3,
      maxMilestoneSize: 30,
      requirements: JSON.stringify({
        minExperience: '2 years',
        requiredSkills: ['Rust', 'Go', 'TypeScript', 'System Design'],
        teamSize: 'min 2 people',
        deliverables: [
          'Production-ready code',
          'Comprehensive documentation',
          'Test coverage >90%',
          'Security audit',
        ],
      }),
      applicationTemplate: JSON.stringify({
        sections: [
          { title: 'Executive Summary', required: true, maxLength: 500 },
          { title: 'Technical Architecture', required: true, maxLength: 2000 },
          { title: 'Security Considerations', required: true, maxLength: 1000 },
          { title: 'Timeline & Milestones', required: true },
          { title: 'Team Experience', required: true, maxLength: 1500 },
        ],
      }),
      milestoneStructure: JSON.stringify({
        defaultMilestones: [
          {
            title: 'Architecture Design & Setup',
            percentage: 20,
            timeframe: '3 weeks',
          },
          {
            title: 'Core Development Phase 1',
            percentage: 30,
            timeframe: '6 weeks',
          },
          {
            title: 'Core Development Phase 2',
            percentage: 30,
            timeframe: '6 weeks',
          },
          {
            title: 'Testing & Security Audit',
            percentage: 15,
            timeframe: '3 weeks',
          },
          {
            title: 'Documentation & Deployment',
            percentage: 5,
            timeframe: '2 weeks',
          },
        ],
      }),
    })
    .returning()

  // TEAM GROUPS (for submissions to reference - submitters)
  const [sdkTeam] = await db
    .insert(groups)
    .values({
      name: 'NextGen SDK Team',
      type: 'team',
      description:
        'Building the most developer-friendly SDK for blockchain development',
      focusAreas: ['SDK', 'Developer Tools', 'TypeScript', 'Documentation'],
      githubOrg: 'nextgen-sdk',
      walletAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      isActive: true,
      settings: {
        votingThreshold: 1,
        requiredApprovalPercentage: 100,
        stages: ['internal_review'],
      },
    })
    .returning()

  const [zkTeam] = await db
    .insert(groups)
    .values({
      name: 'ZK Toolkit Team',
      type: 'team',
      description: 'Building zero-knowledge proof development tools',
      focusAreas: ['Zero-Knowledge', 'Privacy', 'Cryptography', 'Tools'],
      githubOrg: 'zk-toolkit',
      walletAddress: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
      isActive: true,
      settings: {
        votingThreshold: 1,
        requiredApprovalPercentage: 100,
        stages: ['internal_review'],
      },
    })
    .returning()

  const [analyticsTeam] = await db
    .insert(groups)
    .values({
      name: 'Analytics Dashboard Team',
      type: 'team',
      description: 'Building real-time blockchain analytics tools',
      focusAreas: ['Analytics', 'Monitoring', 'Dashboard', 'Real-time'],
      githubOrg: 'analytics-team',
      walletAddress: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
      isActive: true,
      settings: {
        votingThreshold: 1,
        requiredApprovalPercentage: 100,
        stages: ['internal_review'],
      },
    })
    .returning()

  const [web3Team] = await db
    .insert(groups)
    .values({
      name: 'Web3 State Library Team',
      type: 'team',
      description: 'Building React state management for Web3 applications',
      focusAreas: ['React', 'State Management', 'Web3', 'Frontend'],
      githubOrg: 'web3-state-team',
      walletAddress: '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
      isActive: true,
      settings: {
        votingThreshold: 1,
        requiredApprovalPercentage: 100,
        stages: ['internal_review'],
      },
    })
    .returning()

  const [graphqlTeam] = await db
    .insert(groups)
    .values({
      name: 'GraphQL Generator Team',
      type: 'team',
      description: 'Building GraphQL API generators for smart contracts',
      focusAreas: ['GraphQL', 'API', 'Code Generation', 'Tools'],
      githubOrg: 'graphql-gen-team',
      walletAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      isActive: true,
      settings: {
        votingThreshold: 1,
        requiredApprovalPercentage: 100,
        stages: ['internal_review'],
      },
    })
    .returning()

  // ============================================================================
  // UPDATE REVIEWERS WITH PRIMARY GROUPS
  // ============================================================================

  console.log('Updating reviewers with primary groups...')

  await db
    .update(users)
    .set({ primaryGroupId: infraCommittee.id })
    .where(eq(users.id, reviewer1.id))
  await db
    .update(users)
    .set({ primaryGroupId: infraCommittee.id })
    .where(eq(users.id, reviewer2.id))

  // ============================================================================
  // GROUP MEMBERSHIPS
  // ============================================================================

  console.log('Creating group memberships...')

  await db.insert(groupMemberships).values([
    // Infrastructure Committee - Both reviewers
    {
      groupId: infraCommittee.id,
      userId: reviewer1.id,
      role: 'admin',
      permissions: JSON.stringify([
        'manage_members',
        'approve_submissions',
        'configure_programs',
        'manage_payouts',
      ]),
      isActive: true,
    },
    {
      groupId: infraCommittee.id,
      userId: reviewer2.id,
      role: 'member',
      permissions: JSON.stringify([
        'review_submissions',
        'vote_on_submissions',
        'review_milestones',
      ]),
      isActive: true,
    },
  ])

  // ============================================================================
  // SUBMISSIONS - 2 being voted on + 3 approved (in progress)
  // ============================================================================

  console.log('Creating grant submissions...')

  // ========== IN-REVIEW SUBMISSIONS (2) - Partial votes, need voting ==========

  // IN-REVIEW 1: Has 1 approve vote from reviewer2, needs reviewer1's vote
  const [inReviewSubmission1] = await db
    .insert(submissions)
    .values({
      submitterGroupId: analyticsTeam.id,
      reviewerGroupId: infraCommittee.id,
      submitterId: reviewer1.id, // Using reviewer as placeholder submitter
      title: 'Real-time Blockchain Analytics Dashboard',
      description:
        'A real-time analytics and monitoring dashboard for blockchain networks with customizable alerts and performance metrics.',
      executiveSummary:
        'Provide developers with instant insights into blockchain performance, helping identify bottlenecks and optimize applications.',
      postGrantPlan:
        'Add support for more blockchain networks and build premium features.',
      labels: JSON.stringify([
        'Analytics',
        'Monitoring',
        'Dashboard',
        'Real-time',
      ]),
      githubRepoUrl: 'https://github.com/analytics-team/dashboard',
      walletAddress: analyticsTeam.walletAddress,
      status: 'in-review',
      totalAmount: 50,
      appliedAt: new Date('2024-02-12'),
      createdAt: new Date('2024-02-12'),
      updatedAt: new Date('2024-02-15'),
    })
    .returning()

  // IN-REVIEW 2: Has 1 approve vote from reviewer2, needs reviewer1's vote
  const [inReviewSubmission2] = await db
    .insert(submissions)
    .values({
      submitterGroupId: graphqlTeam.id,
      reviewerGroupId: infraCommittee.id,
      submitterId: reviewer1.id,
      title: 'GraphQL API Generator for Smart Contracts',
      description:
        'Automatically generate type-safe GraphQL APIs from smart contract ABIs with built-in caching and subscription support.',
      executiveSummary:
        'Simplify smart contract integration by automatically generating GraphQL APIs, reducing development time by 70%.',
      postGrantPlan: 'Expand to support REST APIs and WebSocket subscriptions.',
      labels: JSON.stringify(['GraphQL', 'API', 'Code Generation', 'Tools']),
      githubRepoUrl: 'https://github.com/graphql-gen-team/graphql-gen',
      walletAddress: graphqlTeam.walletAddress,
      status: 'in-review',
      totalAmount: 50,
      appliedAt: new Date('2024-01-28'),
      createdAt: new Date('2024-01-28'),
      updatedAt: new Date('2024-02-10'),
    })
    .returning()

  // ========== APPROVED SUBMISSIONS (3) - In progress, different milestone states ==========

  // APPROVED 1: Zero milestones completed, first milestone in-review with zero votes
  const [approvedSubmission1] = await db
    .insert(submissions)
    .values({
      submitterGroupId: zkTeam.id,
      reviewerGroupId: infraCommittee.id,
      submitterId: reviewer1.id,
      title: 'Zero-Knowledge Proof Development Toolkit',
      description:
        'A comprehensive toolkit for building zero-knowledge proof applications with visual circuit designers and optimization tools.',
      executiveSummary:
        'Make ZK development accessible to all developers with intuitive tools and extensive documentation.',
      postGrantPlan:
        'Build enterprise features and integrate with major ZK frameworks.',
      labels: JSON.stringify([
        'Zero-Knowledge',
        'Privacy',
        'Cryptography',
        'Tools',
      ]),
      githubRepoUrl: 'https://github.com/zk-toolkit/core',
      walletAddress: zkTeam.walletAddress,
      status: 'approved',
      totalAmount: 100,
      appliedAt: new Date('2024-01-20'),
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-02-10'),
    })
    .returning()

  // APPROVED 2: One milestone completed, second milestone in-review with zero votes
  const [approvedSubmission2] = await db
    .insert(submissions)
    .values({
      submitterGroupId: web3Team.id,
      reviewerGroupId: infraCommittee.id,
      submitterId: reviewer1.id,
      title: 'Web3 State Management Library',
      description:
        'A React state management library optimized for Web3 applications with automatic wallet connection, transaction tracking, and caching.',
      executiveSummary:
        'Simplify Web3 frontend development with a powerful state management solution built specifically for blockchain applications.',
      postGrantPlan: 'Add support for Vue and Svelte frameworks.',
      labels: JSON.stringify(['React', 'State Management', 'Web3', 'Frontend']),
      githubRepoUrl: 'https://github.com/web3-state-team/web3-state',
      walletAddress: web3Team.walletAddress,
      status: 'approved',
      totalAmount: 35,
      appliedAt: new Date('2024-01-05'),
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-15'),
    })
    .returning()

  // APPROVED 3: Two milestones completed, third milestone in-review with zero votes
  const [approvedSubmission3] = await db
    .insert(submissions)
    .values({
      submitterGroupId: sdkTeam.id,
      reviewerGroupId: infraCommittee.id,
      submitterId: reviewer1.id,
      title: 'Next-Gen Developer SDK',
      description:
        'A comprehensive SDK that simplifies blockchain development with TypeScript-first APIs, built-in testing utilities, and extensive documentation.',
      executiveSummary:
        'This project aims to create the most developer-friendly SDK for blockchain development, reducing onboarding time from weeks to hours.',
      postGrantPlan:
        'Continue maintaining the SDK, add enterprise features, and grow the developer community.',
      labels: JSON.stringify([
        'SDK',
        'Developer Tools',
        'TypeScript',
        'Documentation',
      ]),
      githubRepoUrl: 'https://github.com/nextgen-sdk/sdk',
      walletAddress: sdkTeam.walletAddress,
      status: 'approved',
      totalAmount: 100,
      appliedAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    })
    .returning()

  // ============================================================================
  // DISCUSSIONS
  // ============================================================================

  console.log('Creating discussions...')

  // In-review submission discussions
  const [inReview1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: inReviewSubmission1.id,
      groupId: infraCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  const [inReview2Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: inReviewSubmission2.id,
      groupId: infraCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  // Approved submission discussions
  const [approved1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission1.id,
      groupId: infraCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  const [approved2Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission2.id,
      groupId: infraCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  const [approved3Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission3.id,
      groupId: infraCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  // ============================================================================
  // SUBMISSION REVIEWS
  // ============================================================================

  console.log('Creating submission reviews...')

  // In-review submission 1 - Has 1 vote from reviewer2, needs reviewer1's vote
  await db.insert(reviews).values([
    {
      submissionId: inReviewSubmission1.id,
      reviewerId: reviewer2.id,
      discussionId: inReview1Discussion.id,
      vote: 'approve',
      feedback:
        'Excellent analytics approach. The real-time monitoring capabilities will be valuable for the ecosystem.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-14T11:00:00Z'),
    },
  ])

  // In-review submission 2 - Has 1 vote from reviewer2, needs reviewer1's vote
  await db.insert(reviews).values([
    {
      submissionId: inReviewSubmission2.id,
      reviewerId: reviewer2.id,
      discussionId: inReview2Discussion.id,
      vote: 'approve',
      feedback:
        'Innovative approach to GraphQL generation. The type safety features are excellent.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-08T11:30:00Z'),
    },
  ])

  // Approved submission 1 - Full approval votes (both reviewers approved)
  await db.insert(reviews).values([
    {
      submissionId: approvedSubmission1.id,
      reviewerId: reviewer1.id,
      discussionId: approved1Discussion.id,
      vote: 'approve',
      feedback:
        'Excellent ZK toolkit proposal. The visual circuit designer will be groundbreaking.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-01T14:00:00Z'),
    },
    {
      submissionId: approvedSubmission1.id,
      reviewerId: reviewer2.id,
      discussionId: approved1Discussion.id,
      vote: 'approve',
      feedback:
        'Strong partnerships and clear market need. The team has the right expertise.',
      reviewType: 'final',
      weight: 2,
      isBinding: true,
      createdAt: new Date('2024-02-10T09:00:00Z'),
    },
  ])

  // Approved submission 2 - Full approval votes
  await db.insert(reviews).values([
    {
      submissionId: approvedSubmission2.id,
      reviewerId: reviewer1.id,
      discussionId: approved2Discussion.id,
      vote: 'approve',
      feedback:
        'Essential tool for Web3 frontend developers. Well-scoped project.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-10T11:00:00Z'),
    },
    {
      submissionId: approvedSubmission2.id,
      reviewerId: reviewer2.id,
      discussionId: approved2Discussion.id,
      vote: 'approve',
      feedback: 'Excellent state management solution for Web3 apps. Approved!',
      reviewType: 'final',
      weight: 2,
      isBinding: true,
      createdAt: new Date('2024-01-15T09:00:00Z'),
    },
  ])

  // Approved submission 3 - Full approval votes
  await db.insert(reviews).values([
    {
      submissionId: approvedSubmission3.id,
      reviewerId: reviewer1.id,
      discussionId: approved3Discussion.id,
      vote: 'approve',
      feedback:
        'Excellent technical approach and clear deliverables. Team has proven track record.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-17T10:00:00Z'),
    },
    {
      submissionId: approvedSubmission3.id,
      reviewerId: reviewer2.id,
      discussionId: approved3Discussion.id,
      vote: 'approve',
      feedback:
        'Strong proposal with clear community impact. Documentation plan is comprehensive.',
      reviewType: 'final',
      weight: 2,
      isBinding: true,
      createdAt: new Date('2024-01-20T09:00:00Z'),
    },
  ])

  // ============================================================================
  // MILESTONES
  // ============================================================================

  console.log('Creating milestones...')

  // APPROVED 1 (ZK Toolkit): 0 completed, 1st in-review with 0 votes
  const approved1Milestones = [
    {
      submissionId: approvedSubmission1.id,
      title: 'Visual Circuit Designer & Multi-Proof System Compiler',
      description:
        'Develop the visual circuit designer interface with support for multiple zero-knowledge proof systems including Groth16, PLONK, and STARK.',
      requirements: [
        'Interactive visual circuit designer',
        'Multi-proof system compiler (Groth16, PLONK, STARK)',
        'Circuit optimization algorithms',
        'Proof generation benchmarking',
      ],
      amount: 35,
      dueDate: new Date('2024-03-15'),
      status: 'in-review' as const,
      deliverables: [
        { description: 'Visual circuit designer' },
        { description: 'Multi-proof compiler' },
        { description: 'Optimization algorithms' },
        { description: 'Benchmarking suite' },
      ],
      githubRepoUrl: 'https://github.com/zk-toolkit/core',
      githubCommitHash: 'zk123abc456',
      codeAnalysis: JSON.stringify({
        filesChanged: 52,
        linesAdded: 4100,
        testCoverage: 91,
        components: ['Visual designer', 'Multi-proof compiler', 'Optimizer'],
      }),
      submittedAt: new Date('2024-02-26T16:20:00Z'),
      createdAt: new Date('2024-02-10T09:00:00Z'),
      updatedAt: new Date('2024-02-26T16:20:00Z'),
    },
    {
      submissionId: approvedSubmission1.id,
      title: 'Developer SDK & Framework Integrations',
      description:
        'Build developer SDKs for JavaScript, Rust, and Python with integrations for popular ZK frameworks.',
      requirements: [
        'JavaScript/TypeScript SDK',
        'Rust SDK',
        'Python SDK',
        'Circom integration',
      ],
      amount: 35,
      dueDate: new Date('2024-05-30'),
      status: 'pending' as const,
      deliverables: [
        { description: 'Multi-language SDK suite' },
        { description: 'Framework integration plugins' },
        { description: 'Comprehensive API docs' },
      ],
      githubRepoUrl: 'https://github.com/zk-toolkit/core',
      createdAt: new Date('2024-02-10T09:00:00Z'),
    },
    {
      submissionId: approvedSubmission1.id,
      title: 'Documentation & Production Release',
      description:
        'Create comprehensive documentation, tutorials, and final production release.',
      requirements: [
        'Complete documentation site',
        'Interactive tutorials',
        'Video walkthrough series',
        'Production release',
      ],
      amount: 30,
      dueDate: new Date('2024-07-30'),
      status: 'pending' as const,
      deliverables: [
        { description: 'Documentation website' },
        { description: 'Tutorial content' },
        { description: 'Production release' },
      ],
      githubRepoUrl: 'https://github.com/zk-toolkit/core',
      createdAt: new Date('2024-02-10T09:00:00Z'),
    },
  ]

  const approved1MilestoneResults = await db
    .insert(milestones)
    .values(approved1Milestones)
    .returning()

  const [approved1Milestone1, _approved1Milestone2, _approved1Milestone3] =
    approved1MilestoneResults

  // APPROVED 2 (Web3 State): 1 completed, 2nd in-review with 0 votes
  const approved2Milestones = [
    {
      submissionId: approvedSubmission2.id,
      title: 'Core State Management Implementation',
      description:
        'Implement core state management hooks for wallet connection, transaction tracking, and blockchain state.',
      requirements: [
        'Wallet connection hooks',
        'Transaction state management',
        'Blockchain data caching',
        'React 18+ compatibility',
      ],
      amount: 12,
      dueDate: new Date('2024-02-20'),
      status: 'completed' as const,
      deliverables: [
        { description: 'Core hooks implementation' },
        { description: 'Transaction tracking system' },
        { description: 'Caching layer' },
        { description: 'Unit tests' },
      ],
      githubRepoUrl: 'https://github.com/web3-state-team/web3-state',
      githubCommitHash: 'web3abc123',
      codeAnalysis: JSON.stringify({
        filesChanged: 18,
        linesAdded: 950,
        testCoverage: 88,
        components: ['Wallet hooks', 'Transaction manager', 'Cache system'],
      }),
      submittedAt: new Date('2024-02-18T10:00:00Z'),
      reviewedAt: new Date('2024-02-22T14:30:00Z'),
      createdAt: new Date('2024-01-15T09:00:00Z'),
      updatedAt: new Date('2024-02-22T14:30:00Z'),
    },
    {
      submissionId: approvedSubmission2.id,
      title: 'Advanced Features & Multi-Chain Support',
      description:
        'Implement advanced features including multi-chain support, optimistic updates, and advanced caching strategies.',
      requirements: [
        'Multi-chain wallet connection',
        'Optimistic UI updates',
        'Advanced caching strategies',
        'Error handling and recovery',
      ],
      amount: 13,
      dueDate: new Date('2024-03-25'),
      status: 'in-review' as const,
      deliverables: [
        { description: 'Multi-chain support' },
        { description: 'Optimistic updates' },
        { description: 'Advanced caching' },
        { description: 'Error handling' },
      ],
      githubRepoUrl: 'https://github.com/web3-state-team/web3-state',
      githubCommitHash: 'web3def456',
      codeAnalysis: JSON.stringify({
        filesChanged: 24,
        linesAdded: 1200,
        testCoverage: 85,
        components: ['Multi-chain', 'Optimistic updates', 'Caching'],
      }),
      submittedAt: new Date('2024-03-20T10:00:00Z'),
      createdAt: new Date('2024-01-15T09:00:00Z'),
      updatedAt: new Date('2024-03-20T10:00:00Z'),
    },
    {
      submissionId: approvedSubmission2.id,
      title: 'Production Release & Package Publishing',
      description:
        'Final production release with npm package publishing and community launch.',
      requirements: [
        'Production build',
        'npm package',
        'Release documentation',
        'Community announcement',
      ],
      amount: 10,
      dueDate: new Date('2024-04-15'),
      status: 'pending' as const,
      deliverables: [
        { description: 'Production build' },
        { description: 'npm package published' },
        { description: 'Release notes' },
      ],
      githubRepoUrl: 'https://github.com/web3-state-team/web3-state',
      createdAt: new Date('2024-01-15T09:00:00Z'),
    },
  ]

  const approved2MilestoneResults = await db
    .insert(milestones)
    .values(approved2Milestones)
    .returning()

  const [approved2Milestone1, approved2Milestone2, _approved2Milestone3] =
    approved2MilestoneResults

  // APPROVED 3 (Next-Gen SDK): 2 completed, 3rd in-review with 0 votes
  const approved3Milestones = [
    {
      submissionId: approvedSubmission3.id,
      title: 'Architecture Design & Setup',
      description:
        'Complete system architecture design, development environment setup, and initial project structure.',
      requirements: [
        'Architecture documentation',
        'Development environment',
        'Project scaffolding',
        'CI/CD pipeline',
      ],
      amount: 20,
      dueDate: new Date('2024-02-15'),
      status: 'completed' as const,
      deliverables: [
        { description: 'System architecture document' },
        { description: 'Development setup guide' },
        { description: 'Initial codebase' },
        { description: 'CI/CD configuration' },
      ],
      githubRepoUrl: 'https://github.com/nextgen-sdk/sdk',
      githubCommitHash: 'sdk123abc',
      codeAnalysis: JSON.stringify({
        filesChanged: 25,
        linesAdded: 1250,
        testCoverage: 85,
        components: ['Core architecture', 'Build system', 'Testing framework'],
      }),
      submittedAt: new Date('2024-02-10T10:00:00Z'),
      reviewedAt: new Date('2024-02-12T14:30:00Z'),
      createdAt: new Date('2024-01-20T09:00:00Z'),
      updatedAt: new Date('2024-02-12T14:30:00Z'),
    },
    {
      submissionId: approvedSubmission3.id,
      title: 'Core SDK Development',
      description:
        'Implement core SDK functionality including API wrappers, utilities, and developer tools.',
      requirements: [
        'Core API implementation',
        'Utility functions',
        'Developer tools',
        'Initial testing',
      ],
      amount: 30,
      dueDate: new Date('2024-03-15'),
      status: 'completed' as const,
      deliverables: [
        { description: 'Core SDK modules' },
        { description: 'API wrappers' },
        { description: 'Utility libraries' },
        { description: 'Test suite' },
      ],
      githubRepoUrl: 'https://github.com/nextgen-sdk/sdk',
      githubCommitHash: 'sdk456def',
      codeAnalysis: JSON.stringify({
        filesChanged: 42,
        linesAdded: 2800,
        testCoverage: 88,
        components: [
          'Core API',
          'Utilities',
          'Developer tools',
          'Test framework',
        ],
      }),
      submittedAt: new Date('2024-03-10T10:00:00Z'),
      reviewedAt: new Date('2024-03-12T14:30:00Z'),
      createdAt: new Date('2024-01-20T09:00:00Z'),
      updatedAt: new Date('2024-03-12T14:30:00Z'),
    },
    {
      submissionId: approvedSubmission3.id,
      title: 'Testing & Documentation',
      description:
        'Comprehensive testing coverage and detailed documentation with examples.',
      requirements: [
        'Test coverage >90%',
        'API documentation',
        'Usage examples',
        'Tutorial guides',
      ],
      amount: 25,
      dueDate: new Date('2024-04-30'),
      status: 'in-review' as const,
      deliverables: [
        { description: 'Test suite' },
        { description: 'API documentation' },
        { description: 'Example projects' },
        { description: 'Tutorial content' },
      ],
      githubRepoUrl: 'https://github.com/nextgen-sdk/sdk',
      githubCommitHash: 'sdk789ghi',
      codeAnalysis: JSON.stringify({
        filesChanged: 35,
        linesAdded: 2100,
        testCoverage: 92,
        components: ['Test suite', 'Documentation', 'Examples', 'Tutorials'],
      }),
      submittedAt: new Date('2024-04-25T10:00:00Z'),
      createdAt: new Date('2024-01-20T09:00:00Z'),
      updatedAt: new Date('2024-04-25T10:00:00Z'),
    },
    {
      submissionId: approvedSubmission3.id,
      title: 'Production Release',
      description:
        'Final production release with package publishing and community announcement.',
      requirements: [
        'Production build',
        'Package publishing',
        'Release announcement',
        'Community support',
      ],
      amount: 25,
      dueDate: new Date('2024-05-15'),
      status: 'pending' as const,
      deliverables: [
        { description: 'Production release' },
        { description: 'npm package' },
        { description: 'Release notes' },
      ],
      githubRepoUrl: 'https://github.com/nextgen-sdk/sdk',
      createdAt: new Date('2024-01-20T09:00:00Z'),
    },
  ]

  const approved3MilestoneResults = await db
    .insert(milestones)
    .values(approved3Milestones)
    .returning()

  const [
    approved3Milestone1,
    approved3Milestone2,
    approved3Milestone3,
    _approved3Milestone4,
  ] = approved3MilestoneResults

  // ============================================================================
  // MILESTONE DISCUSSIONS
  // ============================================================================

  console.log('Creating milestone discussions...')

  // Approved 1 - Milestone 1 discussion (in-review, 0 votes)
  const [approved1Milestone1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission1.id,
      milestoneId: approved1Milestone1.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  // Approved 2 - Milestone 1 discussion (completed)
  const [approved2Milestone1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission2.id,
      milestoneId: approved2Milestone1.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  // Approved 2 - Milestone 2 discussion (in-review, 0 votes)
  const [approved2Milestone2Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission2.id,
      milestoneId: approved2Milestone2.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  // Approved 3 - Milestone 1 discussion (completed)
  const [approved3Milestone1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission3.id,
      milestoneId: approved3Milestone1.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  // Approved 3 - Milestone 2 discussion (completed)
  const [approved3Milestone2Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission3.id,
      milestoneId: approved3Milestone2.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  // Approved 3 - Milestone 3 discussion (in-review, 0 votes)
  const [approved3Milestone3Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission3.id,
      milestoneId: approved3Milestone3.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  // ============================================================================
  // MILESTONE REVIEWS - Only for completed milestones
  // ============================================================================

  console.log('Creating milestone reviews for completed milestones...')

  // Approved 2 - Milestone 1 (completed) - Both reviewers approved
  await db.insert(reviews).values([
    {
      submissionId: approvedSubmission2.id,
      milestoneId: approved2Milestone1.id,
      reviewerId: reviewer1.id,
      discussionId: approved2Milestone1Discussion.id,
      vote: 'approve',
      feedback:
        'Excellent work on the core state management hooks. The caching layer is impressive.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-20T15:30:00Z'),
    },
    {
      submissionId: approvedSubmission2.id,
      milestoneId: approved2Milestone1.id,
      reviewerId: reviewer2.id,
      discussionId: approved2Milestone1Discussion.id,
      vote: 'approve',
      feedback:
        'Great start! The React 18+ compatibility is well handled. Approved!',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-22T09:00:00Z'),
    },
  ])

  // Approved 3 - Milestone 1 (completed) - Both reviewers approved
  await db.insert(reviews).values([
    {
      submissionId: approvedSubmission3.id,
      milestoneId: approved3Milestone1.id,
      reviewerId: reviewer1.id,
      discussionId: approved3Milestone1Discussion.id,
      vote: 'approve',
      feedback:
        'Architecture is well-designed and documentation is comprehensive. Excellent foundation for the project.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-11T15:30:00Z'),
    },
    {
      submissionId: approvedSubmission3.id,
      milestoneId: approved3Milestone1.id,
      reviewerId: reviewer2.id,
      discussionId: approved3Milestone1Discussion.id,
      vote: 'approve',
      feedback:
        'Great start! The CI/CD setup will help maintain code quality throughout development.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-12T09:00:00Z'),
    },
  ])

  // Approved 3 - Milestone 2 (completed) - Both reviewers approved
  await db.insert(reviews).values([
    {
      submissionId: approvedSubmission3.id,
      milestoneId: approved3Milestone2.id,
      reviewerId: reviewer1.id,
      discussionId: approved3Milestone2Discussion.id,
      vote: 'approve',
      feedback:
        'Excellent core SDK implementation! The API wrappers are well-designed and the code quality is high.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-03-11T10:00:00Z'),
    },
    {
      submissionId: approvedSubmission3.id,
      milestoneId: approved3Milestone2.id,
      reviewerId: reviewer2.id,
      discussionId: approved3Milestone2Discussion.id,
      vote: 'approve',
      feedback:
        'The utility libraries are comprehensive and the test suite provides good coverage. Approved!',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-03-12T14:30:00Z'),
    },
  ])

  // NOTE: No reviews for in-review milestones (approved1Milestone1, approved2Milestone2, approved3Milestone3)
  // This is intentional - they are awaiting reviews from committee members

  // ============================================================================
  // MESSAGES
  // ============================================================================

  console.log('Creating messages...')

  await db.insert(messages).values([
    // In-review submission 1 messages
    {
      discussionId: inReview1Discussion.id,
      authorId: reviewer2.id,
      content:
        'The analytics approach looks solid. The real-time monitoring capabilities will be valuable for the ecosystem.',
      messageType: 'comment',
      createdAt: new Date('2024-02-14T11:00:00Z'),
    },

    // In-review submission 2 messages
    {
      discussionId: inReview2Discussion.id,
      authorId: reviewer2.id,
      content:
        'Innovative approach to GraphQL generation. The type safety features are excellent.',
      messageType: 'comment',
      createdAt: new Date('2024-02-08T11:30:00Z'),
    },

    // Approved submission 1 messages
    {
      discussionId: approved1Discussion.id,
      authorId: reviewer1.id,
      content:
        'The ZK toolkit addresses a real pain point in the ecosystem. The visual circuit designer could be groundbreaking.',
      messageType: 'comment',
      createdAt: new Date('2024-01-25T14:00:00Z'),
    },
    {
      discussionId: approved1Discussion.id,
      authorId: reviewer2.id,
      content:
        'Submission approved! Excellent proposal with strong partnerships.',
      messageType: 'status_change',
      metadata: JSON.stringify({
        newStatus: 'approved',
        oldStatus: 'in-review',
      }),
      createdAt: new Date('2024-02-10T09:00:00Z'),
    },

    // Approved submission 1 - Milestone 1 messages (in-review)
    {
      discussionId: approved1Milestone1Discussion.id,
      authorId: reviewer1.id,
      content:
        'Milestone submitted! The visual circuit designer supports drag-and-drop circuit creation with real-time compilation.',
      messageType: 'comment',
      createdAt: new Date('2024-02-26T16:20:00Z'),
    },

    // Approved submission 2 messages
    {
      discussionId: approved2Discussion.id,
      authorId: reviewer1.id,
      content:
        'Web3 state management is crucial for developer experience. Approved!',
      messageType: 'status_change',
      metadata: JSON.stringify({
        newStatus: 'approved',
        oldStatus: 'in-review',
      }),
      createdAt: new Date('2024-01-15T09:00:00Z'),
    },

    // Approved submission 2 - Milestone 1 messages (completed)
    {
      discussionId: approved2Milestone1Discussion.id,
      authorId: reviewer1.id,
      content:
        'Milestone 1 is complete! Core wallet hooks and transaction tracking are fully implemented.',
      messageType: 'comment',
      createdAt: new Date('2024-02-18T10:00:00Z'),
    },
    {
      discussionId: approved2Milestone1Discussion.id,
      authorId: reviewer1.id,
      content:
        'Excellent work on the core state management hooks. The caching layer is impressive. Approved!',
      messageType: 'comment',
      createdAt: new Date('2024-02-20T15:30:00Z'),
    },

    // Approved submission 2 - Milestone 2 messages (in-review)
    {
      discussionId: approved2Milestone2Discussion.id,
      authorId: reviewer1.id,
      content:
        'Milestone 2 submitted! Multi-chain support and optimistic updates are now implemented.',
      messageType: 'comment',
      createdAt: new Date('2024-03-20T10:00:00Z'),
    },

    // Approved submission 3 messages
    {
      discussionId: approved3Discussion.id,
      authorId: reviewer1.id,
      content:
        'This looks like a very promising project. The technical approach is sound and the team has strong experience.',
      messageType: 'comment',
      createdAt: new Date('2024-01-16T10:00:00Z'),
    },
    {
      discussionId: approved3Discussion.id,
      authorId: reviewer2.id,
      content:
        'I agree. The SDK could really help onboard new developers. The documentation plan is particularly impressive.',
      messageType: 'comment',
      createdAt: new Date('2024-01-16T14:30:00Z'),
    },
    {
      discussionId: approved3Discussion.id,
      authorId: reviewer1.id,
      content:
        'Submission approved! Looking forward to seeing the first milestone.',
      messageType: 'status_change',
      metadata: JSON.stringify({
        newStatus: 'approved',
        oldStatus: 'in-review',
      }),
      createdAt: new Date('2024-01-20T09:00:00Z'),
    },

    // Approved submission 3 - Milestone 1 messages (completed)
    {
      discussionId: approved3Milestone1Discussion.id,
      authorId: reviewer1.id,
      content:
        'Milestone 1 completed! The architecture is designed with modularity in mind and includes comprehensive testing setup.',
      messageType: 'comment',
      createdAt: new Date('2024-02-10T10:00:00Z'),
    },
    {
      discussionId: approved3Milestone1Discussion.id,
      authorId: reviewer1.id,
      content:
        'Excellent work! The architecture documentation is very thorough. Approving this milestone.',
      messageType: 'comment',
      createdAt: new Date('2024-02-11T15:30:00Z'),
    },

    // Approved submission 3 - Milestone 2 messages (completed)
    {
      discussionId: approved3Milestone2Discussion.id,
      authorId: reviewer1.id,
      content:
        'Milestone 2 complete! Core SDK development is finished with all API wrappers and utilities implemented.',
      messageType: 'comment',
      createdAt: new Date('2024-03-10T10:00:00Z'),
    },
    {
      discussionId: approved3Milestone2Discussion.id,
      authorId: reviewer1.id,
      content:
        'Excellent core SDK implementation! The API wrappers are well-designed. Approving this milestone.',
      messageType: 'comment',
      createdAt: new Date('2024-03-11T10:00:00Z'),
    },

    // Approved submission 3 - Milestone 3 messages (in-review)
    {
      discussionId: approved3Milestone3Discussion.id,
      authorId: reviewer1.id,
      content:
        'Milestone 3 submitted! Testing & documentation complete with 92% test coverage.',
      messageType: 'comment',
      createdAt: new Date('2024-04-25T10:00:00Z'),
    },
  ] as NewMessage[])

  // ============================================================================
  // PAYOUTS - For completed milestones only
  // ============================================================================

  console.log('Creating payouts for completed milestones...')

  // Approved 2 - Milestone 1 payout (completed)
  await db.insert(payouts).values({
    submissionId: approvedSubmission2.id,
    milestoneId: approved2Milestone1.id,
    groupId: infraCommittee.id,
    amount: 12,
    transactionHash:
      '0xweb3111111111111111111111111111111111111111111111111111111111111',
    blockExplorerUrl:
      'https://paseo.subscan.io/tx/0xweb3111111111111111111111111111111111111111111111111111111111111',
    status: 'completed',
    triggeredBy: reviewer1.id,
    approvedBy: reviewer1.id,
    walletFrom: infraCommittee.walletAddress,
    walletTo: web3Team.walletAddress,
    createdAt: new Date('2024-02-22T16:00:00Z'),
    processedAt: new Date('2024-02-22T16:15:00Z'),
  })

  // Approved 3 - Milestone 1 payout (completed)
  await db.insert(payouts).values({
    submissionId: approvedSubmission3.id,
    milestoneId: approved3Milestone1.id,
    groupId: infraCommittee.id,
    amount: 20,
    transactionHash:
      '0xsdk1111111111111111111111111111111111111111111111111111111111111',
    blockExplorerUrl:
      'https://paseo.subscan.io/tx/0xsdk1111111111111111111111111111111111111111111111111111111111111',
    status: 'completed',
    triggeredBy: reviewer1.id,
    approvedBy: reviewer1.id,
    walletFrom: infraCommittee.walletAddress,
    walletTo: sdkTeam.walletAddress,
    createdAt: new Date('2024-02-12T16:00:00Z'),
    processedAt: new Date('2024-02-12T16:15:00Z'),
  })

  // Approved 3 - Milestone 2 payout (completed)
  await db.insert(payouts).values({
    submissionId: approvedSubmission3.id,
    milestoneId: approved3Milestone2.id,
    groupId: infraCommittee.id,
    amount: 30,
    transactionHash:
      '0xsdk2222222222222222222222222222222222222222222222222222222222222',
    blockExplorerUrl:
      'https://paseo.subscan.io/tx/0xsdk2222222222222222222222222222222222222222222222222222222222222',
    status: 'completed',
    triggeredBy: reviewer1.id,
    approvedBy: reviewer1.id,
    walletFrom: infraCommittee.walletAddress,
    walletTo: sdkTeam.walletAddress,
    createdAt: new Date('2024-03-12T16:00:00Z'),
    processedAt: new Date('2024-03-12T16:15:00Z'),
  })

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  console.log('Creating notifications...')

  await db.insert(notifications).values([
    // Notifications for Alex Chen (reviewer1) - Submissions needing votes
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'review_requested',
      submissionId: inReviewSubmission1.id,
      discussionId: inReview1Discussion.id,
      read: false,
      content:
        'Your vote needed: "Real-time Blockchain Analytics Dashboard" - 1 of 2 votes received',
      priority: 'high',
      createdAt: new Date('2024-02-14T12:00:00Z'),
    },
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'review_requested',
      submissionId: inReviewSubmission2.id,
      discussionId: inReview2Discussion.id,
      read: false,
      content:
        'Your vote needed: "GraphQL API Generator for Smart Contracts" - 1 of 2 votes received',
      priority: 'high',
      createdAt: new Date('2024-02-08T12:00:00Z'),
    },

    // Notifications for milestones needing reviews
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: approvedSubmission1.id,
      milestoneId: approved1Milestone1.id,
      discussionId: approved1Milestone1Discussion.id,
      read: false,
      content:
        'Milestone submitted for review: "Visual Circuit Designer" - ZK Toolkit (0 of 2 votes)',
      priority: 'high',
      createdAt: new Date('2024-02-26T16:20:00Z'),
    },
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: approvedSubmission2.id,
      milestoneId: approved2Milestone2.id,
      discussionId: approved2Milestone2Discussion.id,
      read: false,
      content:
        'Milestone submitted for review: "Advanced Features & Multi-Chain Support" - Web3 State Library (0 of 2 votes)',
      priority: 'high',
      createdAt: new Date('2024-03-20T10:00:00Z'),
    },
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: approvedSubmission3.id,
      milestoneId: approved3Milestone3.id,
      discussionId: approved3Milestone3Discussion.id,
      read: false,
      content:
        'Milestone submitted for review: "Testing & Documentation" - Next-Gen Developer SDK (0 of 2 votes)',
      priority: 'high',
      createdAt: new Date('2024-04-25T10:00:00Z'),
    },

    // Same notifications for Maria (reviewer2)
    {
      userId: reviewer2.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: approvedSubmission1.id,
      milestoneId: approved1Milestone1.id,
      discussionId: approved1Milestone1Discussion.id,
      read: false,
      content:
        'Milestone submitted for review: "Visual Circuit Designer" - ZK Toolkit (0 of 2 votes)',
      priority: 'high',
      createdAt: new Date('2024-02-26T16:20:00Z'),
    },
    {
      userId: reviewer2.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: approvedSubmission2.id,
      milestoneId: approved2Milestone2.id,
      discussionId: approved2Milestone2Discussion.id,
      read: false,
      content:
        'Milestone submitted for review: "Advanced Features & Multi-Chain Support" - Web3 State Library (0 of 2 votes)',
      priority: 'high',
      createdAt: new Date('2024-03-20T10:00:00Z'),
    },
    {
      userId: reviewer2.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: approvedSubmission3.id,
      milestoneId: approved3Milestone3.id,
      discussionId: approved3Milestone3Discussion.id,
      read: false,
      content:
        'Milestone submitted for review: "Testing & Documentation" - Next-Gen Developer SDK (0 of 2 votes)',
      priority: 'high',
      createdAt: new Date('2024-04-25T10:00:00Z'),
    },
  ])

  // ============================================================================
  // SUCCESS MESSAGE
  // ============================================================================

  console.log('✅ Database seeding completed successfully!')
  console.log('\n=== SUMMARY ===')
  console.log('🏛️  Created 1 committee:')
  console.log(
    '   • Infrastructure Development Committee (active) 🔐 MULTISIG ENABLED'
  )
  console.log('\n🔐 MULTISIG CONFIGURATION:')
  console.log(`   • Multisig Address: ${MULTISIG_ADDRESS}`)
  console.log(`   • Signatory 1 (Alex Chen): ${SIGNATORY_1_ADDRESS}`)
  console.log(`   • Signatory 2 (Maria Rodriguez): ${SIGNATORY_2_ADDRESS}`)
  console.log('   • Threshold: 1 of 2 signatures required')
  console.log('   • Network: Paseo Testnet')

  console.log('\n👤 Created 2 reviewers (committee members):')
  console.log('   • Alex Chen (reviewer1@test.com) - password: reviewer123')
  console.log(
    '   • Maria Rodriguez (reviewer2@test.com) - password: reviewer123'
  )

  console.log('\n📋 Created 5 submissions:')
  console.log('   IN-REVIEW (2) - Waiting for votes:')
  console.log(
    '   • "Real-time Blockchain Analytics Dashboard" - 1/2 votes (needs Alex)'
  )
  console.log(
    '   • "GraphQL API Generator for Smart Contracts" - 1/2 votes (needs Alex)'
  )
  console.log('\n   APPROVED (3) - In progress with milestones:')
  console.log(
    '   • "ZK Toolkit" - 0 milestones completed, M1 in-review (0 votes)'
  )
  console.log(
    '   • "Web3 State Management Library" - 1 milestone completed, M2 in-review (0 votes)'
  )
  console.log(
    '   • "Next-Gen Developer SDK" - 2 milestones completed, M3 in-review (0 votes)'
  )

  console.log('\n🎯 TEST SCENARIOS FOR COMMITTEE MEMBERS:')
  console.log('📥 Submission Reviews (2):')
  console.log("   • Analytics Dashboard - needs Alex's vote")
  console.log("   • GraphQL Generator - needs Alex's vote")
  console.log("✅ Milestone Reviews (3) - All need both reviewers' votes:")
  console.log('   • ZK Toolkit M1 - Visual Circuit Designer')
  console.log('   • Web3 State M2 - Advanced Features')
  console.log('   • Next-Gen SDK M3 - Testing & Documentation')
  console.log('\n💰 Completed Payouts (3):')
  console.log('   • Web3 State M1: 12 PAS')
  console.log('   • Next-Gen SDK M1: 20 PAS')
  console.log('   • Next-Gen SDK M2: 30 PAS')
  console.log('')
}

seed()
  .catch(error => {
    console.error('❌ Seed failed:')
    console.error(error)
    process.exit(1)
  })
  .finally(() => {
    void client.end()
  })
