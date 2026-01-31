# GrantFlow.dev

**Streamlining Polkadot bounty grants from submission to payout in one unified web3 platform.**

GrantFlow.dev is an all-in-one platform that consolidates grant submissions, reviews, approvals, and payouts for Polkadot bounty programs. It replaces scattered channels (GitHub, Discord, Google Docs) with structured forms, real-time tracking, collaborative dashboards, integrated chat features, and smart contract integrations for efficient, transparent processes.

| [GrantFlow.Dev website](https://grantflow.dev) |
[Documentation](https://docs.grantflow.dev) | 

## Features

- **Grant Submission System**: Structured forms with draft caching and GitHub integration
- **Review Dashboard**: Committee-based review workflows with voting and discussion threads
- **Milestone Tracking**: Progress tracking with deliverable submissions and milestone reviews
- **Real-time Communication**: Integrated discussion threads for committees and grantees
- **Role-Based Access**: Specialized views for Grantees, Reviewers, and Public transparency
- **Committee Management**: Multi-committee support with grant program management
- **On-Chain Integration**: Polkadot multisig wallet integration for milestone-based payouts (Milestone 2)

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **React**: React 19 with TypeScript
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/) with Tailwind CSS
- **Authentication**: NextAuth.js with GitHub OAuth
- **Real-time**: Server-Sent Events (SSE) for notifications
- **Testing**: Vitest for unit and integration tests

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose (for local PostgreSQL)
- GitHub account (for OAuth authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/MbBrainz/grantflow-dev.git
cd grantflow-dev

# Install dependencies
pnpm install
```

## Running Locally

### 1. Environment Setup (Required First!)

Before running the database setup, you must create a `.env` file. The easiest way is to copy the example:

```bash
cp .env.example .env
```

The `.env.example` file contains the correct `DATABASE_URL` that matches the Docker Compose configuration:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/grantflow
```

**Important configuration notes:**
- Port `5433` is used (not the default `5432`) to avoid conflicts with local PostgreSQL instances
- The credentials (`postgres:postgres`) match the Docker Compose configuration
- Database name is `grantflow`

**Generate AUTH_SECRET** (required for authentication):
```bash
openssl rand -base64 32
```

Then update your `.env` file with the generated secret.

### 2. Database Setup

The easiest way to set up the database is using the included setup script, which starts PostgreSQL via Docker and initializes the database:

```bash
pnpm db:setup
```

This command:
- Starts a PostgreSQL container using `docker-compose.yml`
- Waits for the database to be ready
- Cleans existing tables (if any)
- Pushes the schema from Drizzle ORM
- Seeds the database with test data

**Manual Setup** (if you prefer):

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Clean database (optional, removes all data)
pnpm db:clean

# Push schema to database
pnpm db:push

# Seed with test data
pnpm db:seed
```

### 3. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

### Available Scripts

- **`pnpm db:setup`** - Complete setup: starts PostgreSQL, cleans, pushes schema, and seeds
- **`pnpm db:reset`** - Reset database: clean → push schema → seed
- **`pnpm db:clean`** - Drop all tables (⚠️ removes all data)
- **`pnpm db:push`** - Push Drizzle schema to database
- **`pnpm db:seed`** - Seed database with test data
- **`pnpm db:studio`** - Open Drizzle Studio (database GUI)

### Seeding

The seed script (`scripts/db/seed.ts`) creates a comprehensive test environment:

**Committees Created:**
- Infrastructure Development Committee (with multisig enabled)
- Research & Education Committee
- DeFi Innovation Committee
- Gaming & NFT Committee

**Test Accounts:**

**Reviewers** (password: `reviewer123`):
- `reviewer1@test.com` - Alex Chen (Infrastructure Committee admin)
- `reviewer2@test.com` - Maria Rodriguez (Infrastructure Committee member)
- `reviewer3@test.com` - David Kim (Research Committee)
- `reviewer4@test.com` - Elena Vasquez (DeFi Committee)

**Grantees** (password: `team1234`):
- `team1@test.com` - NextGen SDK Team
- `team2@test.com` - Layer2 Research Group
- `team3@test.com` - YieldOpt Protocol Team
- `team4@test.com` - Blockchain Education Collective
- `team5@test.com` - NFT Gaming Studio

**Test Data Includes:**
- 6 grant programs across committees
- 10 submissions in various states (approved, in-review, pending, rejected)
- 13 milestones with different statuses
- Discussion threads and messages
- Reviews and votes
- Completed payouts

## Testing (currenlty only pipeline, no actual tests yet)

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

Tests are located in the `__tests__` directory and use Vitest.

## Development Scripts

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix          # Fix ESLint errors
pnpm format            # Format code with Prettier
pnpm typecheck         # Type check with TypeScript

# Database
pnpm db:setup         # Complete database setup
pnpm db:reset         # Reset database
pnpm db:seed          # Seed database
pnpm db:studio        # Open Drizzle Studio
```

## Project Structure

```
grantflow-dev/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (dashboard)/  # Protected dashboard routes
│   │   ├── (login)/      # Authentication routes
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── submissions/ # Submission-related components
│   │   ├── review/      # Review workflow components
│   │   └── milestone/   # Milestone tracking components
│   ├── lib/              # Utility libraries
│   │   ├── db/          # Database queries and schema
│   │   ├── auth/        # Authentication utilities
│   │   └── polkadot/    # Polkadot integration
│   └── types/            # TypeScript type definitions
├── scripts/
│   └── db/              # Database scripts (seed, clean, setup)
├── docs/                # Documentation
├── docker-compose.yml   # PostgreSQL Docker configuration
└── drizzle.config.ts    # Drizzle ORM configuration
```

## Documentation

- **[User Guides](docs/guides/)** - Walkthrough guides for grantees and reviewers
- **[Quickstart Guide](docs/QUICKSTART.md)** - Quick setup instructions
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

## Contributing

This project is part of the Polkadot Fast-Grants Programme. For issues and contributions, please use the GitHub repository.

## License

MIT License - see [LICENSE](LICENSE) file for details.
