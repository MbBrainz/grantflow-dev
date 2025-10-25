# Data Stores and Database Diagram

## Overview
GrantFlow.dev uses a PostgreSQL database with Drizzle ORM, following a TypeScript-first approach where the database schema serves as the source of truth for all data types and relationships.

## Database Schema Diagram

```mermaid
erDiagram
    USERS {
        serial id PK
        varchar name
        varchar email UK
        text password_hash
        varchar github_id UK
        text avatar_url
        varchar wallet_address
        integer primary_group_id FK
        varchar primary_role
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    GROUPS {
        serial id PK
        varchar name
        text description
        varchar logo_url
        varchar type
        jsonb focus_areas
        varchar website_url
        varchar github_org
        varchar wallet_address
        boolean is_active
        jsonb settings
        timestamp created_at
        timestamp updated_at
    }

    GROUP_MEMBERSHIPS {
        serial id PK
        integer group_id FK
        integer user_id FK
        varchar role
        text permissions
        timestamp joined_at
        boolean is_active
    }

    GRANT_PROGRAMS {
        serial id PK
        integer group_id FK
        varchar name
        text description
        bigint funding_amount
        bigint min_grant_size
        bigint max_grant_size
        bigint min_milestone_size
        bigint max_milestone_size
        text requirements
        text application_template
        text milestone_structure
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    SUBMISSIONS {
        serial id PK
        integer grant_program_id FK
        integer submitter_group_id FK
        integer reviewer_group_id FK
        integer submitter_id FK
        varchar title
        text description
        text executive_summary
        text post_grant_plan
        text labels
        varchar github_repo_url
        varchar wallet_address
        varchar status
        bigint total_amount
        timestamp applied_at
        timestamp created_at
        timestamp updated_at
    }

    MILESTONES {
        serial id PK
        integer submission_id FK
        integer group_id FK
        varchar title
        text description
        jsonb requirements
        bigint amount
        timestamp due_date
        varchar status
        jsonb deliverables
        varchar github_repo_url
        varchar github_pr_url
        varchar github_commit_hash
        text code_analysis
        timestamp submitted_at
        timestamp reviewed_at
        timestamp created_at
        timestamp updated_at
    }

    DISCUSSIONS {
        serial id PK
        integer submission_id FK
        integer milestone_id FK
        integer group_id FK
        varchar type
        boolean is_public
        timestamp created_at
        timestamp updated_at
    }

    MESSAGES {
        serial id PK
        integer discussion_id FK
        integer author_id FK
        text content
        varchar message_type
        text metadata
        timestamp created_at
        timestamp updated_at
    }

    REVIEWS {
        serial id PK
        integer submission_id FK
        integer milestone_id FK
        integer group_id FK
        integer reviewer_id FK
        integer discussion_id FK
        varchar vote
        text feedback
        varchar review_type
        integer weight
        boolean is_binding
        timestamp created_at
        timestamp updated_at
    }

    PAYOUTS {
        serial id PK
        integer submission_id FK
        integer milestone_id FK
        integer group_id FK
        bigint amount
        varchar status
        varchar transaction_hash
        varchar wallet_address
        timestamp processed_at
        timestamp created_at
        timestamp updated_at
    }

    NOTIFICATIONS {
        serial id PK
        integer user_id FK
        integer submission_id FK
        integer milestone_id FK
        varchar type
        text message
        boolean is_read
        timestamp created_at
    }

    GROUP_ANALYTICS {
        serial id PK
        integer group_id FK
        varchar period
        integer total_submissions
        integer approved_submissions
        integer total_funding
        decimal success_rate
        timestamp created_at
        timestamp updated_at
    }

    PLATFORM_METRICS {
        serial id PK
        varchar period
        integer total_committees
        integer total_submissions
        integer total_funding
        decimal average_success_rate
        jsonb popular_tags
        jsonb trending_committees
        timestamp created_at
        timestamp updated_at
    }

    %% Relationships
    USERS ||--o{ GROUP_MEMBERSHIPS : "belongs to"
    GROUPS ||--o{ GROUP_MEMBERSHIPS : "has members"
    GROUPS ||--o{ GRANT_PROGRAMS : "creates"
    GROUPS ||--o{ SUBMISSIONS : "submits"
    GROUPS ||--o{ SUBMISSIONS : "reviews"
    USERS ||--o{ SUBMISSIONS : "submits"
    GRANT_PROGRAMS ||--o{ SUBMISSIONS : "receives"
    SUBMISSIONS ||--o{ MILESTONES : "has"
    GROUPS ||--o{ MILESTONES : "manages"
    SUBMISSIONS ||--o{ DISCUSSIONS : "has"
    MILESTONES ||--o{ DISCUSSIONS : "has"
    GROUPS ||--o{ DISCUSSIONS : "participates"
    DISCUSSIONS ||--o{ MESSAGES : "contains"
    USERS ||--o{ MESSAGES : "writes"
    SUBMISSIONS ||--o{ REVIEWS : "receives"
    MILESTONES ||--o{ REVIEWS : "receives"
    GROUPS ||--o{ REVIEWS : "conducts"
    USERS ||--o{ REVIEWS : "performs"
    DISCUSSIONS ||--o{ REVIEWS : "contains"
    SUBMISSIONS ||--o{ PAYOUTS : "generates"
    MILESTONES ||--o{ PAYOUTS : "triggers"
    GROUPS ||--o{ PAYOUTS : "processes"
    USERS ||--o{ NOTIFICATIONS : "receives"
    SUBMISSIONS ||--o{ NOTIFICATIONS : "generates"
    MILESTONES ||--o{ NOTIFICATIONS : "generates"
    GROUPS ||--o{ GROUP_ANALYTICS : "tracks"
```

## Entity Descriptions

### **Core Entities**

#### **Users**
- **Purpose**: Stores user profiles and authentication data
- **Key Fields**: GitHub integration, wallet addresses, primary group association
- **Relationships**: Central entity connected to all user activities
- **Special Features**: Soft deletion support, role-based access control

#### **Groups**
- **Purpose**: Unified table for both committees and teams
- **Key Fields**: Type differentiation, focus areas, settings configuration
- **Relationships**: Can submit, review, and manage submissions
- **Special Features**: JSON settings for custom workflows, multisig wallet integration

#### **Submissions**
- **Purpose**: Grant applications and proposals
- **Key Fields**: Executive summary, GitHub repo links, funding amounts
- **Relationships**: Connected to grant programs, submitter/reviewer groups
- **Special Features**: Status tracking, wallet integration for payouts

### **Workflow Entities**

#### **Milestones**
- **Purpose**: Milestone tracking and progress management
- **Key Fields**: Requirements, deliverables, GitHub integration
- **Relationships**: Belongs to submissions, managed by groups
- **Special Features**: AI code analysis, commit tracking, deliverable verification

#### **Discussions**
- **Purpose**: Real-time communication threads
- **Key Fields**: Type differentiation (submission/milestone/group), public visibility
- **Relationships**: Can be attached to submissions or milestones
- **Special Features**: Public transparency, group-specific discussions

#### **Messages**
- **Purpose**: Individual messages within discussions
- **Key Fields**: Content, message type, metadata for structured data
- **Relationships**: Belongs to discussions, authored by users
- **Special Features**: Support for votes, status changes, group decisions

#### **Reviews**
- **Purpose**: Committee voting and decision-making
- **Key Fields**: Vote options, feedback, review types, voting weights
- **Relationships**: Connected to submissions/milestones, groups, and reviewers
- **Special Features**: Weighted voting, binding decisions, multiple review types

### **Financial Entities**

#### **Payouts**
- **Purpose**: Payment processing and transaction tracking
- **Key Fields**: Amounts, transaction hashes, wallet addresses
- **Relationships**: Generated by submissions/milestones, processed by groups
- **Special Features**: Blockchain transaction integration, multisig support

### **Analytics Entities**

#### **Group Analytics**
- **Purpose**: Committee performance metrics
- **Key Fields**: Success rates, funding amounts, submission statistics
- **Relationships**: Tracks group performance over time
- **Special Features**: Period-based tracking, success rate calculations

#### **Platform Metrics**
- **Purpose**: Platform-wide statistics and insights
- **Key Fields**: Total committees, submissions, funding, trending data
- **Relationships**: Aggregates data from all groups and submissions
- **Special Features**: Popular tags, trending committees, market insights

### **Notification Entity**

#### **Notifications**
- **Purpose**: Multi-channel notification system
- **Key Fields**: User targeting, message content, read status
- **Relationships**: Connected to users, submissions, and milestones
- **Special Features**: Multi-channel delivery (webapp, PWA, email, Telegram)

## Key Design Patterns

### **1. Unified Group Model**
- Single `groups` table handles both committees and teams
- Type field differentiates between committee and team roles
- Flexible membership system with role-based permissions

### **2. Status Tracking**
- Enum-based status fields for submissions and milestones
- Consistent status progression (pending → in-review → approved/rejected)
- Audit trail with timestamps for all status changes

### **3. JSON Configuration**
- Settings stored as JSON for flexible committee configurations
- Focus areas as JSON arrays for dynamic categorization
- Deliverables as structured JSON for milestone tracking

### **4. GitHub Integration**
- Repository URLs, PR links, and commit hashes stored
- AI code analysis results stored as text
- Commit tracking for milestone verification

### **5. Blockchain Integration**
- Wallet addresses for both users and groups
- Transaction hash storage for payout verification
- Multisig wallet support for committee operations

### **6. Real-time Communication**
- Discussion threads with message threading
- Public/private visibility controls
- Metadata support for structured communication (votes, decisions)

### **7. Analytics and Metrics**
- Separate analytics tables for performance tracking
- Platform-wide metrics for transparency
- Period-based aggregation for trend analysis

## Data Flow Patterns

### **Submission Lifecycle**
1. **Creation**: User creates submission → linked to grant program
2. **Review**: Committee reviews → discussions and reviews created
3. **Approval**: Status updates → milestones created
4. **Completion**: Milestones tracked → payouts processed

### **Committee Operations**
1. **Setup**: Group created → members added → grant programs configured
2. **Review**: Submissions assigned → discussions started → votes cast
3. **Management**: Analytics tracked → performance monitored

### **Notification Flow**
1. **Trigger**: Status changes → notifications generated
2. **Delivery**: Multi-channel distribution → read status tracked
3. **Engagement**: User interactions → notification updates

## Database Constraints and Indexes

### **Unique Constraints**
- User email addresses
- GitHub IDs
- Group names (within scope)

### **Foreign Key Relationships**
- All entities properly linked with referential integrity
- Cascade deletes for dependent records
- Soft deletes for user data preservation

### **Performance Considerations**
- Indexed fields for common queries (user_id, group_id, status)
- JSON field indexing for settings and analytics
- Timestamp indexing for time-based queries

## Migration and Schema Evolution

### **Drizzle ORM Benefits**
- TypeScript-first schema definition
- Automatic migration generation
- Type safety across the application
- Schema validation with Zod integration

### **Schema Versioning**
- Incremental migration files
- Backward compatibility considerations
- Data transformation support
- Rollback capabilities
