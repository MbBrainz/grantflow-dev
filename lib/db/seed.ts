import { drizzle } from 'drizzle-orm/postgres-js';
import { 
  users, 
  committees, 
  committeeCurators, 
  grantPrograms 
} from './schema';
import { config } from 'dotenv';
import postgres from 'postgres';
import { hashPassword } from '@/lib/auth/session';

config({ path: '.env.local' });

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  // Create admin user
  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "admin",
        name: "Admin User"
      },
    ])
    .returning();

  console.log('Admin user created.');

  // Create a curator user for testing voting functionality
  const curatorEmail = 'curator@test.com';
  const curatorPassword = 'curator123';
  const curatorPasswordHash = await hashPassword(curatorPassword);

  const [curator] = await db
    .insert(users)
    .values([
      {
        email: curatorEmail,
        passwordHash: curatorPasswordHash,
        role: "curator",
        name: "Test Curator"
      },
    ])
    .returning();

  console.log('Curator user created:', curatorEmail);

  // Create a test committee
  const [committee] = await db
    .insert(committees)
    .values({
      name: 'Test Grant Committee',
      description: 'A test committee for MVP development and testing',
      focusAreas: JSON.stringify(['Development', 'Infrastructure', 'Education']),
      websiteUrl: 'https://testcommittee.example.com',
      githubOrg: 'test-committee',
      walletAddress: '0x1234567890123456789012345678901234567890',
      isActive: true,
      votingThreshold: 2,
      approvalWorkflow: JSON.stringify({
        stages: ['initial_review', 'technical_review', 'final_approval'],
        requiredVotes: 2
      })
    })
    .returning();

  console.log('Test committee created:', committee.name);

  // Add admin as committee admin
  await db.insert(committeeCurators).values({
    committeeId: committee.id,
    userId: user.id,
    role: 'admin',
    permissions: JSON.stringify(['manage_curators', 'approve_submissions', 'configure_programs']),
    isActive: true
  });

  // Add curator to the committee
  await db.insert(committeeCurators).values({
    committeeId: committee.id,
    userId: curator.id,
    role: 'curator',
    permissions: JSON.stringify(['review_submissions', 'vote_on_submissions']),
    isActive: true
  });

  console.log('Committee curators added.');

  // Create test grant programs
  const [program1] = await db
    .insert(grantPrograms)
    .values({
      committeeId: committee.id,
      name: 'Infrastructure Development Grant',
      description: 'Grants for building core infrastructure and developer tools',
      fundingAmount: 50000,
      requirements: JSON.stringify({
        minExperience: '6 months',
        requiredSkills: ['JavaScript', 'TypeScript', 'React'],
        deliverables: ['Working prototype', 'Documentation', 'Test coverage']
      }),
      applicationTemplate: JSON.stringify({
        sections: [
          { title: 'Executive Summary', required: true, maxLength: 500 },
          { title: 'Technical Approach', required: true, maxLength: 1000 },
          { title: 'Timeline & Milestones', required: true },
          { title: 'Team Background', required: true, maxLength: 800 }
        ]
      }),
      milestoneStructure: JSON.stringify({
        defaultMilestones: [
          { title: 'Project Setup & Planning', percentage: 20, timeframe: '2 weeks' },
          { title: 'Core Development', percentage: 50, timeframe: '6 weeks' },
          { title: 'Testing & Documentation', percentage: 20, timeframe: '2 weeks' },
          { title: 'Final Delivery & Deployment', percentage: 10, timeframe: '1 week' }
        ]
      }),
      isActive: true
    })
    .returning();

  const [program2] = await db
    .insert(grantPrograms)
    .values({
      committeeId: committee.id,
      name: 'Education & Research Grant',
      description: 'Grants for educational content, research, and community building',
      fundingAmount: 25000,
      requirements: JSON.stringify({
        minExperience: '3 months',
        requiredSkills: ['Writing', 'Research', 'Community Management'],
        deliverables: ['Educational content', 'Community engagement', 'Research findings']
      }),
      applicationTemplate: JSON.stringify({
        sections: [
          { title: 'Project Overview', required: true, maxLength: 400 },
          { title: 'Educational Impact', required: true, maxLength: 600 },
          { title: 'Community Engagement Plan', required: true, maxLength: 500 },
          { title: 'Research Methodology', required: false, maxLength: 800 }
        ]
      }),
      milestoneStructure: JSON.stringify({
        defaultMilestones: [
          { title: 'Research & Planning', percentage: 30, timeframe: '3 weeks' },
          { title: 'Content Creation', percentage: 40, timeframe: '5 weeks' },
          { title: 'Community Engagement', percentage: 20, timeframe: '2 weeks' },
          { title: 'Final Review & Publication', percentage: 10, timeframe: '1 week' }
        ]
      }),
      isActive: true
    })
    .returning();

  console.log('Grant programs created:', program1.name, '&', program2.name);

  console.log('Seed data created successfully.');
  console.log('Admin user:', email, '/ password:', password);
  console.log('Curator user:', curatorEmail, '/ password:', curatorPassword);
  console.log('Committee:', committee.name, '(ID:', committee.id, ')');
  console.log('Grant Programs:', program1.name, '(ID:', program1.id, ')', program2.name, '(ID:', program2.id, ')');
}

seed()
  .catch((error) => {
    console.error('Seed failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
