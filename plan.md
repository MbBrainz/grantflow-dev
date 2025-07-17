# GrantFlow POC – Project Plan

## 1. Core Features & Flows

### A. Submission Flow (Grantee)
- **GitHub Auth:** Users authenticate via GitHub OAuth (using existing auth system)
- **Structured Submission Form:**
  - Executive summary, milestones, post-grant plan
  - Project type labels (multi-select)
  - GitHub repo link for deliverables (reference only)
  - Draft mode (local cache)
- **Submission Publishing:**
  - On submit: store complete metadata in DB, create initial status
  - GitHub repo links tracked for reference and code verification
  - All discussion happens within the webapp

### B. Review & Curation (Curators)
- **Unified Dashboard:** All submissions with in-app discussion threads
- **Filter & Search:** By status, label, project type, etc.
- **Review Interface:** View details, linked repos, discussion history
- **In-App Discussion:** Real-time chat system per submission
- **Voting System:** Multi-curator approval logic within webapp
- **Request Changes:** Direct feedback through webapp discussion
- **Approve & Payout:** Trigger on-chain payout (multi-sig)

### C. Milestone Tracking
- **Milestone Submission:** Form for milestone deliverables with GitHub links
- **Progress Updates:** Status tracking per milestone with discussion threads
- **Code Verification:** GitHub repo/PR/commit links for deliverable proof
- **Conditional Payouts:** Release funds on milestone approval

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
- **On-chain contracts** for payouts (TBD)
- **Vercel AI SDK** for grant analysis

---

## 3. Database Schema

### Core Entities
```typescript
// Users (extend existing)
users: {
  id, name, email, passwordHash,
  githubId, walletAddress, role,
  createdAt, updatedAt
}

// Grant submissions
submissions: {
  id, title, description, executiveSummary,
  milestones, postGrantPlan, labels,
  githubRepoUrl, // Reference only, no PR creation
  submitterId, status, totalAmount,
  createdAt, updatedAt
}

// Discussion threads
discussions: {
  id, submissionId, milestoneId?, type, // 'submission' | 'milestone'
  createdAt, updatedAt
}

// Discussion messages
messages: {
  id, discussionId, authorId, content,
  messageType, // 'comment' | 'status_change' | 'vote'
  metadata, // For structured data like votes
  createdAt, updatedAt
}

// Milestone tracking
milestones: {
  id, submissionId, title, description,
  requirements, amount, dueDate,
  status, deliverables, githubRepoUrl,
  githubPrUrl?, githubCommitHash?,
  createdAt, updatedAt
}

// Curator reviews
reviews: {
  id, submissionId, milestoneId?, curatorId, 
  vote, feedback, discussionId,
  createdAt, updatedAt
}

// Payout tracking
payouts: {
  id, submissionId, milestoneId, amount,
  transactionHash, status, createdAt
}

// Notifications
notifications: {
  id, userId, type, submissionId, discussionId?,
  read, content, createdAt
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

### F. Milestone & Payout Management 
- [ ] Milestone submission forms with GitHub links
- [ ] Progress tracking interface with discussion per milestone
- [ ] Payout approval workflow (Stripe features temporarily disabled)
- [ ] On-chain integration (contracts TBD)

### G. Public Transparency Features 
- [ ] Public submission status pages with discussion history
- [ ] Curator voting history
- [ ] Analytics dashboard
- [ ] Time-to-payout metrics

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

### Phase 3 
1. **Real-time Updates:** Live discussion updates with WebSocket/SSE
2. **Notification System:** Real-time alerts for discussion activity
3. **Milestone Tracking:** Enhanced with discussion per milestone
4. **Public Transparency:** Status pages with discussion history
5. **Wallet Integration:** Connect for payouts
6. **Payment System:** Re-enable Stripe or implement on-chain payouts
7. **Advanced Features:** Analytics, AI integration 

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