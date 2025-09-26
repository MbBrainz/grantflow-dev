# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GrantFlow is a multi-committee grant management platform built with Next.js 15, TypeScript, and Drizzle ORM. The platform enables committees to manage grant programs and teams to submit grant proposals with milestone-based funding.

## Key Commands

### Development
```bash
pnpm dev              # Start development server with Turbopack
pnpm build            # Build production application
pnpm start            # Start production server
```

### Database Management
```bash
pnpm db:setup         # Initial database setup
pnpm db:seed          # Seed database with test data
pnpm db:clean         # Clean all database tables
pnpm db:reset         # Clean, push schema, and reseed (full reset)
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Drizzle Studio GUI
pnpm db:push          # Push schema changes to database
```

### Verification
```bash
pnpm verify:github    # Verify GitHub setup
```

## Architecture

### Stack
- **Frontend:** Next.js 15 App Router, React 19, TypeScript, TailwindCSS 4, shadcn/ui
- **Backend:** Next.js API Routes, Server Actions, Drizzle ORM
- **Database:** PostgreSQL with TypeScript-first Drizzle schema
- **Auth:** GitHub OAuth with JWT cookies
- **Real-time:** Server-Sent Events (SSE) for notifications
- **AI:** Vercel AI SDK with OpenAI for code analysis
- **Package Manager:** pnpm (ONLY use pnpm, never npm/yarn)

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Authenticated dashboard routes
│   ├── (login)/          # Auth pages
│   └── api/              # API routes
├── components/            # React components
├── lib/                  # Core utilities
│   ├── auth/            # Authentication logic
│   ├── db/              # Database layer
│   │   ├── schema.ts    # Drizzle schema definitions
│   │   ├── queries/     # Query functions by table
│   │   ├── writes/      # Write operations by table
│   │   └── scripts/     # DB maintenance scripts
│   ├── github/          # GitHub API integration
│   ├── llm/            # AI/LLM integration
│   └── notifications/   # SSE notification system
└── drizzle/            # Drizzle config
```

### Database Architecture

The application uses a unified `groups` table that handles both committees and teams:
- **groups**: Stores both committees (type='committee') and teams (type='team')
- **groupMemberships**: Links users to groups with roles (admin/member)
- **submissions**: Grant applications from teams to committees
- **milestones**: Deliverables with GitHub integration
- **discussions**: Threaded conversations per submission/milestone
- **reviews**: Voting and feedback from committee members
- **payouts**: Blockchain transaction records

Key relationships:
- Users belong to groups through groupMemberships
- Submissions link submitterGroup (team) to reviewerGroup (committee)
- Discussions can be submission-wide or milestone-specific
- Reviews track individual committee member votes

## Development Guidelines

### Type Safety
- Types originate from `src/lib/db/schema.ts` (Drizzle-generated)
- Additional types in `src/types/index.ts`
- Search for existing types before creating new ones
- Use `Pick<Type, "field1" | "field2">` for partial types

### Database Queries
**ALWAYS prefer `db.query` over `db.select`:**
```typescript
// ✅ GOOD - Relational query builder
const result = await db.query.users.findMany({
  with: { groupMemberships: true },
  where: eq(users.isActive, true)
});

// ❌ AVOID - Raw SQL-like
const result = await db.select().from(users)...
```

### Logging Standards
```typescript
console.log("[functionName]: descriptive text", param);
console.log("[functionName]: object", JSON.stringify(obj, null, 2));
```

### UX Requirements
Every user action must have immediate feedback:
1. Button click → Immediate disable
2. Show loading state
3. Success → Toast + redirect
4. Error → Clear message

### Important Notes
- NO backwards compatibility needed (MVP stage)
- Database can be reset with `pnpm db:reset`
- Update `plan.md` after completing tasks
- All commits must pass linting and type checking

## Current Focus Areas

The platform is transitioning from "curator" to "reviewer" terminology throughout. Key features include:

1. **Role-Based Views**: Different interfaces for reviewers, grantees, and public viewers
2. **Committee Marketplace**: Multi-committee support with discovery features
3. **Milestone Tracking**: GitHub integration for code verification
4. **Discussion System**: Real-time threaded conversations
5. **SSE Notifications**: In-app real-time updates without external dependencies

## Testing & Verification

Before committing:
- Ensure TypeScript compilation: `pnpm build`
- Check for type errors in your IDE
- Test database changes with `pnpm db:push`
- Verify SSE connections work for authenticated users

## Common Tasks

### Adding a New Database Table
1. Define schema in `src/lib/db/schema.ts`
2. Add relations if needed
3. Run `pnpm db:push` to update database
4. Create query functions in `src/lib/db/queries/`
5. Create write functions in `src/lib/db/writes/`

### Creating a New API Endpoint
1. Add route in `src/app/api/[endpoint]/route.ts`
2. Use Server Actions when possible (preferred over API routes)
3. Include proper error handling and validation
4. Return consistent response formats

### Working with Committees and Groups
- Remember: committees and teams are both stored in the `groups` table
- Use `type` field to differentiate ('committee' vs 'team')
- Check `groupMemberships` for user permissions
- Committee operations need reviewer role validation