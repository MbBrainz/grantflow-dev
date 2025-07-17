# GrantFlow Marketplace – Project Plan

## 1. Core Features & Flows (Two-Sided Platform)

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

### E. Milestone Tracking (Committee-Specific)
- **Committee Milestone Workflow:** Each committee configures their milestone requirements
- **Milestone Submission:** Forms tailored to committee's milestone structure
- **Progress Tracking:** Committee-specific status tracking with discussion threads
- **Code Verification:** GitHub repo/PR/commit links for deliverable proof
- **Committee Payouts:** Release funds based on committee's approval workflow and multi-sig setup

### F. Enhanced Milestone Submission Flow
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

### G. Platform Analytics & Transparency
- **Cross-Committee Metrics:** Compare committee performance, approval rates, funding amounts
- **Public Transparency:** All committee decisions and discussions are publicly viewable
- **Grantee Portfolio:** Track team history across multiple committees and grants
- **Committee Reputation:** Public scoring based on payout speed, feedback quality, success rates
- **Market Insights:** Analytics on funding trends, popular project types, success patterns


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
- **Octokit.js** for GitHub API (read-only for repo verification)
- **Vercel AI SDK** for LLM features

### Database
- **PostgreSQL** (Supabase-hosted)
- **Drizzle ORM** with TypeScript-first schema
- **Push model** for migrations (no migration files)

### External Integrations
- **GitHub API** for repo/PR/commit verification (read-only)
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
- [x] Integrate Octokit.js for GitHub API access

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

### Phase 4 (Committee Marketplace Platform) 🆕
1. **Committee Onboarding:** Registration, profile creation, and program setup
2. **Marketplace Interface:** Committee discovery and comparison features
3. **Multi-Committee Submissions:** Dynamic forms and committee-specific workflows
4. **Committee Management:** Curator permissions and voting configuration
5. **Wallet Integration:** Committee multi-sig setup for automated payouts

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

---

### Phase 4 (Mobile PWA)
1. **PWA Install prompt** Modal that shows install prompt to user using [pwa-install](https://github.com/khmyznikov/pwa-install)