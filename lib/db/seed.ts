import { drizzle } from 'drizzle-orm/postgres-js';
import { 
  users, 
  committees, 
  committeeCurators, 
  grantPrograms,
  submissions,
  discussions,
  messages,
  milestones,
  reviews,
  payouts,
  notifications
} from './schema';
import { config } from 'dotenv';
import postgres from 'postgres';
import { hashPassword } from '@/lib/auth/session';

config();

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

async function seed() {
  console.log('🌱 Starting comprehensive database seeding...');

  // ============================================================================
  // USERS - Create diverse users with different roles
  // ============================================================================
  
  console.log('Creating users...');
  
  // Admin users
  const adminPassword = await hashPassword('admin123');
  const [admin1] = await db.insert(users).values({
    email: 'admin@grantflow.com',
    passwordHash: adminPassword,
    role: "admin",
    name: "Platform Admin",
    githubId: "admin-user"
  }).returning();

  const [admin2] = await db.insert(users).values({
    email: 'admin2@grantflow.com',
    passwordHash: adminPassword,
        role: "admin",
    name: "Sarah Johnson",
    githubId: "sarah-admin"
  }).returning();

  // Curator users
  const curatorPassword = await hashPassword('curator123');
  const [curator1] = await db.insert(users).values({
    email: 'curator1@test.com',
    passwordHash: curatorPassword,
    role: "curator",
    name: "Alex Chen",
    githubId: "alex-curator"
  }).returning();

  const [curator2] = await db.insert(users).values({
    email: 'curator2@test.com',
    passwordHash: curatorPassword,
    role: "curator",
    name: "Maria Rodriguez",
    githubId: "maria-curator"
  }).returning();

  const [curator3] = await db.insert(users).values({
    email: 'curator3@test.com',
    passwordHash: curatorPassword,
    role: "curator",
    name: "David Kim",
    githubId: "david-curator"
  }).returning();

  const [curator4] = await db.insert(users).values({
    email: 'curator4@test.com',
    passwordHash: curatorPassword,
        role: "curator",
    name: "Elena Vasquez",
    githubId: "elena-curator"
  }).returning();

  // Grantee users
  const granteePassword = await hashPassword('grantee123');
  const [grantee1] = await db.insert(users).values({
    email: 'grantee1@test.com',
    passwordHash: granteePassword,
    role: "grantee",
    name: "John Developer",
    githubId: "john-dev",
    walletAddress: "0x1111111111111111111111111111111111111111"
  }).returning();

  const [grantee2] = await db.insert(users).values({
    email: 'grantee2@test.com',
    passwordHash: granteePassword,
    role: "grantee",
    name: "Jane Builder",
    githubId: "jane-builder",
    walletAddress: "0x2222222222222222222222222222222222222222"
  }).returning();

  const [grantee3] = await db.insert(users).values({
    email: 'grantee3@test.com',
    passwordHash: granteePassword,
    role: "grantee",
    name: "Bob Researcher",
    githubId: "bob-research",
    walletAddress: "0x3333333333333333333333333333333333333333"
  }).returning();

  const [grantee4] = await db.insert(users).values({
    email: 'grantee4@test.com',
    passwordHash: granteePassword,
    role: "grantee",
    name: "Alice Innovator",
    githubId: "alice-innovate",
    walletAddress: "0x4444444444444444444444444444444444444444"
  }).returning();

  const [grantee5] = await db.insert(users).values({
    email: 'grantee5@test.com',
    passwordHash: granteePassword,
    role: "grantee",
    name: "Charlie Protocol",
    githubId: "charlie-protocol",
    walletAddress: "0x5555555555555555555555555555555555555555"
  }).returning();

  // ============================================================================
  // COMMITTEES - Create diverse committees with different focuses
  // ============================================================================
  
  console.log('Creating committees...');

  const [infraCommittee] = await db.insert(committees).values({
    name: 'Infrastructure Development Foundation',
    description: 'Supporting core infrastructure, developer tools, and protocol improvements',
    focusAreas: JSON.stringify(['Infrastructure', 'Developer Tools', 'Protocol Development', 'Security']),
    websiteUrl: 'https://infra-dev.org',
    githubOrg: 'infra-dev-foundation',
    walletAddress: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    isActive: true,
    votingThreshold: 3,
    approvalWorkflow: JSON.stringify({
      stages: ['initial_review', 'technical_review', 'security_review', 'final_approval'],
      requiredVotes: 3,
      requiredApprovalPercentage: 66
    })
  }).returning();

  const [researchCommittee] = await db.insert(committees).values({
    name: 'Research & Education Grant Committee',
    description: 'Funding research, educational content, and community building initiatives',
    focusAreas: JSON.stringify(['Research', 'Education', 'Documentation', 'Community']),
    websiteUrl: 'https://research-grants.org',
    githubOrg: 'research-committee',
    walletAddress: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    isActive: true,
    votingThreshold: 2,
    approvalWorkflow: JSON.stringify({
      stages: ['academic_review', 'community_impact', 'final_approval'],
      requiredVotes: 2,
      requiredApprovalPercentage: 75
    })
  }).returning();

  const [defiCommittee] = await db.insert(committees).values({
    name: 'DeFi Innovation Fund',
    description: 'Supporting decentralized finance protocols, yield farming, and financial primitives',
    focusAreas: JSON.stringify(['DeFi', 'Yield Farming', 'AMM', 'Lending Protocols', 'Financial Primitives']),
    websiteUrl: 'https://defi-grants.com',
    githubOrg: 'defi-innovation',
    walletAddress: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    isActive: true,
    votingThreshold: 2,
    approvalWorkflow: JSON.stringify({
      stages: ['financial_review', 'risk_assessment', 'final_approval'],
      requiredVotes: 2,
      requiredApprovalPercentage: 80
    })
  }).returning();

  const [gamingCommittee] = await db.insert(committees).values({
    name: 'Gaming & NFT Collective',
    description: 'Funding gaming projects, NFT marketplaces, and digital asset platforms',
    focusAreas: JSON.stringify(['Gaming', 'NFTs', 'Digital Assets', 'Marketplaces', 'Virtual Worlds']),
    websiteUrl: 'https://gaming-nft-grants.io',
    githubOrg: 'gaming-collective',
    walletAddress: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
      isActive: true,
      votingThreshold: 2,
      approvalWorkflow: JSON.stringify({
      stages: ['concept_review', 'technical_review', 'market_assessment'],
      requiredVotes: 2,
      requiredApprovalPercentage: 70
    })
  }).returning();

  const [sustainabilityCommittee] = await db.insert(committees).values({
    name: 'Sustainability & Green Tech Fund',
    description: 'Supporting environmental sustainability projects and green technology initiatives',
    focusAreas: JSON.stringify(['Sustainability', 'Green Tech', 'Carbon Credits', 'Environmental Impact']),
    websiteUrl: 'https://green-tech-fund.org',
    githubOrg: 'sustainability-fund',
    walletAddress: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
    isActive: false, // Inactive committee for testing
    votingThreshold: 3,
    approvalWorkflow: JSON.stringify({
      stages: ['environmental_review', 'impact_assessment', 'final_approval'],
      requiredVotes: 3,
      requiredApprovalPercentage: 85
    })
  }).returning();

  // ============================================================================
  // COMMITTEE CURATORS - Assign curators to committees
  // ============================================================================
  
  console.log('Creating committee curator relationships...');

  // Infrastructure Committee
  await db.insert(committeeCurators).values({
    committeeId: infraCommittee.id,
    userId: admin1.id,
    role: 'admin',
    permissions: JSON.stringify(['manage_curators', 'approve_submissions', 'configure_programs', 'manage_payouts']),
    isActive: true
  });

  await db.insert(committeeCurators).values({
    committeeId: infraCommittee.id,
    userId: curator1.id,
    role: 'curator',
    permissions: JSON.stringify(['review_submissions', 'vote_on_submissions', 'review_milestones']),
    isActive: true
  });

  await db.insert(committeeCurators).values({
    committeeId: infraCommittee.id,
    userId: curator2.id,
    role: 'curator',
    permissions: JSON.stringify(['review_submissions', 'vote_on_submissions', 'review_milestones']),
    isActive: true
  });

  // Research Committee
  await db.insert(committeeCurators).values({
    committeeId: researchCommittee.id,
    userId: admin2.id,
    role: 'admin',
    permissions: JSON.stringify(['manage_curators', 'approve_submissions', 'configure_programs']),
    isActive: true
  });

  await db.insert(committeeCurators).values({
    committeeId: researchCommittee.id,
    userId: curator3.id,
    role: 'curator',
    permissions: JSON.stringify(['review_submissions', 'vote_on_submissions']),
    isActive: true
  });

  // DeFi Committee
  await db.insert(committeeCurators).values({
    committeeId: defiCommittee.id,
    userId: curator1.id,
    role: 'admin',
    permissions: JSON.stringify(['manage_curators', 'approve_submissions', 'configure_programs']),
    isActive: true
  });

  await db.insert(committeeCurators).values({
    committeeId: defiCommittee.id,
    userId: curator4.id,
    role: 'curator',
    permissions: JSON.stringify(['review_submissions', 'vote_on_submissions']),
    isActive: true
  });

  // Gaming Committee
  await db.insert(committeeCurators).values({
    committeeId: gamingCommittee.id,
    userId: curator2.id,
    role: 'admin',
    permissions: JSON.stringify(['manage_curators', 'approve_submissions', 'configure_programs']),
    isActive: true
  });

  await db.insert(committeeCurators).values({
    committeeId: gamingCommittee.id,
    userId: curator3.id,
    role: 'curator',
    permissions: JSON.stringify(['review_submissions', 'vote_on_submissions']),
    isActive: true
  });

  // ============================================================================
  // GRANT PROGRAMS - Create varied programs per committee
  // ============================================================================
  
  console.log('Creating grant programs...');

  // Infrastructure Committee Programs
  const [infraCoreProgram] = await db.insert(grantPrograms).values({
    committeeId: infraCommittee.id,
    name: 'Core Infrastructure Development',
    description: 'Large grants for building essential infrastructure components and developer tools',
    fundingAmount: 100000,
      requirements: JSON.stringify({
      minExperience: '2 years',
      requiredSkills: ['Rust', 'Go', 'TypeScript', 'System Design'],
      teamSize: 'min 2 people',
      deliverables: ['Production-ready code', 'Comprehensive documentation', 'Test coverage >90%', 'Security audit']
      }),
      applicationTemplate: JSON.stringify({
        sections: [
          { title: 'Executive Summary', required: true, maxLength: 500 },
        { title: 'Technical Architecture', required: true, maxLength: 2000 },
        { title: 'Security Considerations', required: true, maxLength: 1000 },
          { title: 'Timeline & Milestones', required: true },
        { title: 'Team Experience', required: true, maxLength: 1500 }
      ]
    }),
    milestoneStructure: JSON.stringify({
      defaultMilestones: [
        { title: 'Architecture Design & Setup', percentage: 20, timeframe: '3 weeks' },
        { title: 'Core Development Phase 1', percentage: 30, timeframe: '6 weeks' },
        { title: 'Core Development Phase 2', percentage: 30, timeframe: '6 weeks' },
        { title: 'Testing & Security Audit', percentage: 15, timeframe: '3 weeks' },
        { title: 'Documentation & Deployment', percentage: 5, timeframe: '2 weeks' }
      ]
    }),
    isActive: true
  }).returning();

  const [infraToolsProgram] = await db.insert(grantPrograms).values({
    committeeId: infraCommittee.id,
    name: 'Developer Tools & Utilities',
    description: 'Medium grants for developer productivity tools, libraries, and utilities',
    fundingAmount: 50000,
    requirements: JSON.stringify({
      minExperience: '1 year',
      requiredSkills: ['JavaScript/TypeScript', 'React', 'Node.js'],
      deliverables: ['Working tool/library', 'Documentation', 'Examples', 'Community adoption plan']
    }),
    applicationTemplate: JSON.stringify({
      sections: [
        { title: 'Tool Overview', required: true, maxLength: 400 },
        { title: 'Developer Need Analysis', required: true, maxLength: 800 },
        { title: 'Implementation Plan', required: true, maxLength: 1000 },
        { title: 'Adoption Strategy', required: true, maxLength: 600 }
      ]
    }),
    milestoneStructure: JSON.stringify({
      defaultMilestones: [
        { title: 'Project Setup & Core Features', percentage: 40, timeframe: '4 weeks' },
        { title: 'Advanced Features & Polish', percentage: 35, timeframe: '3 weeks' },
        { title: 'Documentation & Examples', percentage: 15, timeframe: '2 weeks' },
        { title: 'Community Release & Support', percentage: 10, timeframe: '1 week' }
      ]
    }),
    isActive: true
  }).returning();

  // Research Committee Programs
  const [researchAcademicProgram] = await db.insert(grantPrograms).values({
    committeeId: researchCommittee.id,
    name: 'Academic Research Grants',
    description: 'Funding for academic research, white papers, and theoretical work',
    fundingAmount: 75000,
    requirements: JSON.stringify({
      minExperience: 'PhD or equivalent research experience',
      requiredSkills: ['Research Methodology', 'Academic Writing', 'Peer Review'],
      deliverables: ['Research paper', 'Peer review process', 'Conference presentation', 'Open source implementation']
    }),
    applicationTemplate: JSON.stringify({
      sections: [
        { title: 'Research Question & Hypothesis', required: true, maxLength: 600 },
        { title: 'Literature Review', required: true, maxLength: 1200 },
        { title: 'Methodology', required: true, maxLength: 1000 },
        { title: 'Expected Impact', required: true, maxLength: 500 },
        { title: 'Timeline & Deliverables', required: true }
        ]
      }),
      milestoneStructure: JSON.stringify({
        defaultMilestones: [
        { title: 'Research Design & Literature Review', percentage: 25, timeframe: '4 weeks' },
        { title: 'Data Collection & Analysis', percentage: 40, timeframe: '8 weeks' },
        { title: 'Paper Writing & Peer Review', percentage: 25, timeframe: '4 weeks' },
        { title: 'Publication & Presentation', percentage: 10, timeframe: '2 weeks' }
        ]
      }),
      isActive: true
  }).returning();

  const [educationProgram] = await db.insert(grantPrograms).values({
    committeeId: researchCommittee.id,
    name: 'Educational Content Creation',
    description: 'Creating tutorials, courses, and educational materials for the community',
      fundingAmount: 25000,
      requirements: JSON.stringify({
      minExperience: '6 months teaching/content creation',
      requiredSkills: ['Content Creation', 'Teaching', 'Video Production', 'Technical Writing'],
      deliverables: ['Video content', 'Written tutorials', 'Interactive examples', 'Community feedback integration']
    }),
    applicationTemplate: JSON.stringify({
      sections: [
        { title: 'Educational Goals', required: true, maxLength: 400 },
        { title: 'Content Outline', required: true, maxLength: 800 },
        { title: 'Teaching Methodology', required: true, maxLength: 600 },
        { title: 'Distribution Strategy', required: true, maxLength: 400 }
      ]
    }),
    milestoneStructure: JSON.stringify({
      defaultMilestones: [
        { title: 'Content Planning & Script Writing', percentage: 30, timeframe: '2 weeks' },
        { title: 'Content Production', percentage: 50, timeframe: '4 weeks' },
        { title: 'Review & Refinement', percentage: 15, timeframe: '1 week' },
        { title: 'Publication & Community Engagement', percentage: 5, timeframe: '1 week' }
      ]
    }),
    isActive: true
  }).returning();

  // DeFi Committee Programs
  const [defiProtocolProgram] = await db.insert(grantPrograms).values({
    committeeId: defiCommittee.id,
    name: 'DeFi Protocol Development',
    description: 'Building new DeFi protocols, AMMs, and financial primitives',
    fundingAmount: 150000,
    requirements: JSON.stringify({
      minExperience: '2 years DeFi development',
      requiredSkills: ['Solidity', 'Smart Contract Security', 'DeFi Protocols', 'Economic Modeling'],
      deliverables: ['Audited smart contracts', 'Frontend interface', 'Economic analysis', 'Deployment on mainnet']
    }),
    applicationTemplate: JSON.stringify({
      sections: [
        { title: 'Protocol Overview', required: true, maxLength: 600 },
        { title: 'Economic Model', required: true, maxLength: 1200 },
        { title: 'Technical Architecture', required: true, maxLength: 1500 },
        { title: 'Security Considerations', required: true, maxLength: 1000 },
        { title: 'Go-to-Market Strategy', required: true, maxLength: 800 }
      ]
    }),
    milestoneStructure: JSON.stringify({
      defaultMilestones: [
        { title: 'Smart Contract Development', percentage: 35, timeframe: '8 weeks' },
        { title: 'Security Audit & Testing', percentage: 25, timeframe: '4 weeks' },
        { title: 'Frontend Development', percentage: 25, timeframe: '6 weeks' },
        { title: 'Mainnet Deployment & Launch', percentage: 15, timeframe: '3 weeks' }
      ]
    }),
    isActive: true
  }).returning();

  // Gaming Committee Programs
  const [gamingPlatformProgram] = await db.insert(grantPrograms).values({
    committeeId: gamingCommittee.id,
    name: 'Gaming Platform Development',
    description: 'Building gaming platforms, NFT marketplaces, and virtual world infrastructure',
    fundingAmount: 80000,
    requirements: JSON.stringify({
      minExperience: '1.5 years game development',
      requiredSkills: ['Game Development', 'NFT Standards', 'Frontend Development', 'User Experience'],
      deliverables: ['Playable game/platform', 'NFT integration', 'User documentation', 'Community features']
      }),
      applicationTemplate: JSON.stringify({
        sections: [
        { title: 'Game/Platform Concept', required: true, maxLength: 500 },
        { title: 'Technical Implementation', required: true, maxLength: 1000 },
        { title: 'NFT Integration Strategy', required: true, maxLength: 800 },
        { title: 'User Experience Design', required: true, maxLength: 600 },
        { title: 'Community Building Plan', required: true, maxLength: 500 }
        ]
      }),
      milestoneStructure: JSON.stringify({
        defaultMilestones: [
        { title: 'Core Game Mechanics', percentage: 40, timeframe: '6 weeks' },
        { title: 'NFT Integration & Smart Contracts', percentage: 30, timeframe: '4 weeks' },
        { title: 'UI/UX Development', percentage: 20, timeframe: '3 weeks' },
        { title: 'Testing & Community Launch', percentage: 10, timeframe: '2 weeks' }
        ]
      }),
      isActive: true
  }).returning();

  // ============================================================================
  // SUBMISSIONS - Create submissions in various states
  // ============================================================================
  
  console.log('Creating grant submissions...');

  // APPROVED SUBMISSION with completed milestones
  const [approvedSubmission] = await db.insert(submissions).values({
    grantProgramId: infraCoreProgram.id,
    committeeId: infraCommittee.id,
    submitterId: grantee1.id,
    title: 'Next-Gen Developer SDK',
    description: 'A comprehensive SDK that simplifies blockchain development with TypeScript-first APIs, built-in testing utilities, and extensive documentation.',
    executiveSummary: 'This project aims to create the most developer-friendly SDK for blockchain development, reducing onboarding time from weeks to hours.',
    milestones: JSON.stringify([
      { title: 'Architecture Design', amount: 20000, dueDate: '2024-02-15' },
      { title: 'Core SDK Development', amount: 30000, dueDate: '2024-03-30' },
      { title: 'Testing & Documentation', amount: 25000, dueDate: '2024-04-30' },
      { title: 'Production Release', amount: 25000, dueDate: '2024-05-15' }
    ]),
    postGrantPlan: 'Continue maintaining the SDK, add enterprise features, and grow the developer community.',
    labels: JSON.stringify(['SDK', 'Developer Tools', 'TypeScript', 'Documentation']),
    githubRepoUrl: 'https://github.com/john-dev/next-gen-sdk',
    walletAddress: grantee1.walletAddress,
    status: 'approved',
    totalAmount: 100000,
    appliedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  }).returning();

  // UNDER REVIEW SUBMISSION
  const [underReviewSubmission] = await db.insert(submissions).values({
    grantProgramId: researchAcademicProgram.id,
    committeeId: researchCommittee.id,
    submitterId: grantee3.id,
    title: 'Scalability Research: Layer 2 Solutions Comparative Analysis',
    description: 'Comprehensive research comparing different Layer 2 scaling solutions, analyzing performance, security, and adoption metrics.',
    executiveSummary: 'This research will provide the community with data-driven insights into the most effective Layer 2 solutions for different use cases.',
    milestones: JSON.stringify([
      { title: 'Data Collection Framework', amount: 18750, dueDate: '2024-03-01' },
      { title: 'Performance Analysis', amount: 30000, dueDate: '2024-04-15' },
      { title: 'Security Assessment', amount: 18750, dueDate: '2024-05-01' },
      { title: 'Final Report & Presentation', amount: 7500, dueDate: '2024-05-15' }
    ]),
    postGrantPlan: 'Publish findings in peer-reviewed journals and present at major blockchain conferences.',
    labels: JSON.stringify(['Research', 'Layer 2', 'Scalability', 'Analysis']),
    githubRepoUrl: 'https://github.com/bob-research/l2-research',
    walletAddress: grantee3.walletAddress,
    status: 'under_review',
    totalAmount: 75000,
    appliedAt: new Date('2024-01-25'),
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-30')
  }).returning();

  // PENDING SUBMISSION (just submitted)
  const [pendingSubmission] = await db.insert(submissions).values({
    grantProgramId: defiProtocolProgram.id,
    committeeId: defiCommittee.id,
    submitterId: grantee4.id,
    title: 'Decentralized Yield Optimization Protocol',
    description: 'An automated yield farming protocol that optimizes returns across multiple DeFi platforms while minimizing gas costs and impermanent loss.',
    executiveSummary: 'This protocol will democratize advanced yield farming strategies, making them accessible to all users regardless of portfolio size.',
    milestones: JSON.stringify([
      { title: 'Smart Contract Development', amount: 52500, dueDate: '2024-04-01' },
      { title: 'Security Audit', amount: 37500, dueDate: '2024-05-01' },
      { title: 'Frontend Development', amount: 37500, dueDate: '2024-05-15' },
      { title: 'Mainnet Launch', amount: 22500, dueDate: '2024-06-01' }
    ]),
    postGrantPlan: 'Expand to more DeFi protocols, add advanced analytics, and implement DAO governance.',
    labels: JSON.stringify(['DeFi', 'Yield Farming', 'Automation', 'Smart Contracts']),
    githubRepoUrl: 'https://github.com/alice-innovate/yield-optimizer',
    walletAddress: grantee4.walletAddress,
    status: 'pending',
    totalAmount: 150000,
    appliedAt: new Date('2024-02-05'),
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05')
  }).returning();

  // REJECTED SUBMISSION
  const [rejectedSubmission] = await db.insert(submissions).values({
    grantProgramId: gamingPlatformProgram.id,
    committeeId: gamingCommittee.id,
    submitterId: grantee5.id,
    title: 'Basic NFT Trading Card Game',
    description: 'A simple trading card game using NFTs with basic battle mechanics.',
    executiveSummary: 'Create a trading card game where players can collect, trade, and battle with NFT cards.',
    milestones: JSON.stringify([
      { title: 'Card Design', amount: 20000, dueDate: '2024-03-15' },
      { title: 'Game Development', amount: 40000, dueDate: '2024-04-30' },
      { title: 'NFT Integration', amount: 15000, dueDate: '2024-05-15' },
      { title: 'Launch', amount: 5000, dueDate: '2024-06-01' }
    ]),
    postGrantPlan: 'Add more cards and game modes.',
    labels: JSON.stringify(['Gaming', 'NFT', 'Trading Cards']),
    githubRepoUrl: 'https://github.com/charlie-protocol/nft-cards',
    walletAddress: grantee5.walletAddress,
    status: 'rejected',
    totalAmount: 80000,
    appliedAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-22')
  }).returning();

  // ANOTHER PENDING SUBMISSION for different committee
  const [pendingEducationSubmission] = await db.insert(submissions).values({
    grantProgramId: educationProgram.id,
    committeeId: researchCommittee.id,
    submitterId: grantee2.id,
    title: 'Interactive Blockchain Development Course',
    description: 'A comprehensive video course series teaching blockchain development from basics to advanced topics with hands-on coding exercises.',
    executiveSummary: 'Bridge the knowledge gap in blockchain development education with practical, hands-on learning materials.',
    milestones: JSON.stringify([
      { title: 'Course Outline & Scripts', amount: 7500, dueDate: '2024-03-01' },
      { title: 'Video Production', amount: 12500, dueDate: '2024-04-15' },
      { title: 'Interactive Exercises', amount: 3750, dueDate: '2024-05-01' },
      { title: 'Course Launch & Marketing', amount: 1250, dueDate: '2024-05-15' }
    ]),
    postGrantPlan: 'Create advanced courses and build a learning platform.',
    labels: JSON.stringify(['Education', 'Video Course', 'Blockchain', 'Tutorial']),
    githubRepoUrl: 'https://github.com/jane-builder/blockchain-course',
    walletAddress: grantee2.walletAddress,
    status: 'pending',
    totalAmount: 25000,
    appliedAt: new Date('2024-02-01'),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  }).returning();

  // ============================================================================
  // DISCUSSIONS - Create discussion threads for submissions
  // ============================================================================
  
  console.log('Creating discussions...');

  const [approvedDiscussion] = await db.insert(discussions).values({
    submissionId: approvedSubmission.id,
    committeeId: infraCommittee.id,
    type: 'submission',
    isPublic: true
  }).returning();

  const [reviewDiscussion] = await db.insert(discussions).values({
    submissionId: underReviewSubmission.id,
    committeeId: researchCommittee.id,
    type: 'submission',
    isPublic: true
  }).returning();

  const [pendingDiscussion] = await db.insert(discussions).values({
    submissionId: pendingSubmission.id,
    committeeId: defiCommittee.id,
    type: 'submission',
    isPublic: true
  }).returning();

  const [rejectedDiscussion] = await db.insert(discussions).values({
    submissionId: rejectedSubmission.id,
    committeeId: gamingCommittee.id,
    type: 'submission',
    isPublic: true
  }).returning();

  const [educationDiscussion] = await db.insert(discussions).values({
    submissionId: pendingEducationSubmission.id,
    committeeId: researchCommittee.id,
    type: 'submission',
    isPublic: true
  }).returning();

  // ============================================================================
  // MESSAGES - Add discussion messages
  // ============================================================================
  
  console.log('Creating discussion messages...');

  // Messages for approved submission
  await db.insert(messages).values([
    {
      discussionId: approvedDiscussion.id,
      authorId: curator1.id,
      content: 'This looks like a very promising project. The technical approach is sound and the team has strong experience.',
      messageType: 'comment',
      createdAt: new Date('2024-01-16T10:00:00Z')
    },
    {
      discussionId: approvedDiscussion.id,
      authorId: curator2.id,
      content: 'I agree. The SDK could really help onboard new developers. The documentation plan is particularly impressive.',
      messageType: 'comment',
      createdAt: new Date('2024-01-16T14:30:00Z')
    },
    {
      discussionId: approvedDiscussion.id,
      authorId: admin1.id,
      content: 'Submission approved! Looking forward to seeing the first milestone.',
      messageType: 'status_change',
      metadata: JSON.stringify({ newStatus: 'approved', oldStatus: 'under_review' }),
      createdAt: new Date('2024-01-20T09:00:00Z')
    }
  ]);

  // Messages for under review submission
  await db.insert(messages).values([
    {
      discussionId: reviewDiscussion.id,
      authorId: curator3.id,
      content: 'The research methodology looks solid. Could you provide more details on the data collection framework?',
      messageType: 'comment',
      createdAt: new Date('2024-01-26T11:00:00Z')
    },
    {
      discussionId: reviewDiscussion.id,
      authorId: grantee3.id,
      content: 'Thanks for the feedback! I\'ll add more details about the data collection in the updated proposal.',
      messageType: 'comment',
      createdAt: new Date('2024-01-26T15:45:00Z')
    },
    {
      discussionId: reviewDiscussion.id,
      authorId: admin2.id,
      content: 'The research scope is comprehensive. We need one more curator review before approval.',
      messageType: 'comment',
      createdAt: new Date('2024-01-30T13:20:00Z')
    }
  ]);

  // Messages for rejected submission
  await db.insert(messages).values([
    {
      discussionId: rejectedDiscussion.id,
      authorId: curator2.id,
      content: 'While the concept is interesting, the technical implementation plan lacks depth. The game mechanics are too basic for the requested funding amount.',
      messageType: 'comment',
      createdAt: new Date('2024-01-12T09:15:00Z')
    },
    {
      discussionId: rejectedDiscussion.id,
      authorId: curator3.id,
      content: 'I agree with the previous assessment. The proposal would benefit from more innovative gameplay mechanics and a stronger technical architecture.',
      messageType: 'comment',
      createdAt: new Date('2024-01-15T14:00:00Z')
    },
    {
      discussionId: rejectedDiscussion.id,
      authorId: curator2.id,
      content: 'Unfortunately, we cannot approve this proposal in its current form. Please consider resubmitting with a more detailed technical plan.',
      messageType: 'status_change',
      metadata: JSON.stringify({ newStatus: 'rejected', oldStatus: 'under_review', reason: 'Insufficient technical detail and innovation' }),
      createdAt: new Date('2024-01-22T10:30:00Z')
    }
  ]);

  // ============================================================================
  // REVIEWS - Create curator reviews/votes
  // ============================================================================
  
  console.log('Creating reviews...');

  // Reviews for approved submission
  await db.insert(reviews).values([
    {
      submissionId: approvedSubmission.id,
      committeeId: infraCommittee.id,
      curatorId: curator1.id,
      discussionId: approvedDiscussion.id,
      vote: 'approve',
      feedback: 'Excellent technical approach and clear deliverables. Team has proven track record.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-17T10:00:00Z')
    },
    {
      submissionId: approvedSubmission.id,
      committeeId: infraCommittee.id,
      curatorId: curator2.id,
      discussionId: approvedDiscussion.id,
      vote: 'approve',
      feedback: 'Strong proposal with clear community impact. Documentation plan is comprehensive.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-18T14:30:00Z')
    },
    {
      submissionId: approvedSubmission.id,
      committeeId: infraCommittee.id,
      curatorId: admin1.id,
      discussionId: approvedDiscussion.id,
      vote: 'approve',
      feedback: 'Final approval. All criteria met.',
      reviewType: 'final',
      weight: 2,
      isBinding: true,
      createdAt: new Date('2024-01-20T09:00:00Z')
    }
  ]);

  // Reviews for under review submission (partial votes)
  await db.insert(reviews).values([
    {
      submissionId: underReviewSubmission.id,
      committeeId: researchCommittee.id,
      curatorId: curator3.id,
      discussionId: reviewDiscussion.id,
      vote: 'approve',
      feedback: 'Research methodology is sound and will provide valuable insights to the community.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-28T11:00:00Z')
    }
  ]);

  // Reviews for rejected submission
  await db.insert(reviews).values([
    {
      submissionId: rejectedSubmission.id,
      committeeId: gamingCommittee.id,
      curatorId: curator2.id,
      discussionId: rejectedDiscussion.id,
      vote: 'reject',
      feedback: 'Technical implementation plan lacks sufficient depth and innovation for the requested funding amount.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-18T09:15:00Z')
    },
    {
      submissionId: rejectedSubmission.id,
      committeeId: gamingCommittee.id,
      curatorId: curator3.id,
      discussionId: rejectedDiscussion.id,
      vote: 'reject',
      feedback: 'Proposal needs more innovative gameplay mechanics and detailed technical architecture.',
      reviewType: 'standard',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-01-20T14:00:00Z')
    }
  ]);

  // ============================================================================
  // MILESTONES - Create milestones for approved submission
  // ============================================================================
  
  console.log('Creating milestones...');

  const [milestone1] = await db.insert(milestones).values({
    submissionId: approvedSubmission.id,
    committeeId: infraCommittee.id,
    title: 'Architecture Design & Setup',
    description: 'Complete system architecture design, development environment setup, and initial project structure.',
    requirements: JSON.stringify(['Architecture documentation', 'Development environment', 'Project scaffolding', 'CI/CD pipeline']),
    amount: 20000,
    dueDate: new Date('2024-02-15'),
    status: 'completed',
    deliverables: JSON.stringify(['System architecture document', 'Development setup guide', 'Initial codebase', 'CI/CD configuration']),
    githubRepoUrl: 'https://github.com/john-dev/next-gen-sdk',
    githubCommitHash: 'abc123def456',
    codeAnalysis: JSON.stringify({ 
      filesChanged: 25, 
      linesAdded: 1250, 
      testCoverage: 85,
      components: ['Core architecture', 'Build system', 'Testing framework']
    }),
    submittedAt: new Date('2024-02-10T10:00:00Z'),
    reviewedAt: new Date('2024-02-12T14:30:00Z'),
    createdAt: new Date('2024-01-20T09:00:00Z'),
    updatedAt: new Date('2024-02-12T14:30:00Z')
  }).returning();

  const [milestone2] = await db.insert(milestones).values({
    submissionId: approvedSubmission.id,
    committeeId: infraCommittee.id,
    title: 'Core SDK Development',
    description: 'Implement core SDK functionality including API wrappers, utilities, and developer tools.',
    requirements: JSON.stringify(['Core API implementation', 'Utility functions', 'Developer tools', 'Initial testing']),
    amount: 30000,
    dueDate: new Date('2024-03-30'),
    status: 'in_progress',
    deliverables: JSON.stringify(['Core SDK modules', 'API wrappers', 'Utility libraries', 'Test suite']),
    githubRepoUrl: 'https://github.com/john-dev/next-gen-sdk',
    createdAt: new Date('2024-01-20T09:00:00Z'),
    updatedAt: new Date('2024-02-15T09:00:00Z')
  }).returning();

  const [milestone3] = await db.insert(milestones).values({
    submissionId: approvedSubmission.id,
    committeeId: infraCommittee.id,
    title: 'Testing & Documentation',
    description: 'Comprehensive testing coverage and detailed documentation with examples.',
    requirements: JSON.stringify(['Test coverage >90%', 'API documentation', 'Usage examples', 'Tutorial guides']),
    amount: 25000,
    dueDate: new Date('2024-04-30'),
    status: 'pending',
    deliverables: JSON.stringify(['Test suite', 'API documentation', 'Example projects', 'Tutorial content']),
    githubRepoUrl: 'https://github.com/john-dev/next-gen-sdk',
    createdAt: new Date('2024-01-20T09:00:00Z')
  }).returning();

  const [milestone4] = await db.insert(milestones).values({
    submissionId: approvedSubmission.id,
    committeeId: infraCommittee.id,
    title: 'Production Release',
    description: 'Final production release with package publishing and community announcement.',
    requirements: JSON.stringify(['Production build', 'Package publishing', 'Release announcement', 'Community support']),
    amount: 25000,
    dueDate: new Date('2024-05-15'),
    status: 'pending',
    deliverables: JSON.stringify(['Production release', 'npm package', 'Release notes', 'Community launch']),
    githubRepoUrl: 'https://github.com/john-dev/next-gen-sdk',
    createdAt: new Date('2024-01-20T09:00:00Z')
  }).returning();

  // ============================================================================
  // MILESTONE DISCUSSIONS - Create discussions for milestones
  // ============================================================================
  
  const [milestone1Discussion] = await db.insert(discussions).values({
    submissionId: approvedSubmission.id,
    milestoneId: milestone1.id,
    committeeId: infraCommittee.id,
    type: 'milestone',
    isPublic: true
  }).returning();

  const [milestone2Discussion] = await db.insert(discussions).values({
    submissionId: approvedSubmission.id,
    milestoneId: milestone2.id,
    committeeId: infraCommittee.id,
    type: 'milestone',
    isPublic: true
  }).returning();

  // ============================================================================
  // MILESTONE MESSAGES
  // ============================================================================
  
  await db.insert(messages).values([
    {
      discussionId: milestone1Discussion.id,
      authorId: grantee1.id,
      content: 'Milestone 1 completed! The architecture is designed with modularity in mind and includes comprehensive testing setup.',
      messageType: 'comment',
      createdAt: new Date('2024-02-10T10:00:00Z')
    },
    {
      discussionId: milestone1Discussion.id,
      authorId: curator1.id,
      content: 'Excellent work! The architecture documentation is very thorough. Approving this milestone.',
      messageType: 'comment',
      createdAt: new Date('2024-02-11T15:30:00Z')
    },
    {
      discussionId: milestone2Discussion.id,
      authorId: grantee1.id,
      content: 'Core development is progressing well. About 70% complete with the main API wrappers implemented.',
      messageType: 'comment',
      createdAt: new Date('2024-03-15T14:00:00Z')
    }
  ]);

  // ============================================================================
  // MILESTONE REVIEWS
  // ============================================================================
  
  await db.insert(reviews).values([
    {
      submissionId: approvedSubmission.id,
      milestoneId: milestone1.id,
      committeeId: infraCommittee.id,
      curatorId: curator1.id,
      discussionId: milestone1Discussion.id,
      vote: 'approve',
      feedback: 'Architecture is well-designed and documentation is comprehensive. Excellent foundation for the project.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-11T15:30:00Z')
    },
    {
      submissionId: approvedSubmission.id,
      milestoneId: milestone1.id,
      committeeId: infraCommittee.id,
      curatorId: curator2.id,
      discussionId: milestone1Discussion.id,
      vote: 'approve',
      feedback: 'Great start! The CI/CD setup will help maintain code quality throughout development.',
      reviewType: 'milestone',
      weight: 1,
      isBinding: false,
      createdAt: new Date('2024-02-12T09:00:00Z')
    }
  ]);

  // ============================================================================
  // PAYOUTS - Create some completed and pending payouts
  // ============================================================================
  
  console.log('Creating payouts...');

  // Completed payout for milestone 1
  await db.insert(payouts).values({
    submissionId: approvedSubmission.id,
    milestoneId: milestone1.id,
    committeeId: infraCommittee.id,
    amount: 20000,
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    blockExplorerUrl: 'https://etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    status: 'completed',
    triggeredBy: admin1.id,
    approvedBy: admin1.id,
    walletFrom: infraCommittee.walletAddress,
    walletTo: grantee1.walletAddress,
    createdAt: new Date('2024-02-12T16:00:00Z'),
    processedAt: new Date('2024-02-12T16:15:00Z')
  });

  // Pending payout (milestone 2 not yet completed)
  await db.insert(payouts).values({
    submissionId: approvedSubmission.id,
    milestoneId: milestone2.id,
    committeeId: infraCommittee.id,
    amount: 30000,
    status: 'pending',
    triggeredBy: grantee1.id,
    walletFrom: infraCommittee.walletAddress,
    walletTo: grantee1.walletAddress,
    createdAt: new Date('2024-03-15T14:30:00Z')
  });

  // ============================================================================
  // NOTIFICATIONS - Create some test notifications
  // ============================================================================
  
  console.log('Creating notifications...');

  await db.insert(notifications).values([
    {
      userId: grantee1.id,
      committeeId: infraCommittee.id,
      type: 'submission_approved',
      submissionId: approvedSubmission.id,
      discussionId: approvedDiscussion.id,
      read: true,
      content: 'Your submission "Next-Gen Developer SDK" has been approved!',
      priority: 'high',
      createdAt: new Date('2024-01-20T09:00:00Z'),
      readAt: new Date('2024-01-20T10:30:00Z')
    },
    {
      userId: grantee1.id,
      committeeId: infraCommittee.id,
      type: 'milestone_approved',
      submissionId: approvedSubmission.id,
      milestoneId: milestone1.id,
      read: false,
      content: 'Milestone "Architecture Design & Setup" has been approved and payout processed.',
      priority: 'high',
      createdAt: new Date('2024-02-12T16:15:00Z')
    },
    {
      userId: grantee3.id,
      committeeId: researchCommittee.id,
      type: 'review_feedback',
      submissionId: underReviewSubmission.id,
      discussionId: reviewDiscussion.id,
      read: false,
      content: 'New feedback on your submission "Scalability Research: Layer 2 Solutions Comparative Analysis"',
      priority: 'normal',
      createdAt: new Date('2024-01-30T13:20:00Z')
    },
    {
      userId: curator1.id,
      committeeId: infraCommittee.id,
      type: 'new_submission',
      submissionId: pendingSubmission.id,
      read: true,
      content: 'New submission requiring review: "Decentralized Yield Optimization Protocol"',
      priority: 'normal',
      createdAt: new Date('2024-02-05T10:00:00Z'),
      readAt: new Date('2024-02-05T11:15:00Z')
    },
    {
      userId: grantee5.id,
      committeeId: gamingCommittee.id,
      type: 'submission_rejected',
      submissionId: rejectedSubmission.id,
      discussionId: rejectedDiscussion.id,
      read: false,
      content: 'Your submission "Basic NFT Trading Card Game" was not approved. Please see feedback for details.',
      priority: 'high',
      createdAt: new Date('2024-01-22T10:30:00Z')
    }
  ]);

  // ============================================================================
  // SUCCESS MESSAGE
  // ============================================================================
  
  console.log('✅ Comprehensive database seeding completed successfully!');
  console.log('\n=== SUMMARY ===');
  console.log(`🏛️  Created ${5} committees:`);
  console.log('   • Infrastructure Development Foundation (active)');
  console.log('   • Research & Education Grant Committee (active)');
  console.log('   • DeFi Innovation Fund (active)');
  console.log('   • Gaming & NFT Collective (active)');
  console.log('   • Sustainability & Green Tech Fund (inactive)');
  
  console.log(`\n👥 Created ${9} users:`);
  console.log('   • 2 admins (admin@grantflow.com, admin2@grantflow.com)');
  console.log('   • 4 curators (curator1-4@test.com)');
  console.log('   • 5 grantees (grantee1-5@test.com)');
  console.log('   • All passwords: admin123, curator123, grantee123 respectively');
  
  console.log(`\n💼 Created ${6} grant programs across committees`);
  console.log('   • Infrastructure: Core Development ($100K), Tools ($50K)');
  console.log('   • Research: Academic Research ($75K), Education ($25K)');
  console.log('   • DeFi: Protocol Development ($150K)');
  console.log('   • Gaming: Platform Development ($80K)');
  
  console.log(`\n📋 Created ${5} submissions in various states:`);
  console.log('   • 1 APPROVED (with milestones and payouts)');
  console.log('   • 1 UNDER_REVIEW (partial curator votes)');
  console.log('   • 2 PENDING (just submitted)');
  console.log('   • 1 REJECTED (with feedback)');
  
  console.log(`\n🎯 Created ${4} milestones for approved submission:`);
  console.log('   • 1 COMPLETED (with payout)');
  console.log('   • 1 IN_PROGRESS');
  console.log('   • 2 PENDING');
  
  console.log(`\n💬 Created active discussions with messages and reviews`);
  console.log(`💰 Created example payouts (completed and pending)`);
  console.log(`🔔 Created test notifications for various scenarios`);
  
  console.log('\n🧪 TEST SCENARIOS AVAILABLE:');
  console.log('✅ Committee setup and management');
  console.log('✅ Multi-committee submissions');
  console.log('✅ Submission approval workflows');
  console.log('✅ Milestone tracking and completion');
  console.log('✅ Curator voting and reviews');
  console.log('✅ Discussion threads and messaging');
  console.log('✅ Payout processing');
  console.log('✅ Notification system');
  console.log('✅ Cross-committee comparisons');
  console.log('✅ Different user roles and permissions\n');
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
