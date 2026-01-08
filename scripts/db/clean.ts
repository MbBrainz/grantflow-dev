import { config } from 'dotenv'
import postgres from 'postgres'

config()

const client = postgres(process.env.DATABASE_URL!)

/**
 * DATABASE CLEANUP - Drop all tables and clear everything
 */

async function cleanDatabase(): Promise<void> {
  try {
    console.log('🧹 Clearing entire database...')

    // Drop all tables with CASCADE to handle dependencies
    await client.unsafe(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `)

    console.log('✅ Database cleared successfully!')
    console.log('📝 Run `pnpm db:push` to recreate tables from schema')
  } catch (error) {
    console.error('❌ Database cleanup failed:', error)
    throw error
  } finally {
    await client.end()
  }
}

// Main execution
cleanDatabase().catch(error => {
  console.error(error)
  process.exit(1)
})
