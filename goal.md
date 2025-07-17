# Suggestion Problem and Idea from the bug bounty:

### **Problem**

Teams completing bounty work submit deliverables across scattered channels - GitHub, Discord, Google Docs. Curators manually track who submitted what, coordinate reviews via chat, and process payouts through multiple transactions. There's no unified place to submit completed work, no transparent review process, and no clear status tracking for teams awaiting approval.

**Solution** 

All-in-one platform where teams submit completed work, curators review collaboratively through integrated discussion system, and approved payouts happen instantly.

### **POC Guidelines**

1. **For Teams Completing Work**
    - Submit deliverables through structured forms
    - Link GitHub repos/PRs/commits as proof of completion
    - Track review status in real-time within the platform
    - Participate in discussions with curators directly in the app
    - Get notified when curators request changes through in-app messaging
2. **For Curators**
    - Access all submissions in unified dashboard with integrated discussions
    - Review with co-curators using voting system within discussion threads
    - Request changes with clear feedback through in-app communication
    - Reference and analyze linked GitHub repositories during review
    - Trigger instant payouts upon approval
3. **Smart Contract Backend**
    - Multi-curator approval logic
    - Automatic payout via bounty precompile
    - Immutable record of reviews and decisions
4. **Transparency Features**
    - Public view of submission status and discussion history
    - Curator voting history within discussions
    - Time from submission to payout
    - Clear feedback on requested changes

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

### Overall process of grant approval and rewarding (UPDATED FOR NEW ARCHITECTURE)

1. Grant Idea submission by 3rd party (through webapp form)
2. Grant Idea feedback by committee (in webapp discussion thread)
    1. back and forth between potential grantee and committee in real-time chat
    2. updates on submission by grantee through webapp
    3. structured discussion with voting and status tracking
3. Grant Idea Approval (through webapp voting system)
4. Committee tracks progress of each milestone through dedicated discussion threads
5. Updates by Grantee (milestone submissions with GitHub repo/PR/commit links)
6. Review by committee (in milestone-specific discussion threads)
    1. similar discussion process to pre-approval phase
    2. GitHub repo analysis and code review within webapp context
7. Final review (on-platform voting and approval)
8. Awarding the grant with multiSig Tx

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

## Solution: AI supported Web App that consolidates the submission, back and forth, approval, milestone assessment AND multi-sig rewarding process

Application should include: 

- submission form (with cache based draft mode)
- **IN-APP discussion system** for all communication between grantees and curators
- PUBLIC submission review and update process (readable by anyone)
- submission states (awaiting x or y)
- Milestone submission forms and processes for Grantee
- On-Chain MileStone approval using multiSig
- Milestone State Overview
- **Real-time notifications** for discussion updates
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

### Updated Submission Flow

1. 3rd party representative submission:
    1. Logs in via GitHub OAuth (authentication only)
    2. fills in form according to specs and extra info
    3. fixed set of labels for type of project (multi-selectable)
    4. links to GitHub repositories/PRs/commits for deliverables
    5. including a wallet on which it wants to receive funds 
2. web-app confirms ownership of wallet through the submission
3. form submits and creates:
    - Submission record in database
    - Dedicated discussion thread for the submission
    - Initial status tracking
4. **Discussion Phase:**
    - All communication happens within the webapp
    - Curators and grantees communicate in real-time
    - GitHub repositories are referenced and analyzed within discussions
    - Voting and approval happens through webapp interface
    - Public can read all discussions and status updates
5. **Milestone Updates:**
    - Grantees submit milestone updates through webapp
    - Link specific GitHub repos/PRs/commits as deliverables
    - Dedicated discussion threads per milestone
    - Curator review and approval through webapp voting system

### Key Architectural Changes

**FROM:** GitHub-centric workflow with PR creation and comment-based discussion
**TO:** Webapp-centric workflow with integrated discussion system and GitHub as code reference

**Benefits:**
- Unified platform for all communication
- Better structure for voting and approval workflows
- Enhanced transparency with public discussion viewing
- Real-time updates and notifications
- AI integration opportunities for discussion analysis
- Cleaner separation between code repositories and review process 