import dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Determine if we need SSL based on the database URL
// Production databases (Supabase, Neon, etc.) typically require SSL
const isLocalhost =
  process.env.DATABASE_URL.includes('localhost') ||
  process.env.DATABASE_URL.includes('127.0.0.1')

export const client = postgres(process.env.DATABASE_URL, {
  ssl: isLocalhost ? false : 'require',
  max: 10, // Connection pool size
})

export const db = drizzle(client, { schema })
