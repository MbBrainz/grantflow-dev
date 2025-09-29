# GrantFlow: Multi-Committee Grant Marketplace Platform

## Problem

Grant committees operate in isolation with fragmented workflows - teams submit deliverables across scattered channels (GitHub, Discord, Google Docs), curators manually track submissions, coordinate reviews via chat, and process payouts through multiple transactions. There's no unified marketplace for grant discovery, no standardized review process, and no transparent status tracking for teams seeking funding.

## Solution

Two-sided marketplace platform where **grant committees** create discoverable profiles and manage their grant programs, while **grantee teams** can discover opportunities, submit applications, and track progress through integrated discussion systems with instant payouts upon approval.

## Platform Features

### For Grant Committees

- Create and manage committee profiles with branding, focus areas, and funding criteria
- Set up grant programs with clear application requirements and milestone structures
- Configure multi-curator approval workflows and voting thresholds
- Access unified dashboard to manage all submissions across their programs
- Clear overview of awaiting reviews, todos, and grants waiting longest without response
- Review applications with co-curators using integrated voting system within discussion threads
- Request changes with clear feedback through in-app communication system
- Reference and analyze linked GitHub repositories during review process
- Trigger instant payouts upon milestone approval
- Maintain public transparency with visible voting history and review criteria
- Multi-sig wallet integration for automated payouts

### For Grantee Teams

- Discover grant committees and browse available funding opportunities
- Submit applications through structured forms tailored to each committee's requirements
- Link GitHub repos/PRs/commits as proof of deliverables and progress
- Track application and milestone review status in real-time within the platform
- Participate in discussions with curators directly through integrated chat system
- Receive notifications when curators request changes or updates
- Submit milestone updates with linked code repositories and progress documentation
- Maintain transparent project history visible to public and future committees
- Committee discovery and comparison interface
- Application submission forms (with cache-based draft mode) tailored per committee
- Team profile and grant history tracking

### Shared Platform Features

- **Committee Discovery:** Browse and compare grant committees with their focus areas, funding amounts, and approval rates
- **Public Transparency:** View submission status, discussion history, and voting outcomes for all committees
- **Committee Profiles:** Detailed pages showing committee information, past grants, curator bios, and review criteria
- **Cross-Committee Analytics:** Compare committee performance, average payout times, and approval rates
- **Grantee Profiles:** Track team history, past grants received, and success rates across committees
- **IN-APP discussion system** for all communication between grantees and curators
- PUBLIC submission review and update process (readable by anyone)
- Committee-specific submission states and workflow tracking
- Milestone submission forms and processes for Grantees
- On-Chain Milestone approval using committee-specific multiSig wallets
- Milestone State Overview across all committees
- **Real-time notifications** for discussion updates and Awaiting tasks
- Submission and Authentication should be 100% web3 based

### Smart Contract Backend

- Multi-curator approval logic
- Automatic payout via bounty precompile
- Immutable record of reviews and decisions

## Main sources of information about grants

- General web3 foundation grants: https://grants.web3.foundation/docs/Process/how-to-apply
- Active bounty programs: https://bounties.usepapi.app/
- Fast Grants
  - Apply: https://github.com/Polkadot-Fast-Grants/apply
  - Review; https://github.com/Polkadot-Fast-Grants/delivery
- UI Bounty program
  - https://www.uxbounty.xyz/

<aside>
💡

_Terminology_ **Approved Grant**

A plan proposed by a third party (hereafter the "grantee") and approved by the grant committee, that exists of the following features:

**_An Executive Summary_** that explains what the the project will be building and how it will benefit the organization or ecosystem represented by the grant committee

\*A **milestone based implementation plan\*** that specifies per milestone what the requirements are to meet the milestone, how the grantee wants to complete these milestones, what the timeframe per milestone is and what the reward per milestone is.

**_A Post-Grant development plan_** that specifies how the project will continue its development and existence after the grant has been approved

_Find the exact description here: https://github.com/Polkadot-Fast-Grants/apply/blob/master/README.md#tips-for-good-applications_

</aside>

## Grant Process Flow

_Based on interview with Fast Grants committee member sachalansky_

### Two Main Phases

1. **Grant Approval Phase:** Application submission, review, and approval
2. **Grant Awarding Phase:** Milestone tracking, review, and payouts

### Multi-Committee Platform Workflow

**Committee Setup:**

1. Grant committees create profiles with branding, focus areas, and review criteria
2. Configure curator roles, voting thresholds, and approval workflows
3. Set up grant programs with funding amounts and milestone requirements

**Grant Application Process:**

1. Grantee teams browse committee marketplace and compare profiles, focus areas, and funding amounts
2. Submit applications to specific committees through customized webapp forms
3. Committee-specific discussion threads initiated for each submission
4. Real-time back-and-forth between grantee team and committee curators
5. Grantee updates submissions based on committee feedback through webapp
6. Committee approval through configured voting system and thresholds

**Milestone Management:**

1. Grantees submit milestone updates through webapp with GitHub repo/PR/commit links
2. Committee tracks progress through dedicated milestone discussion threads
3. Committee review in milestone-specific discussion threads with GitHub repository analysis
4. Committee voting and approval based on their configured workflow
5. Automated payout via committee's multi-sig wallet configuration

### Milestone Assessment process

Bug bounty assessments when it comes to code exist of the following evaluations:

- what contributions were made?
- How much of the code was template?
- How much of the code was already present?
- from which commit/branch was the changes started?
- How much of the contributions are low value AI generated contributions?

Sub Problem: Assessment problem

- Readme of code base or submissions are not specific enough to find what the actual code contributions were
- Searching though repositories based on the readme is hard
- Process of async communication within committee and approvals are tedious

## Technical Implementation

### What the Application Should NOT Include

- Chat feature for committee outside of submission context
- External chat integrations (Discord, Telegram) for primary workflow
- GitHub PR creation for discussion (only for code references)

### Optional AI Integration

- Reduce the burden of simple steps like:
  - Initial feedback of submissions
  - Simplifying review steps by guiding curators through linked codebases
  - Analyzing GitHub repositories linked in submissions
  - Suggesting relevant questions during review process
- (Potentially) summarizing discussion threads and providing review insights
- **Important:** AI here is an optional addition to the platform

### Technology Stack

- Nextjs 15 typescript app
- Vercel AI sdk for AI tasks
- Database Schema definition using typescript first approach with drizzle ORM
- Accounts are just wallets connected but with GitHub OAuth for authentication
- PostgreSQL database (Supabase)
- **Real-time infrastructure** for live discussion updates
- GitHub integration using https://github.com/octokit/octokit.js/ REST library to:
  - **READ ONLY**: verify repository links, analyze commits, fetch PR data
  - **NO PR CREATION**: GitHub used purely for code repository references
  - Quick overview of edited files from linked repos/PRs/commits

## Key Architectural Changes

**FROM:** Single committee with GitHub-centric workflow and PR creation  
**TO:** Multi-committee marketplace platform with webapp-centric workflows and GitHub as code reference

### Platform Benefits

- **Committee Discovery:** Centralized marketplace for grant opportunities with committee comparison
- **Scalable Governance:** Multiple committees can operate independently with custom workflows
- **Unified Communication:** All discussions happen within webapp regardless of committee
- **Cross-Committee Analytics:** Performance metrics and comparison across different committees
- **Enhanced Transparency:** Public visibility into all committee operations and decision-making
- **Standardized Process:** Consistent application and review experience across committees
- **Real-time Collaboration:** Live updates and notifications for all committee activities
- **AI Integration:** Opportunities for discussion analysis and review assistance across platform
- **Portfolio Management:** Teams can track applications across multiple committees
- **Committee Autonomy:** Each committee maintains control over their specific requirements and processes
