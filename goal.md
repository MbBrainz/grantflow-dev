# Suggestion Problem and Idea from the bug bounty:

### **Problem**

Grant committees operate in isolation with fragmented workflows - teams submit deliverables across scattered channels (GitHub, Discord, Google Docs), curators manually track submissions, coordinate reviews via chat, and process payouts through multiple transactions. There's no unified marketplace for grant discovery, no standardized review process, and no transparent status tracking for teams seeking funding.

**Solution** 

Two-sided marketplace platform where **grant committees** create discoverable profiles and manage their grant programs, while **grantee teams** can discover opportunities, submit applications, and track progress through integrated discussion systems with instant payouts upon approval.

### **POC Guidelines**

1. **For Grant Committees**
    - Create and manage committee profiles with branding, focus areas, and funding criteria
    - Set up grant programs with clear application requirements and milestone structures
    - Configure multi-curator approval workflows and voting thresholds
    - Access unified dashboard to manage all submissions across their programs
    - Review applications with co-curators using integrated voting system within discussion threads
    - Request changes with clear feedback through in-app communication system
    - Reference and analyze linked GitHub repositories during review process
    - Trigger instant payouts upon milestone approval
    - Maintain public transparency with visible voting history and review criteria

2. **For Grantee Teams**
    - Discover grant committees and browse available funding opportunities
    - Submit applications through structured forms tailored to each committee's requirements
    - Link GitHub repos/PRs/commits as proof of deliverables and progress
    - Track application and milestone review status in real-time within the platform
    - Participate in discussions with curators directly through integrated chat system
    - Receive notifications when curators request changes or updates
    - Submit milestone updates with linked code repositories and progress documentation
    - Maintain transparent project history visible to public and future committees
3. **Smart Contract Backend**
    - Multi-curator approval logic
    - Automatic payout via bounty precompile
    - Immutable record of reviews and decisions
4. **Platform Features**
    - **Committee Discovery:** Browse and compare grant committees with their focus areas, funding amounts, and approval rates
    - **Public Transparency:** View submission status, discussion history, and voting outcomes for all committees
    - **Committee Profiles:** Detailed pages showing committee information, past grants, curator bios, and review criteria  
    - **Cross-Committee Analytics:** Compare committee performance, average payout times, and approval rates
    - **Grantee Profiles:** Track team history, past grants received, and success rates across committees

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

*Terminology* **Approved Grant**

A plan proposed by a third party (hereafter the "grantee") and approved by the grant committee, that exists of the following features:

***An Executive Summary*** that explains what the the project will be building and how it will benefit the organization or ecosystem represented by the grant committee

*A **milestone based implementation plan*** that specifies per milestone what the requirements are to meet the milestone, how the grantee wants to complete these milestones, what the timeframe per milestone is and what the reward per milestone is.

***A Post-Grant development plan*** that specifies how the project will continue its development and existence after the grant has been approved

*Find the exact description here: https://github.com/Polkadot-Fast-Grants/apply/blob/master/README.md#tips-for-good-applications*

</aside>

## Grant approval and assessment process

*The process below based on interview with Fast Grants committee member sachalansky*

Basically 2 phases: 

1. Grant approval phase
2. Grant Awarding phase

### Overall process of grant approval and rewarding (MULTI-COMMITTEE PLATFORM)

**Committee Onboarding:**
1. Grant committees create profiles with branding, focus areas, and review criteria
2. Configure curator roles, voting thresholds, and approval workflows
3. Set up grant programs with funding amounts and milestone requirements

**Grant Application Flow:**
1. Grantee teams discover and browse committee profiles and available programs
2. Submit applications to specific committees through customized webapp forms
3. Committee-specific discussion threads initiated for each submission
4. Real-time back-and-forth between grantee team and committee curators
5. Grantee updates submissions based on committee feedback through webapp
6. Committee approval through configured voting system and thresholds

**Milestone Tracking (Per Committee):**
7. Committee tracks progress through dedicated milestone discussion threads
8. Grantee milestone submissions with GitHub repo/PR/commit links
9. Committee review in milestone-specific discussion threads
10. GitHub repository analysis and code review within webapp context
11. Committee voting and approval based on their configured workflow
12. Automated payout via committee's multi-sig wallet configuration

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

## Solution: AI supported Marketplace Web App that consolidates committee discovery, application submission, collaborative review, milestone tracking AND multi-sig rewarding process

**Two-Sided Platform Features:**

**For Grant Committees:**
- Committee profile creation and management with branding and focus areas
- Grant program setup with customizable requirements and milestone structures
- Curator role management and voting threshold configuration
- Multi-sig wallet integration for automated payouts

**For Grantee Teams:**
- Committee discovery and comparison interface
- Application submission forms (with cache based draft mode) tailored per committee
- Team profile and grant history tracking

**Shared Platform Features:**
- **IN-APP discussion system** for all communication between grantees and curators
- PUBLIC submission review and update process (readable by anyone)
- Committee-specific submission states and workflow tracking
- Milestone submission forms and processes for Grantees
- On-Chain Milestone approval using committee-specific multiSig wallets
- Milestone State Overview across all committees
- **Real-time notifications** for discussion updates
- Cross-committee analytics and performance metrics
- Submission and Authentication should be 100% web3 based

This application should NOT include:

- Chat feature for committee outside of submission context
- External chat integrations (Discord, Telegram) for primary workflow
- GitHub PR creation for discussion (only for code references)

**role of AI**

- reduce the burden of simple steps like
    - Initial feedback of submissions
    - Simplifying review steps by guiding curators through linked codebases
    - Analyzing GitHub repositories linked in submissions
    - Suggesting relevant questions during review process
- (potentially) summarizing discussion threads and providing review insights

Important: AI here is an optional addition to the platform

Stack

- Nextjs 15 typescript app
- vercel AI sdk for ai tasks
- Database Schema definition using typescript first approach with drizzle ORM
- Accounts are just wallets connected but with github oAuth for authentication
- PostgresQL database (Supabase)
- **Real-time infrastructure** for live discussion updates
- github integration using https://github.com/octokit/octokit.js/ REST library to:
    - **READ ONLY**: verify repository links, analyze commits, fetch PR data
    - **NO PR CREATION**: GitHub used purely for code repository references
    - Quick overview of edited files from linked repos/PRs/commits

### Updated Multi-Committee Submission Flow

**Committee Setup:**
1. Grant committees create profiles with branding, focus areas, and review criteria
2. Configure grant programs with funding amounts, requirements, and milestone structures
3. Set up curator teams and voting workflows

**Grantee Application Process:**
1. Grantee teams browse committee marketplace:
    1. Compare committee profiles, focus areas, and funding amounts
    2. Review past grants, approval rates, and average processing times
    3. Select appropriate committee(s) for their project type
2. Team application submission:
    1. Logs in via GitHub OAuth (authentication only)
    2. Selects target committee and available grant program
    3. Fills in committee-specific application form
    4. Adds project labels relevant to committee's focus areas
    5. Links GitHub repositories/PRs/commits for deliverables
    6. Provides wallet address for potential funding
3. Application processing:
    - Web-app confirms wallet ownership through submission
    - Creates submission record linked to specific committee
    - Initiates committee-specific discussion thread
    - Sets initial status tracking based on committee workflow

**Committee Review Process:**
4. **Committee Discussion Phase:**
    - All communication happens within webapp discussion threads
    - Committee curators collaborate using integrated voting system
    - GitHub repositories are referenced and analyzed within discussions
    - Voting and approval follows committee's configured workflow
    - Public transparency with visible discussion history and voting outcomes

**Milestone Management:**
5. **Committee-Specific Milestone Updates:**
    - Grantees submit milestone updates through webapp
    - Link specific GitHub repos/PRs/commits as deliverables
    - Dedicated discussion threads per milestone within committee context
    - Committee review and approval through their configured voting system
    - Automated payouts via committee's multi-sig wallet setup

### Key Architectural Changes

**FROM:** Single committee with GitHub-centric workflow and PR creation
**TO:** Multi-committee marketplace platform with webapp-centric workflows and GitHub as code reference

**Platform Benefits:**
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