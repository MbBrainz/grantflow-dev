import type { Config } from 'drizzle-kit'

export default {
  schema: './src/lib/db/schema.ts',
  out: undefined,
  dialect: 'postgresql',
  migrations: undefined,
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config
