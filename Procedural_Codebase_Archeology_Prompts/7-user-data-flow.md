# User Data Model Diagram

## Overview
GrantFlow.dev implements a comprehensive user data lifecycle that spans authentication, role-based access, committee participation, submission management, and real-time collaboration. The system supports multiple user types with different permissions and workflows.

## User Data Lifecycle Diagram

```mermaid
graph TB
    subgraph "User Onboarding & Authentication"
        A1[GitHub OAuth Login]
        A2[User Profile Creation]
        A3[Role Assignment]
        A4[Primary Group Selection]
        A5[Wallet Address Setup]
    end
    
    subgraph "User Profile Management"
        B1[Profile Information]
        B2[GitHub Integration]
        B3[Wallet Connection]
        B4[Committee Memberships]
        B5[Notification Preferences]
    end
    
    subgraph "Committee Participation"
        C1[Join Committee]
        C2[Role Assignment]
        C3[Permission Configuration]
        C4[Voting Rights]
        C5[Review Access]
    end
    
    subgraph "Submission Workflow"
        D1[Create Submission]
        D2[Grant Program Selection]
        D3[Form Completion]
        D4[Committee Assignment]
        D5[Status Tracking]
    end
    
    subgraph "Review & Voting"
        E1[Review Assignment]
        E2[Discussion Participation]
        E3[Vote Casting]
        E4[Feedback Provision]
        E5[Decision Recording]
    end
    
    subgraph "Milestone Management"
        F1[Milestone Creation]
        F2[Progress Tracking]
        F3[Code Submission]
        F4[Review Process]
        F5[Approval/Rejection]
    end
    
    subgraph "Real-time Communication"
        G1[Discussion Threads]
        G2[Message Creation]
        G3[Notification Receipt]
        G4[Status Updates]
        G5[Vote Notifications]
    end
    
    subgraph "Analytics & Reporting"
        H1[Activity Tracking]
        H2[Performance Metrics]
        H3[Committee Analytics]
        H4[Platform Statistics]
        H5[Reputation Scoring]
    end
    
    %% User Journey Flow
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    A5 --> B1
    
    B1 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
    
    C5 --> D1
    D1 --> D2
    D2 --> D3
    D3 --> D4
    D4 --> D5
    
    D5 --> E1
    E1 --> E2
    E2 --> E3
    E3 --> E4
    E4 --> E5
    
    E5 --> F1
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F4 --> F5
    
    F5 --> G1
    G1 --> G2
    G2 --> G3
    G3 --> G4
    G4 --> G5
    
    G5 --> H1
    H1 --> H2
    H2 --> H3
    H3 --> H4
    H4 --> H5
```

## User Data Model Relationships

```mermaid
erDiagram
    USER {
        serial id PK
        varchar name
        varchar email UK
        varchar github_id UK
        text avatar_url
        varchar wallet_address
        integer primary_group_id FK
        varchar primary_role
        timestamp created_at
        timestamp updated_at
    }
    
    GROUP_MEMBERSHIP {
        serial id PK
        integer group_id FK
        integer user_id FK
        varchar role
        text permissions
        timestamp joined_at
        boolean is_active
    }
    
    SUBMISSION {
        serial id PK
        integer submitter_id FK
        integer submitter_group_id FK
        integer reviewer_group_id FK
        varchar title
        text description
        varchar status
        bigint total_amount
        timestamp applied_at
    }
    
    DISCUSSION {
        serial id PK
        integer submission_id FK
        integer group_id FK
        varchar type
        boolean is_public
        timestamp created_at
    }
    
    MESSAGE {
        serial id PK
        integer discussion_id FK
        integer author_id FK
        text content
        varchar message_type
        timestamp created_at
    }
    
    REVIEW {
        serial id PK
        integer submission_id FK
        integer reviewer_id FK
        integer group_id FK
        varchar vote
        text feedback
        timestamp created_at
    }
    
    NOTIFICATION {
        serial id PK
        integer user_id FK
        varchar type
        text message
        boolean is_read
        timestamp created_at
    }
    
    %% Relationships
    USER ||--o{ GROUP_MEMBERSHIP : "belongs to"
    USER ||--o{ SUBMISSION : "creates"
    USER ||--o{ MESSAGE : "writes"
    USER ||--o{ REVIEW : "performs"
    USER ||--o{ NOTIFICATION : "receives"
    SUBMISSION ||--o{ DISCUSSION : "has"
    DISCUSSION ||--o{ MESSAGE : "contains"
    SUBMISSION ||--o{ REVIEW : "receives"
```

## User Role and Permission Matrix

### **User Types and Capabilities**

#### **Platform Admin**
- **Data Access**: Full platform access, all committees, all submissions
- **Actions**: User management, committee oversight, platform configuration
- **Restrictions**: Cannot vote on submissions, cannot create submissions
- **Analytics**: Platform-wide metrics and reporting

#### **Committee Curator**
- **Data Access**: Assigned committee submissions, committee discussions
- **Actions**: Review submissions, cast votes, participate in discussions
- **Restrictions**: Limited to assigned committee, cannot access other committees
- **Analytics**: Committee-specific metrics and performance data

#### **Grantee (Team Member)**
- **Data Access**: Own submissions, team submissions, public discussions
- **Actions**: Create submissions, participate in discussions, submit milestones
- **Restrictions**: Cannot review own submissions, limited to team submissions
- **Analytics**: Personal submission history and team performance

#### **Committee Admin**
- **Data Access**: Committee management, member management, settings
- **Actions**: Add/remove members, configure workflows, manage grant programs
- **Restrictions**: Cannot vote on submissions, cannot create submissions
- **Analytics**: Committee performance and member activity

## User Data Lifecycle Stages

### **1. Authentication & Onboarding**

#### **GitHub OAuth Integration**
```mermaid
sequenceDiagram
    participant User as User
    participant GitHub as GitHub OAuth
    participant NextAuth as NextAuth.js
    participant DB as Database
    participant Session as Session Store
    
    User->>GitHub: Click "Login with GitHub"
    GitHub->>NextAuth: OAuth Callback
    NextAuth->>DB: Check Existing User
    alt User Exists
        DB-->>NextAuth: User Data
    else New User
        NextAuth->>DB: Create User Record
        DB-->>NextAuth: New User Data
    end
    NextAuth->>Session: Create JWT Session
    Session-->>User: Authentication Complete
```

#### **User Profile Creation**
- **GitHub Profile Sync**: Name, email, avatar, GitHub ID
- **Role Assignment**: Default role based on registration context
- **Primary Group**: Initial group association
- **Wallet Setup**: Optional wallet address configuration

### **2. Committee Participation**

#### **Membership Management**
```mermaid
sequenceDiagram
    participant User as User
    participant Admin as Committee Admin
    participant API as Membership API
    participant DB as Database
    participant Notifications as Notification System
    
    Admin->>API: Add User to Committee
    API->>DB: Create Group Membership
    DB-->>API: Membership Created
    API->>Notifications: Send Welcome Notification
    Notifications-->>User: Committee Invitation
    User->>API: Accept Membership
    API->>DB: Activate Membership
    DB-->>API: Membership Activated
    API-->>User: Access Granted
```

#### **Role-Based Permissions**
- **Member**: Basic committee access, discussion participation
- **Curator**: Review access, voting rights, milestone management
- **Admin**: Committee management, member management, settings

### **3. Submission Workflow**

#### **Submission Creation Process**
```mermaid
sequenceDiagram
    participant Grantee as Grantee
    participant Form as Submission Form
    participant API as Submission API
    participant DB as Database
    participant Committee as Reviewing Committee
    participant Notifications as Notification System
    
    Grantee->>Form: Start Submission
    Form->>API: Submit Form Data
    API->>DB: Create Submission Record
    DB-->>API: Submission Created
    API->>Committee: Assign Reviewers
    API->>Notifications: Notify Committee
    Notifications-->>Committee: New Submission Alert
    API-->>Grantee: Submission Confirmed
```

#### **Submission Data Flow**
- **Form Data**: Title, description, executive summary, GitHub repo
- **Committee Assignment**: Automatic assignment based on focus areas
- **Status Tracking**: Pending → In Review → Approved/Rejected
- **Milestone Creation**: Automatic milestone generation based on grant program

### **4. Review and Voting Process**

#### **Review Assignment and Voting**
```mermaid
sequenceDiagram
    participant Curator as Curator
    participant Submission as Submission
    participant Discussion as Discussion Thread
    participant API as Review API
    participant DB as Database
    participant Notifications as Notification System
    
    Curator->>Submission: Open Submission
    Submission->>Discussion: Join Discussion
    Discussion->>API: Cast Vote
    API->>DB: Record Vote
    DB-->>API: Vote Recorded
    API->>Notifications: Update Status
    Notifications-->>Grantee: Status Update
    API-->>Curator: Vote Confirmed
```

#### **Voting Data Management**
- **Vote Recording**: Approve, reject, abstain with feedback
- **Weighted Voting**: Different voting weights based on role
- **Binding Decisions**: Final decision recording and status updates
- **Discussion Integration**: Votes linked to discussion threads

### **5. Milestone Management**

#### **Milestone Lifecycle**
```mermaid
sequenceDiagram
    participant Grantee as Grantee
    participant Milestone as Milestone
    participant GitHub as GitHub API
    participant AI as AI Analysis
    participant Committee as Reviewing Committee
    participant API as Milestone API
    participant DB as Database
    
    Grantee->>Milestone: Submit Milestone
    Milestone->>GitHub: Fetch Repository Data
    GitHub-->>Milestone: Commit History
    Milestone->>AI: Analyze Code Changes
    AI-->>Milestone: Analysis Results
    Milestone->>API: Submit for Review
    API->>DB: Store Milestone Data
    API->>Committee: Notify Reviewers
    Committee->>API: Review and Vote
    API->>DB: Update Status
    DB-->>Grantee: Milestone Approved
```

#### **Milestone Data Flow**
- **Progress Tracking**: Status updates, completion percentages
- **Code Analysis**: AI-powered code change detection
- **Deliverable Verification**: GitHub commit and PR tracking
- **Approval Process**: Committee review and voting

### **6. Real-time Communication**

#### **Discussion and Messaging**
```mermaid
sequenceDiagram
    participant User as User
    participant Discussion as Discussion Thread
    participant API as Message API
    participant DB as Database
    participant SSE as Server-Sent Events
    participant Participants as Other Participants
    
    User->>Discussion: Write Message
    Discussion->>API: Send Message
    API->>DB: Store Message
    DB-->>API: Message Stored
    API->>SSE: Broadcast Update
    SSE-->>Participants: Real-time Update
    API-->>User: Message Sent
```

#### **Notification System**
- **Real-time Updates**: Server-sent events for live notifications
- **Multi-channel Delivery**: Webapp, PWA, email, optional Telegram
- **Notification Types**: Discussion updates, vote notifications, status changes
- **Read Status Tracking**: Notification engagement and response tracking

### **7. Analytics and Reporting**

#### **User Analytics Data Flow**
```mermaid
sequenceDiagram
    participant User as User
    participant Activity as User Activity
    participant Analytics as Analytics Engine
    participant DB as Database
    participant Reports as Reporting System
    
    User->>Activity: Perform Action
    Activity->>Analytics: Track Event
    Analytics->>DB: Store Analytics Data
    DB-->>Analytics: Data Stored
    Analytics->>Reports: Generate Reports
    Reports-->>User: Performance Metrics
```

#### **Analytics Data Collection**
- **User Activity**: Login frequency, submission creation, review participation
- **Committee Performance**: Review speed, approval rates, member engagement
- **Platform Metrics**: Total submissions, funding amounts, success rates
- **Reputation Scoring**: User and committee reputation based on performance

## Data Privacy and Security

### **User Data Protection**
- **Authentication**: Secure GitHub OAuth with JWT sessions
- **Data Encryption**: Sensitive data encrypted at rest and in transit
- **Access Control**: Role-based permissions and data access restrictions
- **Audit Logging**: User activity tracking for security and compliance

### **Data Retention**
- **User Profiles**: Retained for account lifetime
- **Submissions**: Retained for transparency and audit purposes
- **Discussions**: Retained for historical context and transparency
- **Analytics**: Aggregated data retained for platform insights

### **Data Export and Deletion**
- **User Data Export**: Complete user data export functionality
- **Account Deletion**: Soft deletion with data anonymization
- **Data Portability**: User data export in standard formats
- **Compliance**: GDPR and privacy regulation compliance

## User Experience Optimization

### **Performance Considerations**
- **Data Caching**: SWR for efficient data fetching and caching
- **Real-time Updates**: Server-sent events for live updates
- **Form Optimization**: React Hook Form for performant forms
- **Mobile Optimization**: PWA support for mobile users

### **Accessibility Features**
- **Screen Reader Support**: Accessible UI components with Radix UI
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG compliant color schemes
- **Responsive Design**: Mobile-first responsive design

### **User Onboarding**
- **Progressive Disclosure**: Gradual feature introduction
- **Contextual Help**: In-app guidance and tooltips
- **Role-based Tutorials**: Customized onboarding based on user role
- **Feedback Collection**: User feedback and improvement suggestions
