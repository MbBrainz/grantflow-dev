import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import type { NewMessage } from '../../src/lib/db/schema'
import {
  users,
  groups,
  groupMemberships,
  grantPrograms,
  submissions,
  discussions,
  messages,
  milestones,
  reviews,
  payouts,
  notifications,
} from '../../src/lib/db/schema'
import { config } from 'dotenv'
import postgres from 'postgres'
import { hashPassword } from '@/lib/auth/session'

config()

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

// Multisig configuration from environment or defaults
const MULTISIG_ADDRESS =
  process.env.MULTISIG_ADDRESS ??
  '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' // Default Polkadot address
const SIGNATORY_1_ADDRESS =
  process.env.SIGNATORY_1_ADDRESS ??
  '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' // Default signatory 1
const SIGNATORY_2_ADDRESS =
  process.env.SIGNATORY_2_ADDRESS ??
  '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y' // Default signatory 2

async function seed() {
  console.log('🌱 Starting comprehensive database seeding...')

  // ============================================================================
  // USERS - Create diverse users with different roles
  // ============================================================================

  console.log('Creating users...')

  // Reviewer users (committee members)
  const reviewerPassword = await hashPassword('reviewer123')
  const [reviewer1] = await db
    .insert(users)
    .values({
      email: 'reviewer1@test.com',
      passwordHash: reviewerPassword,
      name: 'Alex Chen',
      githubId: 'alex-reviewer',
      primaryRole: 'committee',
      walletAddress: SIGNATORY_1_ADDRESS, // Alex is signatory 1 for multisig
    })
    .returning()

  const [reviewer2] = await db
    .insert(users)
    .values({
      email: 'reviewer2@test.com',
      passwordHash: reviewerPassword,
      name: 'Maria Rodriguez',
      githubId: 'maria-reviewer',
      primaryRole: 'committee',
      walletAddress: SIGNATORY_2_ADDRESS, // Maria is signatory 2 for multisig
    })
    .returning()

  const [reviewer3] = await db
    .insert(users)
    .values({
      email: 'reviewer3@test.com',
      passwordHash: reviewerPassword,
      name: 'David Kim',
      githubId: 'david-reviewer',
      primaryRole: 'committee',
    })
    .returning()

  const [reviewer4] = await db
    .insert(users)
    .values({
      email: 'reviewer4@test.com',
      passwordHash: reviewerPassword,
      name: 'Elena Vasquez',
      githubId: 'elena-reviewer',
      primaryRole: 'committee',
    })
    .returning()

  // Team members (grantees)
  const teamPassword = await hashPassword('team1234')
  const [teamMember1] = await db
    .insert(users)
    .values({
      email: 'team1@test.com',
      passwordHash: teamPassword,
      name: 'John Developer',
      githubId: 'john-dev',
      walletAddress: '0x1111111111111111111111111111111111111111',
      primaryRole: 'team',
    })
    .returning()

  const [teamMember2] = await db
    .insert(users)
    .values({
      email: 'team2@test.com',
      passwordHash: teamPassword,
      name: 'Jane Builder',
      githubId: 'jane-builder',
      walletAddress: '0x2222222222222222222222222222222222222222',
      primaryRole: 'team',
    })
    .returning()

  const [teamMember3] = await db
    .insert(users)
    .values({
      email: 'team3@test.com',
      passwordHash: teamPassword,
      name: 'Bob Researcher',
      githubId: 'bob-research',
      walletAddress: '0x3333333333333333333333333333333333333333',
      primaryRole: 'team',
    })
    .returning()

  const [teamMember4] = await db
    .insert(users)
    .values({
      email: 'team4@test.com',
      passwordHash: teamPassword,
      name: 'Alice Innovator',
      githubId: 'alice-innovate',
      walletAddress: '0x4444444444444444444444444444444444444444',
      primaryRole: 'team',
    })
    .returning()

  const [teamMember5] = await db
    .insert(users)
    .values({
      email: 'team5@test.com',
      passwordHash: teamPassword,
      name: 'Charlie Protocol',
      githubId: 'charlie-protocol',
      walletAddress: '0x5555555555555555555555555555555555555555',
      primaryRole: 'team',
    })
    .returning()

  // ============================================================================
  // GROUPS - Create diverse committees and teams
  // ============================================================================

  console.log('Creating groups...')

  // COMMITTEE GROUPS (Reviewers)
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
        votingThreshold: 3,
        requiredApprovalPercentage: 66,
        stages: [
          'initial_review',
          'technical_review',
          'security_review',
          'final_approval',
        ],
        multisig: {
          multisigAddress: MULTISIG_ADDRESS,
          signatories: [SIGNATORY_1_ADDRESS, SIGNATORY_2_ADDRESS],
          threshold: 2,
          approvalWorkflow: 'merged',
          requireAllSignatories: true,
          votingTimeoutBlocks: 50400, // ~7 days on Polkadot (6s blocks)
          automaticExecution: true,
          network: 'paseo',
        },
      },
    })
    .returning()

  const [researchCommittee] = await db
    .insert(groups)
    .values({
      name: 'Research & Education Committee',
      type: 'committee',
      description:
        'Funding research, educational content, and community building initiatives',
      focusAreas: ['Research', 'Education', 'Documentation', 'Community'],
      websiteUrl: 'https://research-grants.org',
      githubOrg: 'research-committee',
      walletAddress: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      isActive: true,
      settings: {
        votingThreshold: 2,
        requiredApprovalPercentage: 75,
        stages: ['academic_review', 'community_impact', 'final_approval'],
      },
    })
    .returning()

  const [defiCommittee] = await db
    .insert(groups)
    .values({
      name: 'DeFi Innovation Committee',
      type: 'committee',
      description:
        'Supporting decentralized finance protocols, yield farming, and financial primitives',
      focusAreas: [
        'DeFi',
        'Yield Farming',
        'AMM',
        'Lending Protocols',
        'Financial Primitives',
      ],
      websiteUrl: 'https://defi-grants.com',
      githubOrg: 'defi-innovation',
      walletAddress: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      isActive: true,
      settings: {
        votingThreshold: 2,
        requiredApprovalPercentage: 80,
        stages: ['financial_review', 'risk_assessment', 'final_approval'],
      },
    })
    .returning()

  const [gamingCommittee] = await db
    .insert(groups)
    .values({
      name: 'Gaming & NFT Committee',
      type: 'committee',
      description:
        'Funding gaming projects, NFT marketplaces, and digital asset platforms',
      focusAreas: [
        'Gaming',
        'NFTs',
        'Digital Assets',
        'Marketplaces',
        'Virtual Worlds',
      ],
      websiteUrl: 'https://gaming-nft-grants.io',
      githubOrg: 'gaming-committee',
      walletAddress: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
      isActive: true,
      settings: {
        votingThreshold: 2,
        requiredApprovalPercentage: 70,
        stages: ['concept_review', 'technical_review', 'market_assessment'],
      },
    })
    .returning()

  // TEAM GROUPS (Grantees)
  const [sdkTeam] = await db
    .insert(groups)
    .values({
      name: 'NextGen SDK Team',
      type: 'team',
      description:
        'Building the most developer-friendly SDK for blockchain development',
      focusAreas: ['SDK', 'Developer Tools', 'TypeScript', 'Documentation'],
      githubOrg: 'nextgen-sdk',
      walletAddress: teamMember1.walletAddress,
      isActive: true,
      settings: {
        votingThreshold: 1,
        requiredApprovalPercentage: 100,
        stages: ['internal_review'],
      },
    })
    .returning()

  const [researchTeam] = await db
    .insert(groups)
    .values({
      name: 'Layer2 Research Group',
      type: 'team',
      description: 'Researching scalability solutions and Layer 2 technologies',
      focusAreas: ['Research', 'Layer 2', 'Scalability', 'Analysis'],
      githubOrg: 'l2-research-group',
      walletAddress: teamMember3.walletAddress,
      isActive: true,
      settings: {
        votingThreshold: 1,
        requiredApprovalPercentage: 100,
        stages: ['internal_review'],
      },
    })
    .returning()

  const [defiTeam] = await db
    .insert(groups)
    .values({
      name: 'YieldOpt Protocol Team',
      type: 'team',
      description: 'Building automated yield optimization protocols',
      focusAreas: ['DeFi', 'Yield Farming', 'Automation', 'Smart Contracts'],
      githubOrg: 'yieldopt-protocol',
      walletAddress: teamMember4.walletAddress,
      isActive: true,
      settings: {
        votingThreshold: 1,
        requiredApprovalPercentage: 100,
        stages: ['internal_review'],
      },
    })
    .returning()

  const [educationTeam] = await db
    .insert(groups)
    .values({
      name: 'Blockchain Education Collective',
      type: 'team',
      description:
        'Creating educational content and courses for blockchain development',
      focusAreas: ['Education', 'Video Course', 'Blockchain', 'Tutorial'],
      githubOrg: 'blockchain-education',
      walletAddress: teamMember2.walletAddress,
      isActive: true,
      settings: {
        votingThreshold: 1,
        requiredApprovalPercentage: 100,
        stages: ['internal_review'],
      },
    })
    .returning()

  const [gamingTeam] = await db
    .insert(groups)
    .values({
      name: 'NFT Gaming Studio',
      type: 'team',
      description: 'Developing innovative NFT-based gaming experiences',
      focusAreas: ['Gaming', 'NFT', 'Trading Cards', 'Interactive'],
      githubOrg: 'nft-gaming-studio',
      walletAddress: teamMember5.walletAddress,
      isActive: true,
      settings: {
        votingThreshold: 1,
        requiredApprovalPercentage: 100,
        stages: ['internal_review'],
      },
    })
    .returning()

  // ============================================================================
  // UPDATE USERS WITH PRIMARY GROUPS
  // ============================================================================

  console.log('Updating users with primary groups...')

  // Update reviewers with their primary committee
  await db
    .update(users)
    .set({ primaryGroupId: infraCommittee.id })
    .where(eq(users.id, reviewer1.id))
  await db
    .update(users)
    .set({ primaryGroupId: researchCommittee.id })
    .where(eq(users.id, reviewer2.id))
  await db
    .update(users)
    .set({ primaryGroupId: defiCommittee.id })
    .where(eq(users.id, reviewer3.id))
  await db
    .update(users)
    .set({ primaryGroupId: gamingCommittee.id })
    .where(eq(users.id, reviewer4.id))

  // Update team members with their primary team
  await db
    .update(users)
    .set({ primaryGroupId: sdkTeam.id })
    .where(eq(users.id, teamMember1.id))
  await db
    .update(users)
    .set({ primaryGroupId: educationTeam.id })
    .where(eq(users.id, teamMember2.id))
  await db
    .update(users)
    .set({ primaryGroupId: researchTeam.id })
    .where(eq(users.id, teamMember3.id))
  await db
    .update(users)
    .set({ primaryGroupId: defiTeam.id })
    .where(eq(users.id, teamMember4.id))
  await db
    .update(users)
    .set({ primaryGroupId: gamingTeam.id })
    .where(eq(users.id, teamMember5.id))

  // ============================================================================
  // GROUP MEMBERSHIPS - Assign members to groups
  // ============================================================================

  console.log('Creating group memberships...')

  // Committee memberships (reviewers)
  await db.insert(groupMemberships).values([
    // Infrastructure Committee
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

    // Research Committee
    {
      groupId: researchCommittee.id,
      userId: reviewer2.id,
      role: 'admin',
      permissions: JSON.stringify([
        'manage_members',
        'approve_submissions',
        'configure_programs',
      ]),
      isActive: true,
    },
    {
      groupId: researchCommittee.id,
      userId: reviewer3.id,
      role: 'member',
      permissions: JSON.stringify([
        'review_submissions',
        'vote_on_submissions',
      ]),
      isActive: true,
    },

    // DeFi Committee
    {
      groupId: defiCommittee.id,
      userId: reviewer3.id,
      role: 'admin',
      permissions: JSON.stringify([
        'manage_members',
        'approve_submissions',
        'configure_programs',
      ]),
      isActive: true,
    },
    {
      groupId: defiCommittee.id,
      userId: reviewer4.id,
      role: 'member',
      permissions: JSON.stringify([
        'review_submissions',
        'vote_on_submissions',
      ]),
      isActive: true,
    },

    // Gaming Committee
    {
      groupId: gamingCommittee.id,
      userId: reviewer4.id,
      role: 'admin',
      permissions: JSON.stringify([
        'manage_members',
        'approve_submissions',
        'configure_programs',
      ]),
      isActive: true,
    },
    {
      groupId: gamingCommittee.id,
      userId: reviewer1.id,
      role: 'member',
      permissions: JSON.stringify([
        'review_submissions',
        'vote_on_submissions',
      ]),
      isActive: true,
    },

    // sdk team
    {
      groupId: sdkTeam.id,
      userId: reviewer1.id,
      role: 'admin',
      permissions: JSON.stringify([
        'manage_members',
        'approve_submissions',
        'configure_programs',
      ]),
      isActive: true,
    },
    {
      groupId: sdkTeam.id,
      userId: reviewer2.id,
      role: 'member',
      permissions: JSON.stringify([
        'manage_members',
        'approve_submissions',
        'configure_programs',
      ]),
      isActive: true,
    },
  ])

  // Team memberships (team members)
  await db.insert(groupMemberships).values([
    // SDK Team
    {
      groupId: sdkTeam.id,
      userId: teamMember1.id,
      role: 'admin',
      permissions: JSON.stringify([
        'manage_team',
        'submit_applications',
        'manage_submissions',
      ]),
      isActive: true,
    },

    // Research Team
    {
      groupId: researchTeam.id,
      userId: teamMember3.id,
      role: 'admin',
      permissions: JSON.stringify([
        'manage_team',
        'submit_applications',
        'manage_submissions',
      ]),
      isActive: true,
    },

    // DeFi Team
    {
      groupId: defiTeam.id,
      userId: teamMember4.id,
      role: 'admin',
      permissions: JSON.stringify([
        'manage_team',
        'submit_applications',
        'manage_submissions',
      ]),
      isActive: true,
    },

    // Education Team
    {
      groupId: educationTeam.id,
      userId: teamMember2.id,
      role: 'admin',
      permissions: JSON.stringify([
        'manage_team',
        'submit_applications',
        'manage_submissions',
      ]),
      isActive: true,
    },

    // Gaming Team
    {
      groupId: gamingTeam.id,
      userId: teamMember5.id,
      role: 'admin',
      permissions: JSON.stringify([
        'manage_team',
        'submit_applications',
        'manage_submissions',
      ]),
      isActive: true,
    },
  ])

  // ============================================================================
  // GRANT PROGRAMS - Create varied programs per committee
  // ============================================================================

  console.log('Creating grant programs...')

  // Infrastructure Committee Programs
  const [infraCoreProgram] = await db
    .insert(grantPrograms)
    .values({
      groupId: infraCommittee.id,
      name: 'Core Infrastructure Development',
      description:
        'Large grants for building essential infrastructure components and developer tools',
      fundingAmount: 100000,
      minGrantSize: 50000,
      maxGrantSize: 100000,
      minMilestoneSize: 10000,
      maxMilestoneSize: 30000,
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
      isActive: true,
    })
    .returning()

  const [_infraToolsProgram] = await db
    .insert(grantPrograms)
    .values({
      groupId: infraCommittee.id,
      name: 'Developer Tools & Utilities',
      description:
        'Medium grants for developer productivity tools, libraries, and utilities',
      fundingAmount: 50000,
      minGrantSize: 10000,
      maxGrantSize: 50000,
      minMilestoneSize: 2500,
      maxMilestoneSize: 15000,
      requirements: JSON.stringify({
        minExperience: '1 year',
        requiredSkills: ['JavaScript/TypeScript', 'React', 'Node.js'],
        deliverables: [
          'Working tool/library',
          'Documentation',
          'Examples',
          'Community adoption plan',
        ],
      }),
      applicationTemplate: JSON.stringify({
        sections: [
          { title: 'Tool Overview', required: true, maxLength: 400 },
          { title: 'Developer Need Analysis', required: true, maxLength: 800 },
          { title: 'Implementation Plan', required: true, maxLength: 1000 },
          { title: 'Adoption Strategy', required: true, maxLength: 600 },
        ],
      }),
      milestoneStructure: JSON.stringify({
        defaultMilestones: [
          {
            title: 'Project Setup & Core Features',
            percentage: 40,
            timeframe: '4 weeks',
          },
          {
            title: 'Advanced Features & Polish',
            percentage: 35,
            timeframe: '3 weeks',
          },
          {
            title: 'Documentation & Examples',
            percentage: 15,
            timeframe: '2 weeks',
          },
          {
            title: 'Community Release & Support',
            percentage: 10,
            timeframe: '1 week',
          },
        ],
      }),
      isActive: true,
    })
    .returning()

  // Research Committee Programs
  const [researchAcademicProgram] = await db
    .insert(grantPrograms)
    .values({
      groupId: researchCommittee.id,
      name: 'Academic Research Grants',
      description:
        'Funding for academic research, white papers, and theoretical work',
      fundingAmount: 75000,
      minGrantSize: 25000,
      maxGrantSize: 75000,
      minMilestoneSize: 5000,
      maxMilestoneSize: 20000,
      requirements: JSON.stringify({
        minExperience: 'PhD or equivalent research experience',
        requiredSkills: [
          'Research Methodology',
          'Academic Writing',
          'Peer Review',
        ],
        deliverables: [
          'Research paper',
          'Peer review process',
          'Conference presentation',
          'Open source implementation',
        ],
      }),
      applicationTemplate: JSON.stringify({
        sections: [
          {
            title: 'Research Question & Hypothesis',
            required: true,
            maxLength: 600,
          },
          { title: 'Literature Review', required: true, maxLength: 1200 },
          { title: 'Methodology', required: true, maxLength: 1000 },
          { title: 'Expected Impact', required: true, maxLength: 500 },
          { title: 'Timeline & Deliverables', required: true },
        ],
      }),
      milestoneStructure: JSON.stringify({
        defaultMilestones: [
          {
            title: 'Research Design & Literature Review',
            percentage: 25,
            timeframe: '4 weeks',
          },
          {
            title: 'Data Collection & Analysis',
            percentage: 40,
            timeframe: '8 weeks',
          },
          {
            title: 'Paper Writing & Peer Review',
            percentage: 25,
            timeframe: '4 weeks',
          },
          {
            title: 'Publication & Presentation',
            percentage: 10,
            timeframe: '2 weeks',
          },
        ],
      }),
      isActive: true,
    })
    .returning()

  const [educationProgram] = await db
    .insert(grantPrograms)
    .values({
      groupId: researchCommittee.id,
      name: 'Educational Content Creation',
      description:
        'Creating tutorials, courses, and educational materials for the community',
      fundingAmount: 25000,
      minGrantSize: 5000,
      maxGrantSize: 25000,
      minMilestoneSize: 1000,
      maxMilestoneSize: 8000,
      requirements: JSON.stringify({
        minExperience: '6 months teaching/content creation',
        requiredSkills: [
          'Content Creation',
          'Teaching',
          'Video Production',
          'Technical Writing',
        ],
        deliverables: [
          'Video content',
          'Written tutorials',
          'Interactive examples',
          'Community feedback integration',
        ],
      }),
      applicationTemplate: JSON.stringify({
        sections: [
          { title: 'Educational Goals', required: true, maxLength: 400 },
          { title: 'Content Outline', required: true, maxLength: 800 },
          { title: 'Teaching Methodology', required: true, maxLength: 600 },
          { title: 'Distribution Strategy', required: true, maxLength: 400 },
        ],
      }),
      milestoneStructure: JSON.stringify({
        defaultMilestones: [
          {
            title: 'Content Planning & Script Writing',
            percentage: 30,
            timeframe: '2 weeks',
          },
          { title: 'Content Production', percentage: 50, timeframe: '4 weeks' },
          { title: 'Review & Refinement', percentage: 15, timeframe: '1 week' },
          {
            title: 'Publication & Community Engagement',
            percentage: 5,
            timeframe: '1 week',
          },
        ],
      }),
      isActive: true,
    })
    .returning()

  // DeFi Committee Program
  const [defiProtocolProgram] = await db
    .insert(grantPrograms)
    .values({
      groupId: defiCommittee.id,
      name: 'DeFi Protocol Development',
      description:
        'Building new DeFi protocols, AMMs, and financial primitives',
      fundingAmount: 150000,
      minGrantSize: 75000,
      maxGrantSize: 150000,
      minMilestoneSize: 15000,
      maxMilestoneSize: 50000,
      requirements: JSON.stringify({
        minExperience: '2 years DeFi development',
        requiredSkills: [
          'Solidity',
          'Smart Contract Security',
          'DeFi Protocols',
          'Economic Modeling',
        ],
        deliverables: [
          'Audited smart contracts',
          'Frontend interface',
          'Economic analysis',
          'Deployment on mainnet',
        ],
      }),
      applicationTemplate: JSON.stringify({
        sections: [
          { title: 'Protocol Overview', required: true, maxLength: 600 },
          { title: 'Economic Model', required: true, maxLength: 1200 },
          { title: 'Technical Architecture', required: true, maxLength: 1500 },
          { title: 'Security Considerations', required: true, maxLength: 1000 },
          { title: 'Go-to-Market Strategy', required: true, maxLength: 800 },
        ],
      }),
      milestoneStructure: JSON.stringify({
        defaultMilestones: [
          {
            title: 'Smart Contract Development',
            percentage: 35,
            timeframe: '8 weeks',
          },
          {
            title: 'Security Audit & Testing',
            percentage: 25,
            timeframe: '4 weeks',
          },
          {
            title: 'Frontend Development',
            percentage: 25,
            timeframe: '6 weeks',
          },
          {
            title: 'Mainnet Deployment & Launch',
            percentage: 15,
            timeframe: '3 weeks',
          },
        ],
      }),
      isActive: true,
    })
    .returning()

  // Gaming Committee Program
  const [gamingPlatformProgram] = await db
    .insert(grantPrograms)
    .values({
      groupId: gamingCommittee.id,
      name: 'Gaming Platform Development',
      description:
        'Building gaming platforms, NFT marketplaces, and virtual world infrastructure',
      fundingAmount: 80000,
      minGrantSize: 20000,
      maxGrantSize: 80000,
      minMilestoneSize: 5000,
      maxMilestoneSize: 25000,
      requirements: JSON.stringify({
        minExperience: '1.5 years game development',
        requiredSkills: [
          'Game Development',
          'NFT Standards',
          'Frontend Development',
          'User Experience',
        ],
        deliverables: [
          'Playable game/platform',
          'NFT integration',
          'User documentation',
          'Community features',
        ],
      }),
      applicationTemplate: JSON.stringify({
        sections: [
          { title: 'Game/Platform Concept', required: true, maxLength: 500 },
          {
            title: 'Technical Implementation',
            required: true,
            maxLength: 1000,
          },
          { title: 'NFT Integration Strategy', required: true, maxLength: 800 },
          { title: 'User Experience Design', required: true, maxLength: 600 },
          { title: 'Community Building Plan', required: true, maxLength: 500 },
        ],
      }),
      milestoneStructure: JSON.stringify({
        defaultMilestones: [
          {
            title: 'Core Game Mechanics',
            percentage: 40,
            timeframe: '6 weeks',
          },
          {
            title: 'NFT Integration & Smart Contracts',
            percentage: 30,
            timeframe: '4 weeks',
          },
          { title: 'UI/UX Development', percentage: 20, timeframe: '3 weeks' },
          {
            title: 'Testing & Community Launch',
            percentage: 10,
            timeframe: '2 weeks',
          },
        ],
      }),
      isActive: true,
    })
    .returning()

  // ============================================================================
  // SUBMISSIONS - Create submissions in various states
  // ============================================================================

  console.log('Creating grant submissions...')

  // APPROVED SUBMISSION with completed milestones
  const [approvedSubmission] = await db
    .insert(submissions)
    .values({
      grantProgramId: infraCoreProgram.id,
      submitterGroupId: sdkTeam.id,
      reviewerGroupId: infraCommittee.id,
      submitterId: teamMember1.id,
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
      githubRepoUrl: 'https://github.com/MbBrainz/grantflow-dev',
      walletAddress: teamMember1.walletAddress,
      status: 'approved',
      totalAmount: 100000,
      appliedAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    })
    .returning()

  // UNDER REVIEW SUBMISSION
  const [underReviewSubmission] = await db
    .insert(submissions)
    .values({
      grantProgramId: researchAcademicProgram.id,
      submitterGroupId: researchTeam.id,
      reviewerGroupId: researchCommittee.id,
      submitterId: teamMember3.id,
      title: 'Scalability Research: Layer 2 Solutions Comparative Analysis',
      description:
        'Comprehensive research comparing different Layer 2 scaling solutions, analyzing performance, security, and adoption metrics.',
      executiveSummary:
        'This research will provide the community with data-driven insights into the most effective Layer 2 solutions for different use cases.',
      postGrantPlan:
        'Publish findings in peer-reviewed journals and present at major blockchain conferences.',
      labels: JSON.stringify([
        'Research',
        'Layer 2',
        'Scalability',
        'Analysis',
      ]),
      githubRepoUrl: 'https://github.com/l2-research-group/analysis',
      walletAddress: teamMember3.walletAddress,
      status: 'in-review',
      totalAmount: 75000,
      appliedAt: new Date('2024-01-25'),
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-30'),
    })
    .returning()

  // PENDING SUBMISSION (just submitted)
  const [pendingSubmission] = await db
    .insert(submissions)
    .values({
      grantProgramId: defiProtocolProgram.id,
      submitterGroupId: defiTeam.id,
      reviewerGroupId: defiCommittee.id,
      submitterId: teamMember4.id,
      title: 'Decentralized Yield Optimization Protocol',
      description:
        'An automated yield farming protocol that optimizes returns across multiple DeFi platforms while minimizing gas costs and impermanent loss.',
      executiveSummary:
        'This protocol will democratize advanced yield farming strategies, making them accessible to all users regardless of portfolio size.',
      postGrantPlan:
        'Expand to more DeFi protocols, add advanced analytics, and implement DAO governance.',
      labels: JSON.stringify([
        'DeFi',
        'Yield Farming',
        'Automation',
        'Smart Contracts',
      ]),
      githubRepoUrl: 'https://github.com/yieldopt-protocol/core',
      walletAddress: teamMember4.walletAddress,
      status: 'pending',
      totalAmount: 150000,
      appliedAt: new Date('2024-02-05'),
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-05'),
    })
    .returning()

  // REJECTED SUBMISSION
  const [rejectedSubmission] = await db
    .insert(submissions)
    .values({
      grantProgramId: gamingPlatformProgram.id,
      submitterGroupId: gamingTeam.id,
      reviewerGroupId: gamingCommittee.id,
      submitterId: teamMember5.id,
      title: 'Basic NFT Trading Card Game',
      description:
        'A simple trading card game using NFTs with basic battle mechanics.',
      executiveSummary:
        'Create a trading card game where players can collect, trade, and battle with NFT cards.',
      postGrantPlan: 'Add more cards and game modes.',
      labels: JSON.stringify(['Gaming', 'NFT', 'Trading Cards']),
      githubRepoUrl: 'https://github.com/nft-gaming-studio/trading-cards',
      walletAddress: teamMember5.walletAddress,
      status: 'rejected',
      totalAmount: 80000,
      appliedAt: new Date('2024-01-10'),
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-22'),
    })
    .returning()

  // ANOTHER PENDING SUBMISSION for different committee
  const [pendingEducationSubmission] = await db
    .insert(submissions)
    .values({
      grantProgramId: educationProgram.id,
      submitterGroupId: educationTeam.id,
      reviewerGroupId: researchCommittee.id,
      submitterId: teamMember2.id,
      title: 'Interactive Blockchain Development Course',
      description:
        'A comprehensive video course series teaching blockchain development from basics to advanced topics with hands-on coding exercises.',
      executiveSummary:
        'Bridge the knowledge gap in blockchain development education with practical, hands-on learning materials.',
      postGrantPlan: 'Create advanced courses and build a learning platform.',
      labels: JSON.stringify([
        'Education',
        'Video Course',
        'Blockchain',
        'Tutorial',
      ]),
      githubRepoUrl: 'https://github.com/blockchain-education/course',
      walletAddress: teamMember2.walletAddress,
      status: 'pending',
      totalAmount: 25000,
      appliedAt: new Date('2024-02-01'),
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    })
    .returning()

  // ============================================================================
  // ALEX CHEN SCENARIOS - Infrastructure Committee submissions requiring action
  // ============================================================================

  console.log('Creating scenarios for Alex Chen (Infrastructure Committee)...')

  // SCENARIO 1: NEW PENDING SUBMISSION - Requires Alex to start review process
  const [infraPendingSubmission1] = await db
    .insert(submissions)
    .values({
      grantProgramId: infraCoreProgram.id,
      submitterGroupId: sdkTeam.id,
      reviewerGroupId: infraCommittee.id,
      submitterId: teamMember1.id,
      title: 'Advanced Blockchain Testing Framework',
      description:
        'A comprehensive testing framework for smart contracts with fuzzing, property-based testing, and gas optimization analysis.',
      executiveSummary:
        'Build the most robust testing infrastructure for blockchain development, reducing bugs and security vulnerabilities.',
      postGrantPlan:
        'Integrate with major development frameworks and build enterprise support.',
      labels: JSON.stringify([
        'Testing',
        'Smart Contracts',
        'Security',
        'Developer Tools',
      ]),
      githubRepoUrl: 'https://github.com/nextgen-sdk/testing-framework',
      walletAddress: teamMember1.walletAddress,
      status: 'pending',
      totalAmount: 100000,
      appliedAt: new Date('2024-02-10'),
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10'),
    })
    .returning()

  // SCENARIO 2: PENDING SUBMISSION - Developer Tools Program
  const [infraPendingSubmission2] = await db
    .insert(submissions)
    .values({
      grantProgramId: _infraToolsProgram.id,
      submitterGroupId: researchTeam.id,
      reviewerGroupId: infraCommittee.id,
      submitterId: teamMember3.id,
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
      githubRepoUrl: 'https://github.com/l2-research-group/analytics-dash',
      walletAddress: teamMember3.walletAddress,
      status: 'pending',
      totalAmount: 50000,
      appliedAt: new Date('2024-02-12'),
      createdAt: new Date('2024-02-12'),
      updatedAt: new Date('2024-02-12'),
    })
    .returning()

  // SCENARIO 3: IN-REVIEW SUBMISSION - Partial votes, needs Alex's vote
  const [infraInReviewSubmission] = await db
    .insert(submissions)
    .values({
      grantProgramId: _infraToolsProgram.id,
      submitterGroupId: defiTeam.id,
      reviewerGroupId: infraCommittee.id,
      submitterId: teamMember4.id,
      title: 'GraphQL API Generator for Smart Contracts',
      description:
        'Automatically generate type-safe GraphQL APIs from smart contract ABIs with built-in caching and subscription support.',
      executiveSummary:
        'Simplify smart contract integration by automatically generating GraphQL APIs, reducing development time by 70%.',
      postGrantPlan: 'Expand to support REST APIs and WebSocket subscriptions.',
      labels: JSON.stringify(['GraphQL', 'API', 'Code Generation', 'Tools']),
      githubRepoUrl: 'https://github.com/yieldopt-protocol/graphql-gen',
      walletAddress: teamMember4.walletAddress,
      status: 'in-review',
      totalAmount: 50000,
      appliedAt: new Date('2024-01-28'),
      createdAt: new Date('2024-01-28'),
      updatedAt: new Date('2024-02-05'),
    })
    .returning()

  // SCENARIO 4: IN-REVIEW SUBMISSION - Near approval threshold
  const [infraInReviewSubmission2] = await db
    .insert(submissions)
    .values({
      grantProgramId: infraCoreProgram.id,
      submitterGroupId: educationTeam.id,
      reviewerGroupId: infraCommittee.id,
      submitterId: teamMember2.id,
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
      githubRepoUrl: 'https://github.com/blockchain-education/zk-toolkit',
      walletAddress: teamMember2.walletAddress,
      status: 'in-review',
      totalAmount: 100000,
      appliedAt: new Date('2024-01-20'),
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-02-08'),
    })
    .returning()

  // SCENARIO 5: APPROVED SUBMISSION with milestones needing review
  const [infraApprovedWithMilestones] = await db
    .insert(submissions)
    .values({
      grantProgramId: _infraToolsProgram.id,
      submitterGroupId: gamingTeam.id,
      reviewerGroupId: infraCommittee.id,
      submitterId: teamMember5.id,
      title: 'Web3 State Management Library',
      description:
        'A React state management library optimized for Web3 applications with automatic wallet connection, transaction tracking, and caching.',
      executiveSummary:
        'Simplify Web3 frontend development with a powerful state management solution built specifically for blockchain applications.',
      postGrantPlan: 'Add support for Vue and Svelte frameworks.',
      labels: JSON.stringify(['React', 'State Management', 'Web3', 'Frontend']),
      githubRepoUrl: 'https://github.com/nft-gaming-studio/web3-state',
      walletAddress: teamMember5.walletAddress,
      status: 'approved',
      totalAmount: 3500,
      appliedAt: new Date('2024-01-05'),
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-15'),
    })
    .returning()

  // ============================================================================
  // DISCUSSIONS - Create discussion threads for submissions
  // ============================================================================

  console.log('Creating discussions...')

  const [approvedDiscussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission.id,
      groupId: infraCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  const [reviewDiscussion] = await db
    .insert(discussions)
    .values({
      submissionId: underReviewSubmission.id,
      groupId: researchCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  const [_pendingDiscussion] = await db
    .insert(discussions)
    .values({
      submissionId: pendingSubmission.id,
      groupId: defiCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  const [rejectedDiscussion] = await db
    .insert(discussions)
    .values({
      submissionId: rejectedSubmission.id,
      groupId: gamingCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  const [_educationDiscussion] = await db
    .insert(discussions)
    .values({
      submissionId: pendingEducationSubmission.id,
      groupId: researchCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  // Discussions for Alex Chen's Infrastructure Committee scenarios
  const [infraPending1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraPendingSubmission1.id,
      groupId: infraCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  const [infraPending2Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraPendingSubmission2.id,
      groupId: infraCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  const [infraInReviewDiscussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraInReviewSubmission.id,
      groupId: infraCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  const [infraInReview2Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraInReviewSubmission2.id,
      groupId: infraCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  const [infraApprovedDiscussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraApprovedWithMilestones.id,
      groupId: infraCommittee.id,
      type: 'submission',
      isPublic: true,
    })
    .returning()

  // ============================================================================
  // MESSAGES - Add discussion messages
  // ============================================================================

  console.log('Creating discussion messages...')

  // Messages for approved submission
  await db.insert(messages).values([
    {
      discussionId: approvedDiscussion.id,
      authorId: reviewer1.id,
      content:
        'This looks like a very promising project. The technical approach is sound and the team has strong experience.',
      messageType: 'comment',
      createdAt: new Date('2024-01-16T10:00:00Z'),
    },
    {
      discussionId: approvedDiscussion.id,
      authorId: reviewer2.id,
      content:
        'I agree. The SDK could really help onboard new developers. The documentation plan is particularly impressive.',
      messageType: 'comment',
      createdAt: new Date('2024-01-16T14:30:00Z'),
    },
    {
      discussionId: approvedDiscussion.id,
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
  ])

  // Messages for under review submission
  await db.insert(messages).values([
    {
      discussionId: reviewDiscussion.id,
      authorId: reviewer3.id,
      content:
        'The research methodology looks solid. Could you provide more details on the data collection framework?',
      messageType: 'comment',
      createdAt: new Date('2024-01-26T11:00:00Z'),
    },
    {
      discussionId: reviewDiscussion.id,
      authorId: teamMember3.id,
      content:
        "Thanks for the feedback! I'll add more details about the data collection in the updated proposal.",
      messageType: 'comment',
      createdAt: new Date('2024-01-26T15:45:00Z'),
    },
    {
      discussionId: reviewDiscussion.id,
      authorId: reviewer2.id,
      content:
        'The research scope is comprehensive. We need one more reviewer vote before approval.',
      messageType: 'comment',
      createdAt: new Date('2024-01-30T13:20:00Z'),
    },
  ])

  // Messages for rejected submission
  await db.insert(messages).values([
    {
      discussionId: rejectedDiscussion.id,
      authorId: reviewer4.id,
      content:
        'While the concept is interesting, the technical implementation plan lacks depth. The game mechanics are too basic for the requested funding amount.',
      messageType: 'comment',
      createdAt: new Date('2024-01-12T09:15:00Z'),
    },
    {
      discussionId: rejectedDiscussion.id,
      authorId: reviewer1.id,
      content:
        'I agree with the previous assessment. The proposal would benefit from more innovative gameplay mechanics and a stronger technical architecture.',
      messageType: 'comment',
      createdAt: new Date('2024-01-15T14:00:00Z'),
    },
    {
      discussionId: rejectedDiscussion.id,
      authorId: reviewer4.id,
      content:
        'Unfortunately, we cannot approve this proposal in its current form. Please consider resubmitting with a more detailed technical plan.',
      messageType: 'status_change',
      metadata: JSON.stringify({
        newStatus: 'rejected',
        oldStatus: 'in-review',
        reason: 'Insufficient technical detail and innovation',
      }),
      createdAt: new Date('2024-01-22T10:30:00Z'),
    },
  ] as NewMessage[])

  // Messages for Alex Chen's Infrastructure Committee scenarios
  await db.insert(messages).values([
    // Pending submission 1 - No messages yet, awaiting review

    // Pending submission 2 - Just submitted
    {
      discussionId: infraPending2Discussion.id,
      authorId: teamMember3.id,
      content:
        'Excited to submit our analytics dashboard proposal! We have a working prototype and strong user feedback from beta testers.',
      messageType: 'comment',
      createdAt: new Date('2024-02-12T10:00:00Z'),
    },

    // In-review submission - Partial votes, needs Alex
    {
      discussionId: infraInReviewDiscussion.id,
      authorId: reviewer2.id,
      content:
        'The GraphQL code generation approach is innovative. I like the automatic type safety features.',
      messageType: 'comment',
      createdAt: new Date('2024-02-01T11:00:00Z'),
    },
    {
      discussionId: infraInReviewDiscussion.id,
      authorId: teamMember4.id,
      content:
        "Thanks! We've also added support for subscriptions and real-time updates in the latest version.",
      messageType: 'comment',
      createdAt: new Date('2024-02-02T09:30:00Z'),
    },

    // In-review submission 2 - Near threshold
    {
      discussionId: infraInReview2Discussion.id,
      authorId: reviewer2.id,
      content:
        'The ZK toolkit addresses a real pain point in the ecosystem. The visual circuit designer could be groundbreaking.',
      messageType: 'comment',
      createdAt: new Date('2024-01-25T14:00:00Z'),
    },
    {
      discussionId: infraInReview2Discussion.id,
      authorId: teamMember2.id,
      content:
        'We have partnerships with two major ZK frameworks already committed to integrating our toolkit.',
      messageType: 'comment',
      createdAt: new Date('2024-01-28T10:00:00Z'),
    },
    {
      discussionId: infraInReview2Discussion.id,
      authorId: reviewer2.id,
      content:
        "That's impressive! Looking forward to seeing this move forward. We need more votes for approval.",
      messageType: 'comment',
      createdAt: new Date('2024-02-08T16:00:00Z'),
    },

    // Approved submission with milestones
    {
      discussionId: infraApprovedDiscussion.id,
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
  ] as NewMessage[])

  // ============================================================================
  // REVIEWS - Create reviewer reviews/votes
  // ============================================================================

  console.log('Creating reviews...')

  // Reviews for approved submission
  await db.insert(reviews).values([
    {
      submissionId: approvedSubmission.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer1.id,
      discussionId: approvedDiscussion.id,
      vote: 'approve',
      feedback:
        'Excellent technical approach and clear deliverables. Team has proven track record.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-17T10:00:00Z'),
    },
    {
      submissionId: approvedSubmission.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer2.id,
      discussionId: approvedDiscussion.id,
      vote: 'approve',
      feedback:
        'Strong proposal with clear community impact. Documentation plan is comprehensive.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-18T14:30:00Z'),
    },
    {
      submissionId: approvedSubmission.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer1.id,
      discussionId: approvedDiscussion.id,
      vote: 'approve',
      feedback: 'Final approval. All criteria met.',
      reviewType: 'final',
      weight: 2,
      isBinding: true,
      createdAt: new Date('2024-01-20T09:00:00Z'),
    },
  ])

  // Reviews for under review submission (partial votes)
  await db.insert(reviews).values([
    {
      submissionId: underReviewSubmission.id,
      groupId: researchCommittee.id,
      reviewerId: reviewer3.id,
      discussionId: reviewDiscussion.id,
      vote: 'approve',
      feedback:
        'Research methodology is sound and will provide valuable insights to the community.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-28T11:00:00Z'),
    },
  ])

  // Reviews for rejected submission
  await db.insert(reviews).values([
    {
      submissionId: rejectedSubmission.id,
      groupId: gamingCommittee.id,
      reviewerId: reviewer4.id,
      discussionId: rejectedDiscussion.id,
      vote: 'reject',
      feedback:
        'Technical implementation plan lacks sufficient depth and innovation for the requested funding amount.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-18T09:15:00Z'),
    },
    {
      submissionId: rejectedSubmission.id,
      groupId: gamingCommittee.id,
      reviewerId: reviewer1.id,
      discussionId: rejectedDiscussion.id,
      vote: 'reject',
      feedback:
        'Proposal needs more innovative gameplay mechanics and detailed technical architecture.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-20T14:00:00Z'),
    },
  ])

  // Reviews for Alex Chen's Infrastructure Committee scenarios
  await db.insert(reviews).values([
    // GraphQL API Generator - Has one approve vote from Maria, needs Alex's vote (and one more)
    {
      submissionId: infraInReviewSubmission.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer2.id,
      discussionId: infraInReviewDiscussion.id,
      vote: 'approve',
      feedback:
        'Innovative approach to GraphQL generation. The type safety features are excellent.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-05T11:30:00Z'),
    },

    // ZK Toolkit - Has two approve votes, needs Alex's final vote for approval (threshold is 3)
    {
      submissionId: infraInReviewSubmission2.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer2.id,
      discussionId: infraInReview2Discussion.id,
      vote: 'approve',
      feedback:
        'The visual circuit designer is a game changer for ZK development accessibility.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-01T14:00:00Z'),
    },
    {
      submissionId: infraInReviewSubmission2.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer3.id,
      discussionId: infraInReview2Discussion.id,
      vote: 'approve',
      feedback:
        'Strong partnerships and clear market need. The team has the right expertise.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-07T10:00:00Z'),
    },

    // Web3 State Management - Already approved, Alex gave final approval
    {
      submissionId: infraApprovedWithMilestones.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer2.id,
      discussionId: infraApprovedDiscussion.id,
      vote: 'approve',
      feedback:
        'Essential tool for Web3 frontend developers. Well-scoped project.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-10T11:00:00Z'),
    },
    {
      submissionId: infraApprovedWithMilestones.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer1.id,
      discussionId: infraApprovedDiscussion.id,
      vote: 'approve',
      feedback: 'Excellent state management solution for Web3 apps. Approved!',
      reviewType: 'final',
      weight: 2,
      isBinding: true,
      createdAt: new Date('2024-01-15T09:00:00Z'),
    },
  ])

  // ============================================================================
  // MILESTONES - Create milestones for approved submission
  // ============================================================================

  console.log('Creating milestones...')

  const [milestone1] = await db
    .insert(milestones)
    .values({
      submissionId: approvedSubmission.id,
      groupId: infraCommittee.id,
      title: 'Architecture Design & Setup',
      description:
        'Complete system architecture design, development environment setup, and initial project structure.',
      requirements: [
        'Architecture documentation',
        'Development environment',
        'Project scaffolding',
        'CI/CD pipeline',
      ],
      amount: 20000,
      dueDate: new Date('2024-02-15'),
      status: 'completed',
      deliverables: [
        { description: 'System architecture document' },
        { description: 'Development setup guide' },
        { description: 'Initial codebase' },
        { description: 'CI/CD configuration' },
      ],
      githubRepoUrl: 'https://github.com/nextgen-sdk/sdk',
      githubCommitHash: 'abc123def456',
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
    })
    .returning()

  const [milestone2] = await db
    .insert(milestones)
    .values({
      submissionId: approvedSubmission.id,
      groupId: infraCommittee.id,
      title: 'Core SDK Development',
      description:
        'Implement core SDK functionality including API wrappers, utilities, and developer tools.',
      requirements: [
        'Core API implementation',
        'Utility functions',
        'Developer tools',
        'Initial testing',
      ],
      amount: 30000,
      dueDate: new Date('2024-03-30'),
      status: 'changes-requested',
      deliverables: [
        { description: 'Core SDK modules' },
        { description: 'API wrappers' },
        { description: 'Utility libraries' },
        { description: 'Test suite' },
      ],
      githubRepoUrl: 'https://github.com/nextgen-sdk/sdk',
      createdAt: new Date('2024-01-20T09:00:00Z'),
      updatedAt: new Date('2024-02-15T09:00:00Z'),
    })
    .returning()

  const [_milestone3] = await db
    .insert(milestones)
    .values({
      submissionId: approvedSubmission.id,
      groupId: infraCommittee.id,
      title: 'Testing & Documentation',
      description:
        'Comprehensive testing coverage and detailed documentation with examples.',
      requirements: [
        'Test coverage >90%',
        'API documentation',
        'Usage examples',
        'Tutorial guides',
      ],
      amount: 25000,
      dueDate: new Date('2024-04-30'),
      status: 'pending',
      deliverables: [
        { description: 'Test suite' },
        { description: 'API documentation' },
        { description: 'Example projects' },
        { description: 'Tutorial content' },
      ],
      githubRepoUrl: 'https://github.com/nextgen-sdk/sdk',
      createdAt: new Date('2024-01-20T09:00:00Z'),
    })
    .returning()

  const [_milestone4] = await db
    .insert(milestones)
    .values({
      submissionId: approvedSubmission.id,
      groupId: infraCommittee.id,
      title: 'Production Release',
      description:
        'Final production release with package publishing and community announcement.',
      requirements: [
        'Production build',
        'Package publishing',
        'Release announcement',
        'Community support',
      ],
      amount: 25000,
      dueDate: new Date('2024-05-15'),
      status: 'pending',
      deliverables: [
        { description: 'Production release' },
        { description: 'npm package' },
        { description: 'Release notes' },
        { description: 'Community launch' },
      ],
      githubRepoUrl: 'https://github.com/nextgen-sdk/sdk',
      createdAt: new Date('2024-01-20T09:00:00Z'),
    })
    .returning()

  // Milestones for Web3 State Management Library (infraApprovedWithMilestones)
  const [web3StateMilestone1] = await db
    .insert(milestones)
    .values({
      submissionId: infraApprovedWithMilestones.id,
      groupId: infraCommittee.id,
      title: 'Core State Management Implementation',
      description:
        'Implement core state management hooks for wallet connection, transaction tracking, and blockchain state.',
      requirements: [
        'Wallet connection hooks',
        'Transaction state management',
        'Blockchain data caching',
        'React 18+ compatibility',
      ],
      amount: 1000,
      dueDate: new Date('2024-02-20'),
      status: 'in-review',
      deliverables: [
        { description: 'Core hooks implementation' },
        { description: 'Transaction tracking system' },
        { description: 'Caching layer' },
        { description: 'Unit tests' },
      ],
      githubRepoUrl: 'https://github.com/nft-gaming-studio/web3-state',
      githubCommitHash: 'def789ghi012',
      codeAnalysis: JSON.stringify({
        filesChanged: 18,
        linesAdded: 950,
        testCoverage: 88,
        components: ['Wallet hooks', 'Transaction manager', 'Cache system'],
      }),
      submittedAt: new Date('2024-02-18T10:00:00Z'),
      createdAt: new Date('2024-01-15T09:00:00Z'),
      updatedAt: new Date('2024-02-18T10:00:00Z'),
    })
    .returning()

  const [_web3StateMilestone2] = await db
    .insert(milestones)
    .values({
      submissionId: infraApprovedWithMilestones.id,
      groupId: infraCommittee.id,
      title: 'Advanced Features & Documentation',
      description:
        'Add advanced features including multi-chain support, optimistic updates, and comprehensive documentation.',
      requirements: [
        'Multi-chain support',
        'Optimistic UI updates',
        'API documentation',
        'Usage examples',
      ],
      amount: 1000,
      dueDate: new Date('2024-03-30'),
      status: 'pending',
      deliverables: [
        { description: 'Multi-chain integration' },
        { description: 'Optimistic update system' },
        { description: 'API documentation' },
        { description: 'Example applications' },
      ],
      githubRepoUrl: 'https://github.com/nft-gaming-studio/web3-state',
      createdAt: new Date('2024-01-15T09:00:00Z'),
    })
    .returning()

  const [_web3StateMilestone3] = await db
    .insert(milestones)
    .values({
      submissionId: infraApprovedWithMilestones.id,
      groupId: infraCommittee.id,
      title: 'Production Release & Package Publishing',
      description:
        'Final production release with npm package publishing and community launch.',
      requirements: [
        'Production build',
        'npm package',
        'Release documentation',
        'Community announcement',
      ],
      amount: 500,
      dueDate: new Date('2024-04-15'),
      status: 'pending',
      deliverables: [
        { description: 'Production build' },
        { description: 'npm package published' },
        { description: 'Release notes' },
        { description: 'Community launch plan' },
      ],
      githubRepoUrl: 'https://github.com/nft-gaming-studio/web3-state',
      createdAt: new Date('2024-01-15T09:00:00Z'),
    })
    .returning()

  // Milestones for Zero-Knowledge Proof Development Toolkit (infraInReviewSubmission2)
  const [_zkToolkitMilestone1] = await db
    .insert(milestones)
    .values({
      submissionId: infraInReviewSubmission2.id,
      groupId: infraCommittee.id,
      title: 'Core ZK Circuit Designer & Compiler',
      description:
        'Develop the visual circuit designer interface and core ZK circuit compiler with support for multiple proof systems.',
      requirements: [
        'Visual circuit designer UI',
        'Circuit compiler for Groth16',
        'Circuit compiler for PLONK',
        'Basic optimization algorithms',
        'Unit tests with >85% coverage',
      ],
      amount: 30000,
      dueDate: new Date('2024-04-15'),
      status: 'pending',
      deliverables: [
        { description: 'Visual circuit designer web application' },
        { description: 'Multi-proof system compiler' },
        { description: 'Optimization tooling' },
        { description: 'Test suite' },
      ],
      githubRepoUrl: 'https://github.com/blockchain-education/zk-toolkit',
      createdAt: new Date('2024-01-20T09:00:00Z'),
    })
    .returning()

  const [_zkToolkitMilestone2] = await db
    .insert(milestones)
    .values({
      submissionId: infraInReviewSubmission2.id,
      groupId: infraCommittee.id,
      title: 'Developer SDK & Framework Integrations',
      description:
        'Build developer SDKs for JavaScript, Rust, and Python with integrations for popular ZK frameworks.',
      requirements: [
        'JavaScript/TypeScript SDK',
        'Rust SDK',
        'Python SDK',
        'Circom integration',
        'Noir integration',
        'API documentation',
      ],
      amount: 25000,
      dueDate: new Date('2024-05-30'),
      status: 'pending',
      deliverables: [
        { description: 'Multi-language SDK suite' },
        { description: 'Framework integration plugins' },
        { description: 'Comprehensive API docs' },
        { description: 'Integration examples' },
      ],
      githubRepoUrl: 'https://github.com/blockchain-education/zk-toolkit',
      createdAt: new Date('2024-01-20T09:00:00Z'),
    })
    .returning()

  const [_zkToolkitMilestone3] = await db
    .insert(milestones)
    .values({
      submissionId: infraInReviewSubmission2.id,
      groupId: infraCommittee.id,
      title: 'Performance Optimization & Benchmarking Suite',
      description:
        'Implement advanced optimization algorithms and create comprehensive benchmarking tools for circuit performance analysis.',
      requirements: [
        'Advanced circuit optimization',
        'Proof generation benchmarking',
        'Memory usage profiling',
        'Performance comparison dashboard',
        'Optimization recommendations engine',
      ],
      amount: 25000,
      dueDate: new Date('2024-07-15'),
      status: 'pending',
      deliverables: [
        { description: 'Optimization engine' },
        { description: 'Benchmarking suite' },
        { description: 'Performance dashboard' },
        { description: 'Optimization guide' },
      ],
      githubRepoUrl: 'https://github.com/blockchain-education/zk-toolkit',
      createdAt: new Date('2024-01-20T09:00:00Z'),
    })
    .returning()

  const [_zkToolkitMilestone4] = await db
    .insert(milestones)
    .values({
      submissionId: infraInReviewSubmission2.id,
      groupId: infraCommittee.id,
      title: 'Documentation, Tutorials & Enterprise Features',
      description:
        'Create comprehensive documentation, interactive tutorials, and enterprise-grade features including team collaboration and audit logging.',
      requirements: [
        'Complete documentation site',
        'Interactive tutorials (5+)',
        'Video walkthrough series',
        'Team collaboration features',
        'Audit logging system',
        'Enterprise support portal',
      ],
      amount: 20000,
      dueDate: new Date('2024-08-30'),
      status: 'pending',
      deliverables: [
        { description: 'Documentation website' },
        { description: 'Tutorial content' },
        { description: 'Video series' },
        { description: 'Enterprise features' },
      ],
      githubRepoUrl: 'https://github.com/blockchain-education/zk-toolkit',
      createdAt: new Date('2024-01-20T09:00:00Z'),
    })
    .returning()

  // ============================================================================
  // ADDITIONAL MILESTONES FOR ALEX CHEN TO REVIEW
  // ============================================================================

  console.log('Creating additional milestones for Alex Chen review scenarios...')

  // SCENARIO 1: Recently submitted milestone - needs Alex's review
  const [testingFrameworkMilestone1] = await db
    .insert(milestones)
    .values({
      submissionId: infraPendingSubmission1.id, // Advanced Blockchain Testing Framework
      groupId: infraCommittee.id,
      title: 'Core Testing Infrastructure & Fuzzing Engine',
      description:
        'Implement the core testing infrastructure with advanced fuzzing capabilities, property-based testing, and gas optimization analysis tools.',
      requirements: [
        'Fuzzing engine implementation',
        'Property-based testing framework',
        'Gas optimization analyzer',
        'Smart contract vulnerability scanner',
        'Test coverage reporting system',
        'Integration with major development frameworks',
      ],
      amount: 40000,
      dueDate: new Date('2024-03-15'),
      status: 'in-review',
      deliverables: [
        { description: 'Core fuzzing engine' },
        { description: 'Property-based testing library' },
        { description: 'Gas optimization tools' },
        { description: 'Vulnerability scanner' },
        { description: 'Coverage reporting system' },
        { description: 'Framework integrations' },
      ],
      githubRepoUrl: 'https://github.com/nextgen-sdk/testing-framework',
      githubCommitHash: 'fuzzing123abc456',
      codeAnalysis: JSON.stringify({
        filesChanged: 45,
        linesAdded: 3200,
        testCoverage: 92,
        components: ['Fuzzing engine', 'Property testing', 'Gas analyzer', 'Vulnerability scanner'],
        securityScore: 95,
        performanceScore: 88,
      }),
      submittedAt: new Date('2024-02-20T14:30:00Z'),
      createdAt: new Date('2024-02-10T09:00:00Z'),
      updatedAt: new Date('2024-02-20T14:30:00Z'),
    })
    .returning()

  // SCENARIO 2: Milestone with changes requested - team resubmitted
  const [analyticsMilestone1] = await db
    .insert(milestones)
    .values({
      submissionId: infraPendingSubmission2.id, // Real-time Blockchain Analytics Dashboard
      groupId: infraCommittee.id,
      title: 'Real-time Data Pipeline & Core Analytics Engine',
      description:
        'Build the core real-time data pipeline for blockchain analytics with customizable metrics, alerting system, and performance monitoring.',
      requirements: [
        'Real-time data ingestion pipeline',
        'Customizable metrics dashboard',
        'Alert system with configurable thresholds',
        'Performance monitoring suite',
        'Multi-chain data aggregation',
        'Historical data storage and querying',
      ],
      amount: 25000,
      dueDate: new Date('2024-03-20'),
      status: 'in-review',
      deliverables: [
        { description: 'Real-time data pipeline' },
        { description: 'Analytics dashboard' },
        { description: 'Alerting system' },
        { description: 'Performance monitoring' },
        { description: 'Multi-chain support' },
        { description: 'Historical data system' },
      ],
      githubRepoUrl: 'https://github.com/l2-research-group/analytics-dash',
      githubCommitHash: 'analytics789def012',
      codeAnalysis: JSON.stringify({
        filesChanged: 38,
        linesAdded: 2800,
        testCoverage: 89,
        components: ['Data pipeline', 'Analytics engine', 'Dashboard', 'Alerting system'],
        performanceScore: 94,
        scalabilityScore: 91,
      }),
      submittedAt: new Date('2024-02-22T11:15:00Z'),
      createdAt: new Date('2024-02-12T09:00:00Z'),
      updatedAt: new Date('2024-02-22T11:15:00Z'),
    })
    .returning()

  // SCENARIO 3: Milestone that was rejected and needs re-review
  const [graphqlMilestone1] = await db
    .insert(milestones)
    .values({
      submissionId: infraInReviewSubmission.id, // GraphQL API Generator
      groupId: infraCommittee.id,
      title: 'Core GraphQL Schema Generation & Type Safety',
      description:
        'Implement the core GraphQL schema generation from smart contract ABIs with advanced type safety, caching, and subscription support.',
      requirements: [
        'ABI to GraphQL schema converter',
        'Type-safe query generation',
        'Advanced caching layer',
        'Real-time subscription support',
        'Query optimization engine',
        'Integration with popular GraphQL clients',
      ],
      amount: 20000,
      dueDate: new Date('2024-03-10'),
      status: 'in-review',
      deliverables: [
        { description: 'Schema generation engine' },
        { description: 'Type-safe query builder' },
        { description: 'Caching system' },
        { description: 'Subscription support' },
        { description: 'Query optimizer' },
        { description: 'Client integrations' },
      ],
      githubRepoUrl: 'https://github.com/yieldopt-protocol/graphql-gen',
      githubCommitHash: 'graphql456ghi789',
      codeAnalysis: JSON.stringify({
        filesChanged: 32,
        linesAdded: 2400,
        testCoverage: 87,
        components: ['Schema generator', 'Type system', 'Caching', 'Subscriptions'],
        typeSafetyScore: 96,
        performanceScore: 89,
      }),
      submittedAt: new Date('2024-02-25T09:45:00Z'),
      createdAt: new Date('2024-01-28T09:00:00Z'),
      updatedAt: new Date('2024-02-25T09:45:00Z'),
    })
    .returning()

  // SCENARIO 4: Milestone that needs urgent review (overdue)
  const [zkMilestone1] = await db
    .insert(milestones)
    .values({
      submissionId: infraInReviewSubmission2.id, // ZK Toolkit
      groupId: infraCommittee.id,
      title: 'Visual Circuit Designer & Multi-Proof System Compiler',
      description:
        'Develop the visual circuit designer interface with support for multiple zero-knowledge proof systems including Groth16, PLONK, and STARK.',
      requirements: [
        'Interactive visual circuit designer',
        'Multi-proof system compiler (Groth16, PLONK, STARK)',
        'Circuit optimization algorithms',
        'Proof generation benchmarking',
        'Export to multiple ZK frameworks',
        'Comprehensive testing suite',
      ],
      amount: 35000,
      dueDate: new Date('2024-02-28'), // Overdue!
      status: 'in-review',
      deliverables: [
        { description: 'Visual circuit designer' },
        { description: 'Multi-proof compiler' },
        { description: 'Optimization algorithms' },
        { description: 'Benchmarking suite' },
        { description: 'Framework exports' },
        { description: 'Test suite' },
      ],
      githubRepoUrl: 'https://github.com/blockchain-education/zk-toolkit',
      githubCommitHash: 'zk123jkl456mno',
      codeAnalysis: JSON.stringify({
        filesChanged: 52,
        linesAdded: 4100,
        testCoverage: 91,
        components: ['Visual designer', 'Multi-proof compiler', 'Optimizer', 'Benchmarker'],
        complexityScore: 94,
        innovationScore: 97,
      }),
      submittedAt: new Date('2024-02-26T16:20:00Z'),
      createdAt: new Date('2024-01-20T09:00:00Z'),
      updatedAt: new Date('2024-02-26T16:20:00Z'),
    })
    .returning()

  // SCENARIO 5: Milestone with partial reviews (needs Alex's final vote)
  const [web3Milestone2] = await db
    .insert(milestones)
    .values({
      submissionId: infraApprovedWithMilestones.id, // Web3 State Management
      groupId: infraCommittee.id,
      title: 'Advanced Features & Multi-Chain Support',
      description:
        'Implement advanced features including multi-chain support, optimistic updates, advanced caching strategies, and comprehensive error handling.',
      requirements: [
        'Multi-chain wallet connection',
        'Optimistic UI updates',
        'Advanced caching strategies',
        'Error handling and recovery',
        'Performance monitoring',
        'Cross-chain transaction support',
      ],
      amount: 1000,
      dueDate: new Date('2024-03-25'),
      status: 'in-review',
      deliverables: [
        { description: 'Multi-chain support' },
        { description: 'Optimistic updates' },
        { description: 'Advanced caching' },
        { description: 'Error handling' },
        { description: 'Performance monitoring' },
        { description: 'Cross-chain features' },
      ],
      githubRepoUrl: 'https://github.com/nft-gaming-studio/web3-state',
      githubCommitHash: 'web3abc789def456',
      codeAnalysis: JSON.stringify({
        filesChanged: 28,
        linesAdded: 1950,
        testCoverage: 90,
        components: ['Multi-chain support', 'Optimistic updates', 'Advanced caching', 'Error handling'],
        reliabilityScore: 93,
        performanceScore: 91,
      }),
      submittedAt: new Date('2024-02-24T13:30:00Z'),
      createdAt: new Date('2024-01-15T09:00:00Z'),
      updatedAt: new Date('2024-02-24T13:30:00Z'),
    })
    .returning()

  // SCENARIO 6: Milestone with changes requested (team needs to resubmit)
  const [testingFrameworkMilestone2] = await db
    .insert(milestones)
    .values({
      submissionId: infraPendingSubmission1.id,
      groupId: infraCommittee.id,
      title: 'Advanced Security Analysis & Integration Tools',
      description:
        'Build advanced security analysis tools with integration capabilities for popular development environments and CI/CD pipelines.',
      requirements: [
        'Advanced vulnerability detection',
        'Security pattern analysis',
        'CI/CD pipeline integration',
        'IDE plugin development',
        'Security report generation',
        'Automated fix suggestions',
      ],
      amount: 35000,
      dueDate: new Date('2024-04-15'),
      status: 'changes-requested',
      deliverables: [
        { description: 'Security analysis tools' },
        { description: 'Pattern analysis engine' },
        { description: 'CI/CD integrations' },
        { description: 'IDE plugins' },
        { description: 'Report generator' },
        { description: 'Fix suggestions' },
      ],
      githubRepoUrl: 'https://github.com/nextgen-sdk/testing-framework',
      createdAt: new Date('2024-02-10T09:00:00Z'),
      updatedAt: new Date('2024-02-28T10:00:00Z'),
    })
    .returning()

  // ============================================================================
  // MILESTONE DISCUSSIONS - Create discussions for milestones
  // ============================================================================

  const [milestone1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission.id,
      milestoneId: milestone1.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  const [milestone2Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: approvedSubmission.id,
      milestoneId: milestone2.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  const [web3Milestone1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraApprovedWithMilestones.id,
      milestoneId: web3StateMilestone1.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  // Discussions for new milestones
  const [testingFrameworkMilestone1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraPendingSubmission1.id,
      milestoneId: testingFrameworkMilestone1.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  const [analyticsMilestone1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraPendingSubmission2.id,
      milestoneId: analyticsMilestone1.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  const [graphqlMilestone1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraInReviewSubmission.id,
      milestoneId: graphqlMilestone1.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  const [zkMilestone1Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraInReviewSubmission2.id,
      milestoneId: zkMilestone1.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  const [web3Milestone2Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraApprovedWithMilestones.id,
      milestoneId: web3Milestone2.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  const [testingFrameworkMilestone2Discussion] = await db
    .insert(discussions)
    .values({
      submissionId: infraPendingSubmission1.id,
      milestoneId: testingFrameworkMilestone2.id,
      groupId: infraCommittee.id,
      type: 'milestone',
      isPublic: true,
    })
    .returning()

  // ============================================================================
  // MILESTONE MESSAGES
  // ============================================================================

  await db.insert(messages).values([
    {
      discussionId: milestone1Discussion.id,
      authorId: teamMember1.id,
      content:
        'Milestone 1 completed! The architecture is designed with modularity in mind and includes comprehensive testing setup.',
      messageType: 'comment',
      createdAt: new Date('2024-02-10T10:00:00Z'),
    },
    {
      discussionId: milestone1Discussion.id,
      authorId: reviewer1.id,
      content:
        'Excellent work! The architecture documentation is very thorough. Approving this milestone.',
      messageType: 'comment',
      createdAt: new Date('2024-02-11T15:30:00Z'),
    },
    {
      discussionId: milestone2Discussion.id,
      authorId: teamMember1.id,
      content:
        'Core development is progressing well. About 70% complete with the main API wrappers implemented.',
      messageType: 'comment',
      createdAt: new Date('2024-03-15T14:00:00Z'),
    },
    {
      discussionId: web3Milestone1Discussion.id,
      authorId: teamMember5.id,
      content:
        'Milestone 1 is complete! Core wallet hooks and transaction tracking are fully implemented with 88% test coverage.',
      messageType: 'comment',
      createdAt: new Date('2024-02-18T10:00:00Z'),
    },
    {
      discussionId: web3Milestone1Discussion.id,
      authorId: teamMember5.id,
      content:
        "The caching layer significantly improves performance - we're seeing 3x faster data retrieval compared to direct RPC calls.",
      messageType: 'comment',
      createdAt: new Date('2024-02-18T10:30:00Z'),
    },

    // Messages for new milestone discussions
    // Testing Framework Milestone 1 - Recently submitted, needs Alex's review
    {
      discussionId: testingFrameworkMilestone1Discussion.id,
      authorId: teamMember1.id,
      content:
        'Milestone 1 complete! The fuzzing engine is working excellently with 95% security score. We found 12 potential vulnerabilities in test contracts.',
      messageType: 'comment',
      createdAt: new Date('2024-02-20T14:30:00Z'),
    },
    {
      discussionId: testingFrameworkMilestone1Discussion.id,
      authorId: teamMember1.id,
      content:
        'The gas optimization analyzer is particularly impressive - it identified 23% gas savings opportunities in our test suite.',
      messageType: 'comment',
      createdAt: new Date('2024-02-20T15:00:00Z'),
    },

    // Analytics Milestone 1 - Resubmitted after changes
    {
      discussionId: analyticsMilestone1Discussion.id,
      authorId: teamMember3.id,
      content:
        'Milestone resubmitted! We addressed all the feedback from the previous review. The real-time pipeline now handles 10,000+ TPS with sub-second latency.',
      messageType: 'comment',
      createdAt: new Date('2024-02-22T11:15:00Z'),
    },
    {
      discussionId: analyticsMilestone1Discussion.id,
      authorId: teamMember3.id,
      content:
        'The multi-chain data aggregation is working perfectly. We now support Ethereum, Polygon, and Arbitrum with unified metrics.',
      messageType: 'comment',
      createdAt: new Date('2024-02-22T11:45:00Z'),
    },

    // GraphQL Milestone 1 - Resubmitted after rejection
    {
      discussionId: graphqlMilestone1Discussion.id,
      authorId: teamMember4.id,
      content:
        'We completely rebuilt the schema generation engine based on your feedback. The type safety is now 96% and performance improved by 40%.',
      messageType: 'comment',
      createdAt: new Date('2024-02-25T09:45:00Z'),
    },
    {
      discussionId: graphqlMilestone1Discussion.id,
      authorId: teamMember4.id,
      content:
        'The subscription support is now fully functional with real-time updates. We also added query optimization that reduces response time by 60%.',
      messageType: 'comment',
      createdAt: new Date('2024-02-25T10:15:00Z'),
    },

    // ZK Milestone 1 - Overdue, urgent review needed
    {
      discussionId: zkMilestone1Discussion.id,
      authorId: teamMember2.id,
      content:
        'Milestone submitted! The visual circuit designer is groundbreaking - it supports drag-and-drop circuit creation with real-time compilation.',
      messageType: 'comment',
      createdAt: new Date('2024-02-26T16:20:00Z'),
    },
    {
      discussionId: zkMilestone1Discussion.id,
      authorId: teamMember2.id,
      content:
        'We achieved 97% innovation score with the multi-proof system compiler. It supports Groth16, PLONK, and STARK with seamless switching.',
      messageType: 'comment',
      createdAt: new Date('2024-02-26T16:50:00Z'),
    },
    {
      discussionId: zkMilestone1Discussion.id,
      authorId: teamMember2.id,
      content:
        'The benchmarking suite shows 3x faster proof generation compared to existing tools. This could revolutionize ZK development workflows.',
      messageType: 'comment',
      createdAt: new Date('2024-02-26T17:10:00Z'),
    },

    // Web3 Milestone 2 - Partial reviews, needs Alex's final vote
    {
      discussionId: web3Milestone2Discussion.id,
      authorId: teamMember5.id,
      content:
        'Advanced features milestone complete! Multi-chain support is working flawlessly with 93% reliability score.',
      messageType: 'comment',
      createdAt: new Date('2024-02-24T13:30:00Z'),
    },
    {
      discussionId: web3Milestone2Discussion.id,
      authorId: teamMember5.id,
      content:
        'The optimistic updates system is particularly impressive - it provides instant UI feedback while maintaining data consistency.',
      messageType: 'comment',
      createdAt: new Date('2024-02-24T14:00:00Z'),
    },
    {
      discussionId: web3Milestone2Discussion.id,
      authorId: reviewer2.id,
      content:
        'Excellent work on the multi-chain implementation! The error handling is robust and the performance monitoring provides great insights.',
      messageType: 'comment',
      createdAt: new Date('2024-02-25T09:00:00Z'),
    },

    // Testing Framework Milestone 2 - Changes requested
    {
      discussionId: testingFrameworkMilestone2Discussion.id,
      authorId: reviewer1.id,
      content:
        'The security analysis tools need more comprehensive vulnerability detection. Please add support for reentrancy attacks and integer overflow patterns.',
      messageType: 'comment',
      createdAt: new Date('2024-02-28T10:00:00Z'),
    },
    {
      discussionId: testingFrameworkMilestone2Discussion.id,
      authorId: reviewer1.id,
      content:
        'The IDE plugin integration is good, but we need better documentation for the CI/CD pipeline setup. Also, the automated fix suggestions need improvement.',
      messageType: 'comment',
      createdAt: new Date('2024-02-28T10:30:00Z'),
    },
  ])

  // ============================================================================
  // MILESTONE REVIEWS
  // ============================================================================

  await db.insert(reviews).values([
    {
      submissionId: approvedSubmission.id,
      milestoneId: milestone1.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer1.id,
      discussionId: milestone1Discussion.id,
      vote: 'approve',
      feedback:
        'Architecture is well-designed and documentation is comprehensive. Excellent foundation for the project.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-11T15:30:00Z'),
    },
    {
      submissionId: approvedSubmission.id,
      milestoneId: milestone1.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer2.id,
      discussionId: milestone1Discussion.id,
      vote: 'approve',
      feedback:
        'Great start! The CI/CD setup will help maintain code quality throughout development.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-12T09:00:00Z'),
    },
    // Web3 State Management Milestone 1 - Needs Alex's review
    {
      submissionId: infraApprovedWithMilestones.id,
      milestoneId: web3StateMilestone1.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer2.id,
      discussionId: web3Milestone1Discussion.id,
      vote: 'approve',
      feedback:
        'Impressive performance improvements with the caching layer. Code quality is excellent.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-19T11:00:00Z'),
    },

    // Reviews for new milestones - Different voting scenarios for Alex Chen
    // Testing Framework Milestone 1 - No reviews yet, needs Alex's first review
    // (No reviews added - Alex needs to be the first reviewer)

    // Analytics Milestone 1 - Has one approve vote, needs Alex's review
    {
      submissionId: infraPendingSubmission2.id,
      milestoneId: analyticsMilestone1.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer2.id,
      discussionId: analyticsMilestone1Discussion.id,
      vote: 'approve',
      feedback:
        'Excellent improvements! The real-time pipeline performance is impressive and the multi-chain support is well-implemented.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-23T10:00:00Z'),
    },

    // GraphQL Milestone 1 - Has one approve vote, needs Alex's review
    {
      submissionId: infraInReviewSubmission.id,
      milestoneId: graphqlMilestone1.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer2.id,
      discussionId: graphqlMilestone1Discussion.id,
      vote: 'approve',
      feedback:
        'Outstanding work on the type safety improvements! The 96% type safety score and 40% performance improvement are remarkable.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-26T09:00:00Z'),
    },

    // ZK Milestone 1 - Has one approve vote, needs Alex's review (URGENT - overdue)
    {
      submissionId: infraInReviewSubmission2.id,
      milestoneId: zkMilestone1.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer2.id,
      discussionId: zkMilestone1Discussion.id,
      vote: 'approve',
      feedback:
        'Revolutionary work! The visual circuit designer and multi-proof system compiler are game-changing. The 97% innovation score speaks for itself.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-27T08:00:00Z'),
    },

    // Web3 Milestone 2 - Has one approve vote, needs Alex's final vote for approval
    {
      submissionId: infraApprovedWithMilestones.id,
      milestoneId: web3Milestone2.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer2.id,
      discussionId: web3Milestone2Discussion.id,
      vote: 'approve',
      feedback:
        'Fantastic multi-chain implementation! The optimistic updates system and error handling are particularly well-designed.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-25T09:00:00Z'),
    },

    // Testing Framework Milestone 2 - Alex already reviewed and requested changes
    {
      submissionId: infraPendingSubmission1.id,
      milestoneId: testingFrameworkMilestone2.id,
      groupId: infraCommittee.id,
      reviewerId: reviewer1.id, // Alex Chen
      discussionId: testingFrameworkMilestone2Discussion.id,
      vote: 'reject',
      feedback:
        'The security analysis tools need more comprehensive vulnerability detection. Please add support for reentrancy attacks and integer overflow patterns. Also improve the IDE plugin documentation and automated fix suggestions.',
      reviewType: 'milestone',
      weight: 2,
      isBinding: true,
      createdAt: new Date('2024-02-28T10:00:00Z'),
    },
  ])

  // ============================================================================
  // PAYOUTS - Create some completed and pending payouts
  // ============================================================================

  console.log('Creating payouts...')

  // Completed payout for milestone 1
  await db.insert(payouts).values({
    submissionId: approvedSubmission.id,
    milestoneId: milestone1.id,
    groupId: infraCommittee.id,
    amount: 20000,
    transactionHash:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    blockExplorerUrl:
      'https://etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    status: 'completed',
    triggeredBy: reviewer1.id,
    approvedBy: reviewer1.id,
    walletFrom: infraCommittee.walletAddress,
    walletTo: teamMember1.walletAddress,
    createdAt: new Date('2024-02-12T16:00:00Z'),
    processedAt: new Date('2024-02-12T16:15:00Z'),
  })

  // Pending payout (milestone 2 not yet completed)
  await db.insert(payouts).values({
    submissionId: approvedSubmission.id,
    milestoneId: milestone2.id,
    groupId: infraCommittee.id,
    amount: 30000,
    status: 'pending',
    triggeredBy: teamMember1.id,
    walletFrom: infraCommittee.walletAddress,
    walletTo: teamMember1.walletAddress,
    createdAt: new Date('2024-03-15T14:30:00Z'),
  })

  // ============================================================================
  // NOTIFICATIONS - Create some test notifications
  // ============================================================================

  console.log('Creating notifications...')

  await db.insert(notifications).values([
    {
      userId: teamMember1.id,
      groupId: infraCommittee.id,
      type: 'submission_approved',
      submissionId: approvedSubmission.id,
      discussionId: approvedDiscussion.id,
      read: true,
      content: 'Your submission "Next-Gen Developer SDK" has been approved!',
      priority: 'high',
      createdAt: new Date('2024-01-20T09:00:00Z'),
      readAt: new Date('2024-01-20T10:30:00Z'),
    },
    {
      userId: teamMember1.id,
      groupId: infraCommittee.id,
      type: 'milestone_approved',
      submissionId: approvedSubmission.id,
      milestoneId: milestone1.id,
      read: false,
      content:
        'Milestone "Architecture Design & Setup" has been approved and payout processed.',
      priority: 'high',
      createdAt: new Date('2024-02-12T16:15:00Z'),
    },
    {
      userId: teamMember3.id,
      groupId: researchCommittee.id,
      type: 'review_feedback',
      submissionId: underReviewSubmission.id,
      discussionId: reviewDiscussion.id,
      read: false,
      content:
        'New feedback on your submission "Scalability Research: Layer 2 Solutions Comparative Analysis"',
      priority: 'normal',
      createdAt: new Date('2024-01-30T13:20:00Z'),
    },
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'new_submission',
      submissionId: pendingSubmission.id,
      read: true,
      content:
        'New submission requiring review: "Decentralized Yield Optimization Protocol"',
      priority: 'normal',
      createdAt: new Date('2024-02-05T10:00:00Z'),
      readAt: new Date('2024-02-05T11:15:00Z'),
    },
    {
      userId: teamMember5.id,
      groupId: gamingCommittee.id,
      type: 'submission_rejected',
      submissionId: rejectedSubmission.id,
      discussionId: rejectedDiscussion.id,
      read: false,
      content:
        'Your submission "Basic NFT Trading Card Game" was not approved. Please see feedback for details.',
      priority: 'high',
      createdAt: new Date('2024-01-22T10:30:00Z'),
    },

    // ============================================================================
    // NOTIFICATIONS FOR ALEX CHEN - Infrastructure Committee Admin
    // ============================================================================

    // New pending submissions requiring initial review
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'new_submission',
      submissionId: infraPendingSubmission1.id,
      discussionId: infraPending1Discussion.id,
      read: false,
      content:
        'New submission requiring review: "Advanced Blockchain Testing Framework" - $100,000',
      priority: 'high',
      createdAt: new Date('2024-02-10T09:00:00Z'),
    },
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'new_submission',
      submissionId: infraPendingSubmission2.id,
      discussionId: infraPending2Discussion.id,
      read: false,
      content:
        'New submission requiring review: "Real-time Blockchain Analytics Dashboard" - $50,000',
      priority: 'high',
      createdAt: new Date('2024-02-12T09:00:00Z'),
    },

    // In-review submissions needing Alex's vote
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'review_requested',
      submissionId: infraInReviewSubmission.id,
      discussionId: infraInReviewDiscussion.id,
      read: false,
      content:
        'Your vote needed: "GraphQL API Generator for Smart Contracts" - 1 of 3 votes received',
      priority: 'high',
      createdAt: new Date('2024-02-05T12:00:00Z'),
    },
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'review_requested',
      submissionId: infraInReviewSubmission2.id,
      discussionId: infraInReview2Discussion.id,
      read: false,
      content:
        'Your vote needed for approval: "Zero-Knowledge Proof Development Toolkit" - 2 of 3 votes received',
      priority: 'high',
      createdAt: new Date('2024-02-08T16:30:00Z'),
    },

    // Milestone review needed
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: infraApprovedWithMilestones.id,
      milestoneId: web3StateMilestone1.id,
      discussionId: web3Milestone1Discussion.id,
      read: false,
      content:
        'Milestone submitted for review: "Core State Management Implementation" - Web3 State Management Library',
      priority: 'high',
      createdAt: new Date('2024-02-18T10:00:00Z'),
    },

    // New activity on submissions
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'new_comment',
      submissionId: infraInReviewSubmission2.id,
      discussionId: infraInReview2Discussion.id,
      read: false,
      content:
        'New comment on "Zero-Knowledge Proof Development Toolkit" by Maria Rodriguez',
      priority: 'normal',
      createdAt: new Date('2024-02-08T16:00:00Z'),
    },

    // ============================================================================
    // ADDITIONAL NOTIFICATIONS FOR ALEX CHEN - New Milestone Reviews
    // ============================================================================

    // Testing Framework Milestone 1 - Needs Alex's first review
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: infraPendingSubmission1.id,
      milestoneId: testingFrameworkMilestone1.id,
      discussionId: testingFrameworkMilestone1Discussion.id,
      read: false,
      content:
        'New milestone submitted for review: "Core Testing Infrastructure & Fuzzing Engine" - Advanced Blockchain Testing Framework',
      priority: 'high',
      createdAt: new Date('2024-02-20T14:30:00Z'),
    },

    // Analytics Milestone 1 - Needs Alex's review (has one approve vote)
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: infraPendingSubmission2.id,
      milestoneId: analyticsMilestone1.id,
      discussionId: analyticsMilestone1Discussion.id,
      read: false,
      content:
        'Milestone review needed: "Real-time Data Pipeline & Core Analytics Engine" - 1 of 2 votes received',
      priority: 'high',
      createdAt: new Date('2024-02-22T11:15:00Z'),
    },

    // GraphQL Milestone 1 - Needs Alex's review (has one approve vote)
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: infraInReviewSubmission.id,
      milestoneId: graphqlMilestone1.id,
      discussionId: graphqlMilestone1Discussion.id,
      read: false,
      content:
        'Milestone review needed: "Core GraphQL Schema Generation & Type Safety" - 1 of 2 votes received',
      priority: 'high',
      createdAt: new Date('2024-02-25T09:45:00Z'),
    },

    // ZK Milestone 1 - URGENT review needed (overdue, has one approve vote)
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: infraInReviewSubmission2.id,
      milestoneId: zkMilestone1.id,
      discussionId: zkMilestone1Discussion.id,
      read: false,
      content:
        'URGENT: Overdue milestone review needed: "Visual Circuit Designer & Multi-Proof System Compiler" - 1 of 2 votes received',
      priority: 'high',
      createdAt: new Date('2024-02-26T16:20:00Z'),
    },

    // Web3 Milestone 2 - Needs Alex's final vote for approval
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: infraApprovedWithMilestones.id,
      milestoneId: web3Milestone2.id,
      discussionId: web3Milestone2Discussion.id,
      read: false,
      content:
        'Final vote needed: "Advanced Features & Multi-Chain Support" - 1 of 2 votes received (ready for approval)',
      priority: 'high',
      createdAt: new Date('2024-02-24T13:30:00Z'),
    },

    // Testing Framework Milestone 2 - Team responded to changes requested
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'milestone_submitted',
      submissionId: infraPendingSubmission1.id,
      milestoneId: testingFrameworkMilestone2.id,
      discussionId: testingFrameworkMilestone2Discussion.id,
      read: false,
      content:
        'Milestone resubmitted after changes requested: "Advanced Security Analysis & Integration Tools" - Ready for re-review',
      priority: 'normal',
      createdAt: new Date('2024-02-28T15:00:00Z'),
    },

    // Additional milestone activity notifications
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'new_comment',
      submissionId: infraPendingSubmission1.id,
      discussionId: testingFrameworkMilestone1Discussion.id,
      read: false,
      content:
        'New comment on "Core Testing Infrastructure & Fuzzing Engine" milestone by John Developer',
      priority: 'normal',
      createdAt: new Date('2024-02-20T15:00:00Z'),
    },
    {
      userId: reviewer1.id,
      groupId: infraCommittee.id,
      type: 'new_comment',
      submissionId: infraInReviewSubmission2.id,
      discussionId: zkMilestone1Discussion.id,
      read: false,
      content:
        'New comment on "Visual Circuit Designer & Multi-Proof System Compiler" milestone by Alice Innovator',
      priority: 'normal',
      createdAt: new Date('2024-02-26T17:10:00Z'),
    },
  ])

  // ============================================================================
  // SUCCESS MESSAGE
  // ============================================================================

  console.log('✅ Comprehensive database seeding completed successfully!')
  console.log('\n=== SUMMARY ===')
  console.log(`🏛️  Created ${4} committee groups:`)
  console.log(
    '   • Infrastructure Development Committee (active) 🔐 MULTISIG ENABLED'
  )
  console.log('   • Research & Education Committee (active)')
  console.log('   • DeFi Innovation Committee (active)')
  console.log('   • Gaming & NFT Committee (active)')
  console.log('\n🔐 MULTISIG CONFIGURATION (Infrastructure Committee):')
  console.log(`   • Multisig Address: ${MULTISIG_ADDRESS}`)
  console.log(`   • Signatory 1: ${SIGNATORY_1_ADDRESS}`)
  console.log(`   • Signatory 2: ${SIGNATORY_2_ADDRESS}`)
  console.log('   • Threshold: 2 of 2 signatures required')
  console.log(
    '   • Approval Workflow: MERGED (review + blockchain signature combined)'
  )
  console.log('   • Network: Paseo Testnet')
  console.log('   • Automatic Execution: Enabled')

  console.log(`\n👥 Created ${5} team groups:`)
  console.log('   • NextGen SDK Team')
  console.log('   • Layer2 Research Group')
  console.log('   • YieldOpt Protocol Team')
  console.log('   • Blockchain Education Collective')
  console.log('   • NFT Gaming Studio')

  console.log(`\n👤 Created ${9} users:`)
  console.log('   • 4 reviewers with committee primary role')
  console.log('   • 5 team members with team primary role')
  console.log('   • All passwords: reviewer123, team1234 respectively')
  console.log(
    '   • Alex Chen & Maria Rodriguez: Configured with multisig wallet addresses'
  )

  console.log(`\n💼 Created ${6} grant programs across committees`)
  console.log('   • Infrastructure: Core Development ($100K), Tools ($50K)')
  console.log('   • Research: Academic Research ($75K), Education ($25K)')
  console.log('   • DeFi: Protocol Development ($150K)')
  console.log('   • Gaming: Platform Development ($80K)')

  console.log(`\n📋 Created ${10} submissions in various states:`)
  console.log('   • 2 APPROVED (with milestones and payouts)')
  console.log('   • 3 IN-REVIEW (partial reviewer votes)')
  console.log('   • 4 PENDING (just submitted)')
  console.log('   • 1 REJECTED (with feedback)')

  console.log(`\n🎯 Created ${13} milestones across approved submissions:`)
  console.log('   • 1 COMPLETED (with payout)')
  console.log('   • 1 CHANGES-REQUESTED')
  console.log('   • 6 IN-REVIEW (submitted, awaiting approval)')
  console.log('   • 5 PENDING')

  console.log(`\n💬 Created active discussions with messages and reviews`)
  console.log(`💰 Created example payouts (completed and pending)`)
  console.log(`🔔 Created test notifications for various scenarios`)

  console.log('\n🧪 TEST SCENARIOS AVAILABLE:')
  console.log('✅ Group setup and management (committees & teams)')
  console.log('✅ Multi-group submissions and reviews')
  console.log('✅ Submission approval workflows')
  console.log('✅ Milestone tracking and completion')
  console.log('✅ Reviewer voting and reviews')
  console.log('✅ Discussion threads and messaging')
  console.log('✅ Payout processing')
  console.log('✅ Notification system')
  console.log('✅ Cross-group comparisons')
  console.log('✅ Role-based permissions and workflows')

  console.log('\n🎯 ALEX CHEN (Infrastructure Committee Admin) SCENARIOS:')
  console.log('📥 Pending Submissions (2):')
  console.log('   • "Advanced Blockchain Testing Framework" - $100K')
  console.log('   • "Real-time Blockchain Analytics Dashboard" - $50K')
  console.log('🗳️  In-Review Submissions Needing Vote (2):')
  console.log('   • "GraphQL API Generator" - 1/3 votes')
  console.log(
    '   • "Zero-Knowledge Proof Toolkit" - 2/3 votes (near approval!)'
  )
  console.log('✅ Milestone Reviews (7):')
  console.log('   • "Core State Management Implementation" - Web3 State Library')
  console.log('   • "Core Testing Infrastructure & Fuzzing Engine" - Testing Framework')
  console.log('   • "Real-time Data Pipeline & Core Analytics Engine" - Analytics Dashboard')
  console.log('   • "Core GraphQL Schema Generation & Type Safety" - GraphQL Generator')
  console.log('   • "Visual Circuit Designer & Multi-Proof System Compiler" - ZK Toolkit (URGENT - Overdue)')
  console.log('   • "Advanced Features & Multi-Chain Support" - Web3 State Library')
  console.log('   • "Advanced Security Analysis & Integration Tools" - Testing Framework (Changes Requested)')
  console.log('🔔 Unread Notifications (13):')
  console.log('   • 2 new submissions')
  console.log('   • 2 review requests')
  console.log('   • 6 milestone submissions (1 urgent)')
  console.log('   • 3 new comments\n')
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
