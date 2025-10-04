# GrantFlow Marketplace – Project Plan

## 1. Current Status ✅

### MVP Platform Ready

The GrantFlow platform has been successfully transformed from a SaaS template to a clean grant platform MVP:

- **✅ Clean Architecture:** All SaaS template backwards compatibility removed
- **✅ Grant-First Design:** Database schema optimized for committees and submissions
- **✅ Build Success:** All TypeScript compilation errors resolved
- **✅ Multi-Committee Foundation:** Ready for marketplace implementation
- **✅ Milestone Completion:** Committee members can complete milestones with multisig transaction verification

### Recently Completed (January 2025)

- **✅ Backwards Compatibility Removal:** Eliminated all team/SaaS template code
- **✅ Database Schema Cleanup:** Removed unused tables (teams, teamMembers, activityLogs, invitations)
- **✅ Query Optimization:** Updated all database queries for grant platform
- **✅ Component Updates:** Modernized UI components for grant workflow
- **✅ Build Verification:** All 22 pages building successfully
- **✅ Milestone Multisig Completion:** Added ability for committee members to mark milestones complete with transaction verification
- **✅ Homepage Redesign:** Transformed generic SaaS template into exciting grant platform landing page with two-sided marketplace messaging, gradient designs, and clear value propositions for both committees and grantee teams
- **✅ Lottie Animation Integration:** Replaced static Terminal component with dynamic Lottie animation system using lottie-react, including proper loading states, error handling, and static asset management
- **✅ Submission Detail UX Redesign:** Completely redesigned submission detail page with prominent "Active Step Hero" component that shows current stage (approval/milestone) with relevant chat and actionable interface - no more vague status cards
- **✅ Role-Based Views Implementation:** Complete role-based routing system with specialized views for Curator (voting, workflow, analytics), Grantee (progress tracking, response interface), and Public (transparency, accountability) - each user sees exactly what they need
- **✅ Committee Context & Membership:** Curators can now see which committee a submission belongs to and all their committee memberships. Added CommitteeInfoCard showing focus areas, voting thresholds, and membership status. Added CuratorCommitteesDropdown for switching between committee contexts. Enhanced UserContext with committee role detection.
- **✅ UX Bug Fixes & Improvements:** Fixed voting status bug where "Vote Required" showed even after voting. Simplified committee display in submission detail to show only relevant committee. Added committee badges and milestone progress indicators (like "3/5") to submission lists for better overview and context.
- **✅ Curator Priority Actions Dashboard:** Added dedicated "My Actions Required" section to curator dashboard showing all submissions and milestones specifically awaiting the current curator's response/approval with direct clickable links. Features urgency indicators (critical 14+ days, urgent 7+ days) and clear action types (submission votes vs milestone reviews). Includes smart filtering to only show items where curator hasn't voted/reviewed yet.
- **✅ Enhanced Milestone Status & Removed Private Discussions:** Replaced generic "review in progress" information with detailed milestone-specific status showing current active step (e.g., "building milestone 1", "milestone 2 under review"). Added comprehensive MilestoneStatusOverview component with progress tracking, status indicators, and action-required badges. Removed private curator discussions to streamline the review process - all communication now happens in public threads for transparency.
- **✅ PostgreSQL Schema Error Fix:** Resolved critical `column milestones.reviewer_group_id does not exist` error that was preventing the Review Dashboard from loading. Fixed Drizzle ORM relation confusion by adding explicit relation names in schema (`milestoneGroup`) and refactoring complex subqueries in `getAllSubmissionsForReview()` and `getReviewerPendingActions()` functions. Review Dashboard now loads successfully with proper statistics and submission data.
- **✅ Discussion Permission Bug Fix:** Fixed critical permission logic bug in `DiscussionThread` component where `isPublic={true}` was incorrectly preventing authenticated users from posting messages. Updated permission logic to allow posting when discussion is public OR user has reviewer/submission owner permissions. Enhanced component to accept `submissionContext` for more sophisticated permission checking.

## Terminology Migration Completed

- **✅ Complete Curator → Reviewer Migration:** Completely renamed all "curator" references to "reviewer" throughout the entire codebase with NO backwards compatibility. This includes:
  - Database function names (`checkIsCurator` → `checkIsReviewer`, etc.)
  - Component names (`CuratorSubmissionView` → `ReviewerSubmissionView`)
  - User-facing text ("Curator Dashboard" → "Reviewer Dashboard")
  - Route paths (`/dashboard/curator` → `/dashboard/review`)
  - Type definitions and interfaces
  - Comments and documentation
  - All legacy wrapper functions have been completely removed

## 1.1 Role-Based Action Sets & UI Flows 🆕 **PRIORITY**

### Problem Statement

Current platform shows same view to all users regardless of role, missing differentiated experiences for:

- **Curators** (reviewers/voters) vs **Grantees** (applicants) vs **Public** (transparency seekers)
- Different action capabilities and information needs per role
- Missing public transparency layer for non-authenticated users

### Action Set Definitions

#### **Curator Actions** (Authenticated + Role: curator)

**Primary Goals:** Review, vote, provide feedback, manage approval workflow

- **VOTE** on submission approval/rejection with reasoning
- **DISCUSS** in curator-only threads and public threads
- **REQUEST CHANGES** with specific feedback requirements
- **REVIEW MILESTONES** and approve/reject milestone submissions
- **TRIGGER PAYOUTS** via multisig transaction initiation
- **MANAGE WORKFLOW** (set status, escalate, assign reviewers)
- **VIEW ANALYTICS** (committee performance, review queue stats)
- **EXPORT REPORTS** for committee governance

#### **Grantee Actions** (Authenticated + Role: grantee + submission owner)

**Primary Goals:** Track progress, respond to feedback, submit deliverables

- **TRACK STATUS** of application through approval pipeline
- **RESPOND TO FEEDBACK** from curators with clarifications
- **SUBMIT MILESTONE UPDATES** with GitHub links and deliverables
- **PARTICIPATE IN DISCUSSIONS** (read-only curator threads, respond in public)
- **EDIT SUBMISSIONS** during draft or "changes requested" phase
- **VIEW PAYMENT STATUS** and transaction history
- **APPEAL DECISIONS** through structured feedback mechanism

#### **Public View Actions** (Non-authenticated or other users)

**Primary Goals:** Transparency, learning, potential future application

- **VIEW SUBMISSION STATUS** and approval timeline
- **READ PUBLIC DISCUSSIONS** and voting rationale (read-only)
- **BROWSE COMMITTEE ACTIVITY** and success rates
- **VIEW MILESTONE PROGRESS** and deliverables (public transparency)
- **LEARN FROM EXAMPLES** of successful/rejected applications
- **NO SENSITIVE INFO** (no private votes, internal deliberations, or personal data)

### UI Flow Requirements

#### **Submission Detail Page - Role-Based Views**

**🎯 Curator View Layout:**

```
[ACTIVE REVIEW PANEL - Prominent]
├─ Pending Actions (Vote Required, Review Due, etc.)
├─ Curator Voting Interface (Approve/Reject + Comments)
├─ Committee Discussion Thread (Curator-only)
├─ Risk Assessment Tools (GitHub analysis, funding concerns)
└─ Workflow Controls (Set Status, Assign Co-reviewers)

[SECONDARY PANELS]
├─ Public Discussion (Read + Moderate)
├─ Grantee Information (Contact, History, GitHub)
├─ Technical Review (Linked repos, code analysis)
└─ Committee Analytics (Similar submissions, success patterns)
```

**📝 Grantee View Layout:**

```
[CURRENT STATUS HERO - Prominent]
├─ Application Stage (Clear progress indicator)
├─ Required Actions (Response needed, milestone due, etc.)
├─ Next Steps (What grantee needs to do)
└─ Estimated Timeline (When to expect updates)

[COMMUNICATION PANEL]
├─ Curator Feedback (Read curator comments + responses)
├─ Public Discussion Thread (Participate with community)
├─ Milestone Submission Form (When applicable)
└─ Support/Help Resources

[SECONDARY INFO]
├─ Funding Details (Amount, milestones, payment schedule)
├─ Technical Requirements (Deliverables, GitHub expectations)
└─ Application History (Edit trail, previous submissions)
```

**🌍 Public View Layout:**

```
[TRANSPARENCY OVERVIEW - Prominent]
├─ Submission Summary (Title, amount, status, timeline)
├─ Public Voting Results (Curator decisions + rationale)
├─ Community Discussion (Public comments only)
└─ Progress Timeline (Key milestones and achievements)

[LEARNING RESOURCES]
├─ Project Details (Executive summary, goals, impact)
├─ Technical Deliverables (GitHub links, documentation)
├─ Committee Information (Focus area, approval criteria)
└─ Similar Applications (Examples, success patterns)
```

### Technical Implementation Strategy

#### **Role Detection & Access Control**

```typescript
// Enhanced user context with submission relationship
interface UserContext {
  user: User | null
  isAuthenticated: boolean
  role: 'curator' | 'grantee' | 'admin' | null

  // Submission-specific permissions
  isSubmissionOwner: boolean
  isCommitteeCurator: boolean
  canVote: boolean
  canEditSubmission: boolean
  canViewPrivateDiscussions: boolean
}
```

#### **Component Architecture**

```
SubmissionDetailView (Router)
├─ CuratorSubmissionView (role: curator)
├─ GranteeSubmissionView (role: grantee + owner)
├─ PublicSubmissionView (unauthenticated or other)
└─ SharedComponents (reused across views)
    ├─ ProjectOverview
    ├─ TimelineDisplay
    ├─ PublicDiscussion
    └─ TechnicalDetails
```

### Implementation Priority

#### **Phase 1: Role Detection & Routing** ⚡ IMMEDIATE

1. **Fix database query error** blocking current active step functionality
2. **Add role-based routing** in SubmissionDetailView component
3. **Create UserContext hook** with submission-specific permissions
4. **Implement basic view switching** (curator vs grantee vs public)

#### **Phase 2: Curator-Focused Interface**

1. **Enhanced voting interface** with approval workflow
2. **Curator-only discussion threads** with moderation tools
3. **Review queue optimization** with filtering and assignment
4. **Committee analytics dashboard** for decision support

#### **Phase 3: Grantee Experience Optimization**

1. **Progress tracking hero** with clear next steps
2. **Simplified response interface** for curator feedback
3. **Milestone submission optimization** with GitHub integration
4. **Application editing workflow** during revision phases

#### **Phase 4: Public Transparency**

1. **Read-only public views** with sensitive data filtering
2. **Committee performance metrics** for accountability
3. **Community learning resources** from past applications
4. **Public API endpoints** for external transparency tools

This role-based approach solves the core UX problem: **each user sees exactly what they need to accomplish their goals, nothing more, nothing less.**

## 2. Core Features & Flows (Two-Sided Platform)

### A. Committee Onboarding & Management

- **Committee Registration:** GitHub OAuth + committee profile creation
- **Committee Profile Setup:**
  - Branding (logo, description, focus areas)
  - Grant programs with funding amounts and requirements
  - Review criteria and milestone structures
  - Public transparency settings
- **Curator Management:**
  - Invite and manage curator team members
  - Configure roles and permissions
  - Set voting thresholds and approval workflows
- **Multi-sig Wallet Integration:**
  - Connect committee wallet for automated payouts
  - Configure payout rules and milestone triggers
- **Committee Analytics:**
  - Track grant performance, approval rates
  - Monitor time-to-payout metrics
  - Public transparency dashboard

### B. Committee Discovery & Marketplace

- **Browse Committees:** Public directory of all grant committees
- **Committee Comparison:** Side-by-side comparison of focus areas, funding amounts, approval rates
- **Search & Filter:** By technology stack, funding range, geographic focus
- **Committee Detail Pages:** Full profiles with past grants, curator bios, review criteria
- **Application Requirements:** Clear view of what each committee expects

### C. Submission Flow (Grantee)

- **Committee Selection:** Browse marketplace and select target committee(s)
- **GitHub Auth:** Users authenticate via GitHub OAuth (using existing auth system)
- **Committee-Specific Application Form:**
  - Dynamic form based on committee requirements
  - Executive summary, milestones, post-grant plan
  - Committee-relevant project labels and categories
  - GitHub repo links for deliverables (reference only)
  - Wallet address for funding
  - Draft mode (local cache) per committee application
- **Application Submission:**
  - Submit to specific committee with tailored metadata
  - Create committee-specific discussion thread
  - Initialize committee's review workflow
  - All communication happens within the webapp

### D. Review & Curation (Committee-Specific)

- **Committee Dashboard:** All submissions for their committee with discussion threads
- **Committee Workflow:** Custom voting thresholds and approval processes
- **Filter & Search:** By status, label, project type within committee scope
- **Review Interface:** View application details, linked repos, discussion history
- **Multi-Curator Collaboration:** Real-time discussion system per submission
- **Committee Voting System:** Custom approval logic based on committee configuration
- **Request Changes:** Direct feedback through committee-specific discussion threads
- **Committee Payout:** Trigger payouts via committee's configured multi-sig wallet

### E. Milestone Tracking (Committee-Specific) ✅ ENHANCED

- **Committee Milestone Workflow:** Each committee configures their milestone requirements
- **Milestone Submission:** Forms tailored to committee's milestone structure
- **Progress Tracking:** Committee-specific status tracking with discussion threads
- **Code Verification:** GitHub repo/PR/commit links for deliverable proof
- **✅ Multisig Completion:** Committee members can mark milestones complete by providing:
  - Transaction hash from successful multisig payment
  - Block explorer URL for verification
  - Payment amount and wallet addresses
  - Automatic status updates and notifications
- **Committee Payouts:** Release funds based on committee's approval workflow and multi-sig setup

### F. Enhanced Milestone Submission Flow ✅ ENHANCED

When submitting milestone completion review requests:

- **Exact Commit Tracking:** Specific commits and pull requests must be linked to each milestone
- **AI-Assisted Code Analysis:** Pre-query GitHub to analyze changes since previous milestone
- **File Change Overview:** System automatically detects and highlights:
  - Modified files and folders
  - Lines of code changed
  - New vs. existing code contributions
  - AI vs. human generated code detection
- **Manual Review by Grantee:** Review and confirm system-detected changes before submission
- **Committee Code Verification:** Curators can easily see exactly what was built for each milestone
- **✅ First Milestone Support:** Enhanced `getCommitsSince()` function now handles first milestone case by fetching all commits when no previous commit SHA is provided, eliminating the need for fallback logic

### G. Platform Analytics & Transparency

- **Cross-Committee Metrics:** Compare committee performance, approval rates, funding amounts
- **Public Transparency:** All committee decisions and discussions are publicly viewable
- **Grantee Portfolio:** Track team history across multiple committees and grants
- **Committee Reputation:** Public scoring based on payout speed, feedback quality, success rates
- **Market Insights:** Analytics on funding trends, popular project types, success patterns

### D. Discussion & Communication System (✅ COMPLETED & ENHANCED)

- [x] Design discussion thread data model
- [x] Build real-time chat components
- [x] Implement message threading per submission and milestones
- [x] Add voting system for curator reviews
- [x] Create role-based message permissions
- [x] Integrate with submission detail pages
- [x] **Enhanced: Milestone-specific discussion threads**
- [x] **Enhanced: Multi-view curator interface**

### E. Dashboard & Review System (✅ COMPLETED & ENHANCED)

- [x] Simple dashboard: List user's submissions
- [x] Curator dashboard: list/filter submissions with discussion access
- [x] Submission detail view with integrated discussion
- [x] Voting interface within discussion threads
- [x] Review workflow and status updates
- [x] Role-based access control for curators
- [x] **Enhanced: Multi-view curator review interface with:**
  - [x] **Current State View:** Active processes, pending actions, recent activity
  - [x] **Milestones Overview:** Complete milestone tracking with expandable discussions
  - [x] **Project Overview:** Comprehensive project details, timeline, and metadata
- [x] **Enhanced: Milestone-specific messaging and discussion**
- [x] **Enhanced: Real-time activity tracking across submission and milestones**

### F. Milestone & Payout Management (Future Phase)

- [ ] Milestone submission forms with GitHub links
- [ ] Progress tracking interface with discussion per milestone
- [ ] Payout approval workflow (Stripe features temporarily disabled)
- [ ] On-chain integration (contracts TBD)

### G. Public Transparency Features (Future Phase)

- [ ] Public submission status pages with discussion history
- [ ] Curator voting history
- [ ] Analytics dashboard
- [ ] Time-to-payout metrics

---

## 2. Tech Stack

### Frontend

- **Next.js 14** (App Router)
- **React** with TypeScript
- **TailwindCSS** + **shadcn/ui**
- **Real-time Components:** For live discussion updates
- **Wagmi/Viem** for wallet connection
- **React Hook Form** for forms

### Backend

- **Next.js API Routes** + **Server Actions**
- **Drizzle ORM** with PostgreSQL
- **Real-time Infrastructure:** WebSocket/Server-Sent Events for live chat
- **GitHub OAuth** (existing auth system)
- **Simplified GitHub REST API** for repo verification (no authentication needed)
- **Vercel AI SDK** for LLM features

### Database

- **PostgreSQL** (Supabase-hosted)
- **Drizzle ORM** with TypeScript-first schema
- **Push model** for migrations (no migration files)

### External Integrations

- **📄 GitHub REST API** for repo/PR/commit verification (simplified, read-only)
  - **No authentication required** for public repositories
  - **Optional Personal Access Token** for better rate limits (5K/hour vs 60/hour)
  - **Replaced complex GitHub App** with simple fetch() calls
- **Multi-sig Wallet Integration** for committee-specific payouts
- **Vercel AI SDK** for grant analysis and code review assistance
- **Web3 Infrastructure** for committee wallet connections and payout automation

### Notifications & Real-time Features

- **Server-Sent Events (SSE)** for real-time notifications
  - In-app notification delivery
  - Connection status indicators
  - Auto page refresh on relevant updates
- **Toast Notifications** for immediate user feedback
- **No External Notifications**
  - No email integration
  - No mobile/push notifications
  - Focus on active user experience
- **Real-time Updates**
  - Discussion/message updates
  - Vote notifications
  - Status change alerts
  - Submission updates

---

## 3. Database Schema

### Core Entities

```typescript
// Users (extend existing)
users: {
  id, name, email, passwordHash,
  githubId, walletAddress, role, // 'grantee' | 'curator' | 'admin'
  createdAt, updatedAt
}

// Grant committees/organizations
committees: {
  id, name, description, logoUrl,
  focusAreas, websiteUrl, githubOrg,
  walletAddress, isActive,
  votingThreshold, approvalWorkflow,
  createdAt, updatedAt
}

// Committee members (curators)
committeeCurators: {
  id, committeeId, userId, role, // 'admin' | 'curator' | 'reviewer'
  permissions, joinedAt, isActive
}

// Grant programs (per committee)
grantPrograms: {
  id, committeeId, name, description,
  fundingAmount, requirements,
  applicationTemplate, milestoneStructure,
  isActive, createdAt, updatedAt
}

// Grant submissions (linked to committees)
submissions: {
  id, grantProgramId, committeeId, submitterId,
  title, description, executiveSummary,
  milestones, postGrantPlan, labels,
  githubRepoUrl, walletAddress, // Grantee wallet
  status, totalAmount, appliedAt,
  createdAt, updatedAt
}

// Discussion threads (committee-specific)
discussions: {
  id, submissionId, milestoneId?, committeeId,
  type, // 'submission' | 'milestone' | 'committee_internal'
  isPublic, createdAt, updatedAt
}

// Discussion messages
messages: {
  id, discussionId, authorId, content,
  messageType, // 'comment' | 'status_change' | 'vote' | 'committee_decision'
  metadata, // For structured data like votes, committee decisions
  createdAt, updatedAt
}

// Milestone tracking (per submission)
milestones: {
  id, submissionId, committeeId, title, description,
  requirements, amount, dueDate,
  status, deliverables, githubRepoUrl,
  githubPrUrl?, githubCommitHash?, codeAnalysis,
  submittedAt, reviewedAt, createdAt, updatedAt
}

// Committee curator reviews
reviews: {
  id, submissionId, milestoneId?, committeeId, curatorId,
  vote, feedback, discussionId, reviewType,
  weight, isBinding, createdAt, updatedAt
}

// Payout tracking (committee-specific)
payouts: {
  id, submissionId, milestoneId, committeeId,
  amount, transactionHash, status,
  triggeredBy, approvedBy, // curator IDs
  walletFrom, walletTo, // committee -> grantee
  createdAt, processedAt
}

// Notifications (committee-aware)
notifications: {
  id, userId, committeeId?, type,
  submissionId?, discussionId?, milestoneId?,
  read, content, priority,
  createdAt, readAt
}

// Committee analytics
committeeAnalytics: {
  id, committeeId, period, // 'monthly' | 'quarterly' | 'yearly'
  totalSubmissions, approvedSubmissions,
  totalFunding, averageApprovalTime,
  curatorActivity, publicRating,
  createdAt, updatedAt
}

// Platform-wide metrics
platformMetrics: {
  id, period, totalCommittees, totalSubmissions,
  totalFunding, averageSuccess Rate,
  popularTags, trendingCommittees,
  createdAt, updatedAt
}
```

---

## 4. Next Steps

### A. Project Setup ✅

- [x] Set up project structure with Next.js + Drizzle
- [x] Define Drizzle ORM schema for all entities
- [x] Set up GitHub OAuth (extend existing auth)
- [ ] Add wallet connection (DONT DO THIS YET)
- [x] ✅ **SIMPLIFIED:** GitHub REST API integration (replaced complex Octokit)

### B. Auth & User Management ✅

- [x] Extend existing auth to store GitHub profile info
- [x] Sync GitHub-authenticated users to Drizzle users table
- [x] Add role-based access (grantee, curator, admin)

### C. Submission Form & Flow ✅

- [x] Build structured submission form UI
- [x] Implement draft mode with local storage
- [x] Create submission backend (server actions)
- [x] Store submission metadata in DB
- [x] Remove GitHub PR creation (keep as reference links only)

### D. Discussion & Communication System (✅ COMPLETED)

- [x] Design discussion thread data model
- [x] Build real-time chat components
- [x] Implement message threading per submission
- [x] Add voting system for curator reviews
- [x] Create role-based message permissions
- [x] Integrate with submission detail pages

### E. Dashboard & Review System (✅ COMPLETED)

- [x] Simple dashboard: List user's submissions
- [x] Curator dashboard: list/filter submissions with discussion access
- [x] Submission detail view with integrated discussion
- [x] Voting interface within discussion threads
- [x] Review workflow and status updates
- [x] Role-based access control for curators

### F. Committee Onboarding & Management 🆕

- [ ] Committee registration and profile creation
- [ ] Grant program setup and configuration
- [ ] Curator team management and permissions
- [ ] Multi-sig wallet integration
- [ ] Committee workflow customization

### G. Marketplace & Discovery Features 🆕

- [ ] Committee browsing and comparison interface
- [ ] Advanced search and filtering by focus areas
- [ ] Committee detail pages with analytics
- [ ] Public committee reputation scoring
- [ ] Cross-committee application tracking

### H. Enhanced Milestone & Payout Management

- [ ] Committee-specific milestone workflows
- [ ] AI-assisted GitHub code analysis
- [ ] Automated file change detection
- [ ] Committee-configured payout triggers
- [ ] Multi-committee milestone comparison

### I. Platform Analytics & Transparency

- [ ] Cross-committee performance metrics
- [ ] Public transparency dashboard
- [ ] Committee and grantee reputation systems
- [ ] Market insights and trend analysis
- [ ] Platform-wide success metrics

---

## 5. MVP Priorities

### Phase 1 ✅ COMPLETED

1. ✅ **Auth Extension:** GitHub profile sync
2. ✅ **Basic Submission Form:** Core fields with validation
3. ✅ **Simple Dashboard:** List submissions with stats
4. ✅ **GitHub Integration:** Basic GitHub API setup

### Phase 2 ✅ COMPLETED (In-App Communication)

1. ✅ **Discussion System:** Real-time chat per submission/milestone
2. ✅ **Review System:** Curator voting within discussion threads
3. ✅ **Curator Dashboard:** Unified review interface with filtering
4. ✅ **Status Updates:** Submission status tied to discussion votes
5. ✅ **Role-Based Access:** Curator permissions and voting restrictions

### Phase 3 ✅ COMPLETED (SSE Notifications)

1. ✅ **Real-time Updates:** Live discussion updates with WebSocket/SSE
2. ✅ **Notification System:** Real-time alerts for discussion activity with proper auth handling

### Phase 4 ✅ IN PROGRESS (Committee Marketplace Platform)

1. **✅ Committee Database Architecture:** Enhanced queries for marketplace features
2. **✅ Milestone Completion System:** Multisig transaction verification for payments
3. **✅ Comprehensive Test Data:** Full database seeding with realistic scenarios
4. **Committee Onboarding:** Registration, profile creation, and program setup (NEXT)
5. **Marketplace Interface:** Committee discovery and comparison features
6. **Multi-Committee Submissions:** Dynamic forms and committee-specific workflows
7. **Committee Management:** Curator permissions and voting configuration
8. **Wallet Integration:** Committee multi-sig setup for automated payouts

### Phase 5 (Enhanced Platform Features)

1. **Advanced Analytics:** Cross-committee metrics and reputation scoring
2. **AI Integration:** GitHub code analysis and review assistance
3. **Enhanced Milestone Tracking:** Automated change detection and verification
4. **Public Transparency:** Platform-wide visibility and accountability
5. **Market Intelligence:** Funding trends and success pattern analysis

### Notifications System (✅ COMPLETED - Jan 2025)

- **SSE Authentication Fix:** Fixed 401 errors on unauthenticated pages
  - NotificationProvider now only connects for authenticated users
  - Added conditional SSE connection based on user authentication status
  - Eliminated errors on landing page and public routes
- **Real-time Features:** Server-Sent Events for live notifications
  - In-app notification delivery with toast messages
  - Connection status indicators and auto-reconnection
  - Real-time discussion updates and vote notifications
- **No External Dependencies:** Focus on active user experience
  - No email or push notification integrations
  - Pure SSE-based real-time communication

### Comprehensive Test Database (✅ COMPLETED - January 2025)

- **Multi-Committee Environment:** 5 distinct committees with different focus areas
  - Infrastructure Development Foundation (Core dev tools, $100K-$50K grants)
  - Research & Education Grant Committee (Academic work, $75K-$25K grants)
  - DeFi Innovation Fund (Financial protocols, $150K grants)
  - Gaming & NFT Collective (Gaming platforms, $80K grants)
  - Sustainability & Green Tech Fund (Environmental projects, inactive for testing)
- **Realistic User Base:** 9 users across all roles
  - 2 Platform Admins with cross-committee access
  - 4 Curators assigned to different committees
  - 5 Grantees with wallet addresses and submission history
- **Complete Grant Lifecycle:** Submissions in all possible states
  - 1 APPROVED submission with active milestones and completed payouts
  - 1 UNDER_REVIEW submission with partial curator feedback
  - 2 PENDING submissions awaiting initial review
  - 1 REJECTED submission with detailed feedback
- **Active Discussion Environment:** Real conversation threads
  - Curator voting and review feedback
  - Grantee responses and milestone updates
  - Status change notifications and announcements
- **Milestone & Payout Testing:** Complete financial workflow
  - Completed milestone with successful $20K blockchain payout
  - In-progress milestone with development updates
  - Pending milestones for future testing
  - Transaction hashes and block explorer integration

### Marketplace Architecture Transformation (🚀 PLANNED - 2025)

- **Multi-Committee Support:** Platform evolution from single to multi-committee
  - Committee registration and profile management system
  - Independent committee workflows and configurations
  - Committee-specific grant programs and requirements
- **Discovery & Comparison:** Marketplace features for committee selection
  - Advanced search and filtering capabilities
  - Committee analytics and reputation scoring
  - Cross-committee performance metrics
- **Enhanced Database Schema:** Support for committee-centric operations
  - Committee entities with curator management
  - Grant programs per committee with custom templates
  - Committee-specific discussions, reviews, and payouts
  - Platform-wide analytics and metrics tracking

---

## 6. Technical Updates & Migrations

### ✅ Next.js 15 Migration (Completed - Jan 2025)

- **Upgraded Framework:** Next.js 15.4.0-canary.47 → 15.4.1 (stable)
- **Dependencies Updated:** React 19.1.0, TypeScript types updated
- **Async APIs Compatibility:** All cookies(), headers(), params usage properly awaited
- **Configuration Updates:** Removed experimental features not available in stable
  - Removed `experimental.ppr` (Partial Prerendering)
  - Removed `experimental.nodeMiddleware`
- **Code Structure:** Moved notification utilities to separate files for Next.js 15 compatibility
- **Peer Dependencies:** Updated zod to 3.25.76 for drizzle-zod compatibility
- **Build Verified:** All builds passing, no breaking changes detected

### Key Benefits from Next.js 15:

- **React 19 Support:** Latest React features and improvements
- **Performance:** Better hydration and optimization
- **Developer Experience:** Improved error messages and debugging
- **Future-Ready:** Foundation for upcoming features like PPR when stable

### ✅ NextAuth.js Migration

- **Authentication Upgrade:** Migrated from custom GitHub OAuth to NextAuth.js
- **Enhanced Security:** Battle-tested OAuth implementation with automatic CSRF protection
- **Dual Authentication:** Both GitHub OAuth (NextAuth) and email/password (custom) work seamlessly
- **Account Linking:** Automatic linking when GitHub email matches existing user account
- **Configuration Cleanup:** Moved NextAuth configuration to proper location (`src/lib/auth/next-auth.ts`)
- **Build Fixes:** Resolved Next.js route type errors and linting issues
- **Environment Setup:** Updated environment variables for NextAuth integration
- **Documentation:** Comprehensive migration guides and testing documentation created

### Key Benefits from NextAuth Migration:

- **Security:** Industry-standard OAuth implementation with automatic protection
- **Maintainability:** Less custom code, well-documented and widely used
- **Extensibility:** Easy to add Google, Facebook, and other OAuth providers
- **Developer Experience:** TypeScript support, React hooks, and server-side helpers

---

### Phase 4 (Mobile PWA)

1. **PWA Install prompt** Modal that shows install prompt to user using [pwa-install](https://github.com/khmyznikov/pwa-install)
