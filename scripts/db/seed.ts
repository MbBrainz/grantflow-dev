import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
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

const client = postgres(process.env.POSTGRES_URL!)
const db = drizzle(client)

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
      status: 'under_review',
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
        oldStatus: 'under_review',
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
        oldStatus: 'under_review',
        reason: 'Insufficient technical detail and innovation',
      }),
      createdAt: new Date('2024-01-22T10:30:00Z'),
    },
  ])

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
      status: 'in-progress',
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
  ])

  // ============================================================================
  // SUCCESS MESSAGE
  // ============================================================================

  console.log('✅ Comprehensive database seeding completed successfully!')
  console.log('\n=== SUMMARY ===')
  console.log(`🏛️  Created ${4} committee groups:`)
  console.log('   • Infrastructure Development Committee (active)')
  console.log('   • Research & Education Committee (active)')
  console.log('   • DeFi Innovation Committee (active)')
  console.log('   • Gaming & NFT Committee (active)')

  console.log(`\n👥 Created ${5} team groups:`)
  console.log('   • NextGen SDK Team')
  console.log('   • Layer2 Research Group')
  console.log('   • YieldOpt Protocol Team')
  console.log('   • Blockchain Education Collective')
  console.log('   • NFT Gaming Studio')

  console.log(`\n👤 Created ${9} users:`)
  console.log('   • 4 reviewers with committee primary role')
  console.log('   • 5 team members with team primary role')
  console.log('   • All passwords: reviewer123, team123 respectively')

  console.log(`\n💼 Created ${6} grant programs across committees`)
  console.log('   • Infrastructure: Core Development ($100K), Tools ($50K)')
  console.log('   • Research: Academic Research ($75K), Education ($25K)')
  console.log('   • DeFi: Protocol Development ($150K)')
  console.log('   • Gaming: Platform Development ($80K)')

  console.log(`\n📋 Created ${5} submissions in various states:`)
  console.log('   • 1 APPROVED (with milestones and payouts)')
  console.log('   • 1 UNDER_REVIEW (partial reviewer votes)')
  console.log('   • 2 PENDING (just submitted)')
  console.log('   • 1 REJECTED (with feedback)')

  console.log(`\n🎯 Created ${4} milestones for approved submission:`)
  console.log('   • 1 COMPLETED (with payout)')
  console.log('   • 1 IN_PROGRESS')
  console.log('   • 2 PENDING')

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
  console.log('✅ Role-based permissions and workflows\n')
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
