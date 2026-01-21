/**
 * Migration script: Copy existing GitHub users to the new accounts table
 *
 * This script migrates users who signed in via GitHub OAuth from the old
 * githubId column in the users table to the new accounts table required
 * by Auth.js v5 Drizzle adapter.
 *
 * Run with: npx tsx scripts/db/migrate-github-accounts.ts
 */

import { config } from 'dotenv'
import { isNotNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { accounts, users } from '../../src/lib/db/schema'

config()

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

async function migrateGitHubAccounts() {
  console.log('🔄 Starting GitHub accounts migration...\n')

  // Find all users with a githubId
  const usersWithGitHub = await db
    .select({
      id: users.id,
      email: users.email,
      githubId: users.githubId,
      name: users.name,
    })
    .from(users)
    .where(isNotNull(users.githubId))

  if (usersWithGitHub.length === 0) {
    console.log('✅ No users with GitHub IDs found. Nothing to migrate.')
    return
  }

  console.log(`Found ${usersWithGitHub.length} users with GitHub IDs:\n`)

  let migrated = 0
  let skipped = 0

  for (const user of usersWithGitHub) {
    if (!user.githubId) continue

    try {
      // Check if account already exists
      const { and, eq } = await import('drizzle-orm')
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.provider, 'github'),
            eq(accounts.providerAccountId, user.githubId!)
          )
        )
        .limit(1)

      // Insert into accounts table
      await db
        .insert(accounts)
        .values({
          userId: user.id,
          type: 'oauth',
          provider: 'github',
          providerAccountId: user.githubId,
        })
        .onConflictDoNothing() // Skip if already exists

      console.log(
        `  ✅ Migrated: ${user.name || user.email} (GitHub ID: ${user.githubId})`
      )
      migrated++
    } catch (error) {
      // If account already exists, skip
      if (error instanceof Error && error.message.includes('duplicate')) {
        console.log(`  ⏭️  Skipped (already exists): ${user.name || user.email}`)
        skipped++
      } else {
        console.error(`  ❌ Failed: ${user.name || user.email}`, error)
      }
    }
  }

  console.log('\n=== Migration Summary ===')
  console.log(`✅ Migrated: ${migrated}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`📊 Total processed: ${usersWithGitHub.length}`)
  console.log('\n✅ GitHub accounts migration completed!')
}

migrateGitHubAccounts()
  .catch(error => {
    console.error('❌ Migration failed:')
    console.error(error)
    process.exit(1)
  })
  .finally(() => {
    void client.end()
  })
