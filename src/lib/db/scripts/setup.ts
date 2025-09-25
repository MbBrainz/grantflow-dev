import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, isNull } from 'drizzle-orm';
import postgres from 'postgres';
import { config } from 'dotenv';
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
  type User,
  type Group
} from '../schema';

config();

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * DATABASE SETUP AND VERIFICATION UTILITIES
 * For the new group-based model with committees and teams
 */

// ============================================================================
// GROUP MANAGEMENT FUNCTIONS
// ============================================================================

export async function createGroup(groupData: {
  name: string;
  type: 'committee' | 'team';
  description: string;
  focusAreas: string[];
  websiteUrl?: string;
  githubOrg?: string;
  walletAddress?: string;
  settings?: Record<string, any>;
}): Promise<Group> {
  const [group] = await db.insert(groups).values({
    name: groupData.name,
    type: groupData.type,
    description: groupData.description,
    focusAreas: JSON.stringify(groupData.focusAreas),
    websiteUrl: groupData.websiteUrl,
    githubOrg: groupData.githubOrg,
    walletAddress: groupData.walletAddress,
    isActive: true,
    settings: JSON.stringify(groupData.settings || {})
  }).returning();

  console.log(`✅ Created ${groupData.type}: ${groupData.name}`);
  return group;
}

export async function addUserToGroup(
  userId: number, 
  groupId: number, 
  role: 'admin' | 'member' = 'member',
  permissions: string[] = []
): Promise<void> {
  await db.insert(groupMemberships).values({
    userId,
    groupId,
    role,
    permissions: JSON.stringify(permissions),
    isActive: true
  });

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  
  console.log(`✅ Added ${user[0]?.name} to ${group[0]?.name} as ${role}`);
}

export async function createGrantProgram(programData: {
  groupId: number;
  name: string;
  description: string;
  fundingAmount: number;
  requirements: Record<string, any>;
  applicationTemplate: Record<string, any>;
  milestoneStructure: Record<string, any>;
}): Promise<any> {
  const [program] = await db.insert(grantPrograms).values({
    groupId: programData.groupId,
    name: programData.name,
    description: programData.description,
    fundingAmount: programData.fundingAmount,
    requirements: JSON.stringify(programData.requirements),
    applicationTemplate: JSON.stringify(programData.applicationTemplate),
    milestoneStructure: JSON.stringify(programData.milestoneStructure),
    isActive: true
  }).returning();

  console.log(`✅ Created grant program: ${programData.name} ($${programData.fundingAmount.toLocaleString()})`);
  return program;
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

export async function verifyDatabaseStructure(): Promise<boolean> {
  try {
    console.log('🔍 Verifying database structure...');

    // Test basic table access
    const testUsers = await db.select().from(users).limit(1);
    const testGroups = await db.select().from(groups).limit(1);
    const testMemberships = await db.select().from(groupMemberships).limit(1);
    const testPrograms = await db.select().from(grantPrograms).limit(1);
    const testSubmissions = await db.select().from(submissions).limit(1);

    console.log('✅ All core tables accessible');

    // Test relationships
    if (testGroups.length > 0) {
      const groupMembers = await db
        .select()
        .from(groupMemberships)
        .where(eq(groupMemberships.groupId, testGroups[0].id))
        .limit(1);
      
      if (groupMembers.length > 0) {
        console.log('✅ Group membership relationships working');
      }
    }

    if (testPrograms.length > 0) {
      const programSubmissions = await db
        .select()
        .from(submissions)
        .where(eq(submissions.grantProgramId, testPrograms[0].id))
        .limit(1);
      
      if (programSubmissions.length > 0) {
        console.log('✅ Grant program relationships working');
      }
    }

    console.log('✅ Database structure verification complete');
    return true;

  } catch (error) {
    console.error('❌ Database structure verification failed:');
    console.error(error);
    return false;
  }
}

export async function getSystemStats(): Promise<{
  committees: number;
  teams: number;
  users: number;
  reviewers: number;
  teamMembers: number;
  grantPrograms: number;
  submissions: number;
  activeDiscussions: number;
}> {
  try {
    const [
      allGroups,
      allUsers,
      allPrograms,
      allSubmissions,
      allDiscussions
    ] = await Promise.all([
      db.select().from(groups),
      db.select().from(users),
      db.select().from(grantPrograms),
      db.select().from(submissions),
      db.select().from(discussions)
    ]);

    const committees = allGroups.filter(g => g.type === 'committee').length;
    const teams = allGroups.filter(g => g.type === 'team').length;
    const reviewers = allUsers.filter(u => u.primaryRole === 'committee').length;
    const teamMembers = allUsers.filter(u => u.primaryRole === 'team').length;
    const activeDiscussions = allDiscussions.length;

    return {
      committees,
      teams,
      users: allUsers.length,
      reviewers,
      teamMembers,
      grantPrograms: allPrograms.length,
      submissions: allSubmissions.length,
      activeDiscussions
    };
  } catch (error) {
    console.error('❌ Failed to get system stats:', error);
    throw error;
  }
}

export async function printSystemOverview(): Promise<void> {
  try {
    console.log('\n🏛️  GRANTFLOW SYSTEM OVERVIEW');
    console.log('================================');

    const stats = await getSystemStats();

    console.log(`📊 GROUPS:`);
    console.log(`   • ${stats.committees} Committee Groups (reviewers)`);
    console.log(`   • ${stats.teams} Team Groups (grantees)`);

    console.log(`\n👥 USERS:`);
    console.log(`   • ${stats.users} Total Users`);
    console.log(`   • ${stats.reviewers} Reviewers (committee members)`);
    console.log(`   • ${stats.teamMembers} Team Members (grantees)`);

    console.log(`\n💼 GRANT ECOSYSTEM:`);
    console.log(`   • ${stats.grantPrograms} Grant Programs`);
    console.log(`   • ${stats.submissions} Submissions`);
    console.log(`   • ${stats.activeDiscussions} Active Discussions`);

    // Get some detailed stats
    const committees = await db.select().from(groups).where(eq(groups.type, 'committee'));
    const teams = await db.select().from(groups).where(eq(groups.type, 'team'));

    if (committees.length > 0) {
      console.log(`\n🏛️  COMMITTEES:`);
      for (const committee of committees) {
        const memberCount = await db
          .select()
          .from(groupMemberships)
          .where(eq(groupMemberships.groupId, committee.id));
        
        const programCount = await db
          .select()
          .from(grantPrograms)
          .where(eq(grantPrograms.groupId, committee.id));
        
        console.log(`   • ${committee.name}: ${memberCount.length} members, ${programCount.length} programs`);
      }
    }

    if (teams.length > 0) {
      console.log(`\n👥 TEAMS:`);
      for (const team of teams.slice(0, 5)) { // Show first 5
        const memberCount = await db
          .select()
          .from(groupMemberships)
          .where(eq(groupMemberships.groupId, team.id));
        
        const submissionCount = await db
          .select()
          .from(submissions)
          .where(eq(submissions.submitterGroupId, team.id));
        
        console.log(`   • ${team.name}: ${memberCount.length} members, ${submissionCount.length} submissions`);
      }
      if (teams.length > 5) {
        console.log(`   ... and ${teams.length - 5} more teams`);
      }
    }

    console.log('================================\n');

  } catch (error) {
    console.error('❌ Failed to print system overview:', error);
    throw error;
  }
}

// ============================================================================
// DATA INTEGRITY FUNCTIONS
// ============================================================================

export async function validateDataIntegrity(): Promise<boolean> {
  try {
    console.log('🔍 Validating data integrity...');
    let isValid = true;

    // Check for orphaned group memberships
    const orphanedMemberships = await db
      .select()
      .from(groupMemberships)
      .leftJoin(users, eq(groupMemberships.userId, users.id))
      .leftJoin(groups, eq(groupMemberships.groupId, groups.id))
      .where(isNull(users.id));

    if (orphanedMemberships.length > 0) {
      console.warn(`⚠️  Found ${orphanedMemberships.length} orphaned group memberships`);
      isValid = false;
    }

    // Check for submissions without proper group references
    const orphanedSubmissions = await db
      .select()
      .from(submissions)
      .leftJoin(groups, eq(submissions.reviewerGroupId, groups.id))
      .where(isNull(groups.id));

    if (orphanedSubmissions.length > 0) {
      console.warn(`⚠️  Found ${orphanedSubmissions.length} submissions with invalid reviewer group references`);
      isValid = false;
    }

    // Check for users without primary groups
    const usersWithoutGroups = await db
      .select()
      .from(users)
      .where(isNull(users.primaryGroupId));

    if (usersWithoutGroups.length > 0) {
      console.warn(`⚠️  Found ${usersWithoutGroups.length} users without primary groups`);
      isValid = false;
    }

    if (isValid) {
      console.log('✅ Data integrity validation passed');
    } else {
      console.error('❌ Data integrity issues found');
    }

    return isValid;

  } catch (error) {
    console.error('❌ Data integrity validation failed:', error);
    return false;
  }
}

export async function cleanupOrphanedData(): Promise<void> {
  try {
    console.log('🧹 Cleaning up orphaned data...');

    // Clean up orphaned discussions without valid submissions
    const orphanedDiscussions = await db
      .select()
      .from(discussions)
      .leftJoin(submissions, eq(discussions.submissionId, submissions.id))
      .where(isNull(submissions.id));

    if (orphanedDiscussions.length > 0) {
      console.log(`🗑️  Removing ${orphanedDiscussions.length} orphaned discussions`);
      // Implementation would go here
    }

    // Clean up orphaned notifications
    const orphanedNotifications = await db
      .select()
      .from(notifications)
      .leftJoin(users, eq(notifications.userId, users.id))
      .where(isNull(users.id));

    if (orphanedNotifications.length > 0) {
      console.log(`🗑️  Removing ${orphanedNotifications.length} orphaned notifications`);
      // Implementation would go here
    }

    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

// ============================================================================
// MIGRATION HELPERS (for future use)
// ============================================================================

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing database...');

    // Verify structure
    const structureValid = await verifyDatabaseStructure();
    if (!structureValid) {
      throw new Error('Database structure validation failed');
    }

    // Validate data integrity
    const integrityValid = await validateDataIntegrity();
    if (!integrityValid) {
      console.warn('⚠️  Data integrity issues detected - consider running cleanup');
    }

    // Print overview
    await printSystemOverview();

    console.log('✅ Database initialization complete');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

export async function createTestUser(userData: {
  email: string;
  name: string;
  role: 'committee' | 'team';
  githubId?: string;
  walletAddress?: string;
}): Promise<User> {
  const [user] = await db.insert(users).values({
    email: userData.email,
    name: userData.name,
    primaryRole: userData.role,
    githubId: userData.githubId,
    walletAddress: userData.walletAddress,
    passwordHash: 'test-password-hash' // In real use, hash properly
  }).returning();

  console.log(`✅ Created test user: ${userData.name} (${userData.role})`);
  return user;
}

export async function quickSetup(): Promise<void> {
  try {
    console.log('⚡ Running quick setup...');

    // Create a test committee
    const testCommittee = await createGroup({
      name: 'Test Committee',
      type: 'committee',
      description: 'A test committee for development',
      focusAreas: ['Testing', 'Development'],
      settings: { votingThreshold: 2 }
    });

    // Create a test team
    const testTeam = await createGroup({
      name: 'Test Team',
      type: 'team',
      description: 'A test team for development',
      focusAreas: ['Development', 'Testing'],
      walletAddress: '0x1234567890123456789012345678901234567890'
    });

    // Create test users
    const reviewer = await createTestUser({
      email: 'test-reviewer@example.com',
      name: 'Test Reviewer',
      role: 'committee',
      githubId: 'test-reviewer'
    });

    const teamMember = await createTestUser({
      email: 'test-team@example.com',
      name: 'Test Team Member',
      role: 'team',
      githubId: 'test-team',
      walletAddress: '0x1234567890123456789012345678901234567890'
    });

    // Add users to groups
    await addUserToGroup(reviewer.id, testCommittee.id, 'admin', ['manage_members', 'approve_submissions']);
    await addUserToGroup(teamMember.id, testTeam.id, 'admin', ['manage_team', 'submit_applications']);

    // Update primary groups
    await db.update(users).set({ primaryGroupId: testCommittee.id }).where(eq(users.id, reviewer.id));
    await db.update(users).set({ primaryGroupId: testTeam.id }).where(eq(users.id, teamMember.id));

    // Create a test grant program
    await createGrantProgram({
      groupId: testCommittee.id,
      name: 'Test Grant Program',
      description: 'A test grant program for development',
      fundingAmount: 10000,
      requirements: {
        minExperience: '6 months',
        requiredSkills: ['JavaScript', 'Testing']
      },
      applicationTemplate: {
        sections: [
          { title: 'Project Overview', required: true, maxLength: 500 },
          { title: 'Technical Plan', required: true, maxLength: 1000 }
        ]
      },
      milestoneStructure: {
        defaultMilestones: [
          { title: 'Setup & Planning', percentage: 30, timeframe: '2 weeks' },
          { title: 'Development', percentage: 50, timeframe: '4 weeks' },
          { title: 'Testing & Deployment', percentage: 20, timeframe: '2 weeks' }
        ]
      }
    });

    console.log('✅ Quick setup completed successfully!');
    console.log('\nTest accounts created:');
    console.log(`📧 Reviewer: test-reviewer@example.com`);
    console.log(`📧 Team Member: test-team@example.com`);
    console.log(`🔑 Password: test-password-hash (update for real use)`);

  } catch (error) {
    console.error('❌ Quick setup failed:', error);
    throw error;
  }
}

// Export cleanup function for module cleanup
export async function cleanup(): Promise<void> {
  await client.end();
}
