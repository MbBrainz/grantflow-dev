# User Experience (UX) Flow Diagram

## Overview
GrantFlow.dev provides a comprehensive user experience flow that supports multiple user types (grantees, curators, admins) through the complete grant lifecycle from application to payout. The UX is designed for transparency, collaboration, and efficient grant management.

## User Experience Flow Diagram

```mermaid
graph TB
    subgraph "User Onboarding"
        A1[Landing Page]
        A2[GitHub OAuth Login]
        A3[User Profile Setup]
        A4[Role Assignment]
        A5[Dashboard Access]
    end
    
    subgraph "Grantee Experience"
        B1[Browse Committees]
        B2[Select Grant Program]
        B3[Create Submission]
        B4[Submit Application]
        B5[Track Status]
        B6[Participate in Discussion]
        B7[Submit Milestones]
        B8[Receive Payouts]
    end
    
    subgraph "Curator Experience"
        C1[Review Dashboard]
        C2[Filter Submissions]
        C3[Open Submission]
        C4[Review Details]
        C5[Participate in Discussion]
        C6[Cast Vote]
        C7[Provide Feedback]
        C8[Track Committee Performance]
    end
    
    subgraph "Admin Experience"
        D1[Admin Dashboard]
        D2[Manage Committees]
        D3[Manage Users]
        D4[Configure Settings]
        D5[Monitor Analytics]
        D6[Platform Management]
    end
    
    subgraph "Committee Management"
        E1[Committee Setup]
        E2[Member Management]
        E3[Grant Program Configuration]
        E4[Workflow Customization]
        E5[Multisig Setup]
        E6[Performance Tracking]
    end
    
    subgraph "Real-time Collaboration"
        F1[Discussion Threads]
        F2[Live Notifications]
        F3[Status Updates]
        F4[Vote Notifications]
        F5[Milestone Updates]
        F6[System Alerts]
    end
    
    subgraph "Transparency Features"
        G1[Public Submission Views]
        G2[Committee Performance]
        G3[Platform Analytics]
        G4[Public Discussions]
        G5[Voting History]
        G6[Success Metrics]
    end
    
    %% User Journey Flow
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    
    A5 --> B1
    A5 --> C1
    A5 --> D1
    
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5
    B5 --> B6
    B6 --> B7
    B7 --> B8
    
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
    C5 --> C6
    C6 --> C7
    C7 --> C8
    
    D1 --> D2
    D2 --> D3
    D3 --> D4
    D4 --> D5
    D5 --> D6
    
    B4 --> E1
    C1 --> E1
    D1 --> E1
    
    E1 --> E2
    E2 --> E3
    E3 --> E4
    E4 --> E5
    E5 --> E6
    
    B6 --> F1
    C5 --> F1
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F4 --> F5
    F5 --> F6
    
    B5 --> G1
    C8 --> G2
    D5 --> G3
    F1 --> G4
    C6 --> G5
    E6 --> G6
```

## Detailed User Experience Flows

### **1. Grantee User Journey**

#### **Application Submission Flow**
```mermaid
sequenceDiagram
    participant Grantee as Grantee
    participant Dashboard as Dashboard
    participant Form as Submission Form
    participant API as Submission API
    participant DB as Database
    participant Committee as Reviewing Committee
    participant Notifications as Notification System
    
    Grantee->>Dashboard: Access Dashboard
    Dashboard->>Grantee: Show Available Committees
    Grantee->>Dashboard: Select Committee
    Dashboard->>Form: Open Submission Form
    Form->>Grantee: Display Form Fields
    Grantee->>Form: Fill Application Details
    Form->>API: Submit Application
    API->>DB: Store Submission
    DB-->>API: Submission Created
    API->>Committee: Notify Committee
    API->>Notifications: Send Notification
    Notifications-->>Committee: New Submission Alert
    API-->>Grantee: Submission Confirmed
    Grantee->>Dashboard: Track Submission Status
```

#### **Milestone Submission Flow**
```mermaid
sequenceDiagram
    participant Grantee as Grantee
    participant Milestone as Milestone Form
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

### **2. Curator User Journey**

#### **Review and Voting Flow**
```mermaid
sequenceDiagram
    participant Curator as Curator
    participant Dashboard as Review Dashboard
    participant Submission as Submission View
    participant Discussion as Discussion Thread
    participant Vote as Voting Interface
    participant API as Review API
    participant DB as Database
    participant Grantee as Grantee
    
    Curator->>Dashboard: Access Review Dashboard
    Dashboard->>Curator: Show Pending Reviews
    Curator->>Submission: Open Submission
    Submission->>Curator: Display Submission Details
    Curator->>Discussion: Join Discussion
    Discussion->>Curator: Show Discussion Thread
    Curator->>Vote: Cast Vote
    Vote->>API: Submit Vote
    API->>DB: Record Vote
    DB-->>API: Vote Recorded
    API->>Grantee: Notify Status Change
    API-->>Curator: Vote Confirmed
```

#### **Committee Management Flow**
```mermaid
sequenceDiagram
    participant Admin as Committee Admin
    participant Management as Management Interface
    participant Members as Member Management
    participant Settings as Committee Settings
    participant API as Management API
    participant DB as Database
    participant Members as Committee Members
    
    Admin->>Management: Access Committee Management
    Management->>Admin: Show Committee Overview
    Admin->>Members: Manage Members
    Members->>Admin: Add/Remove Members
    Admin->>Settings: Configure Settings
    Settings->>API: Update Configuration
    API->>DB: Store Settings
    DB-->>API: Settings Updated
    API->>Members: Notify Changes
    API-->>Admin: Configuration Saved
```

### **3. Real-time Collaboration Experience**

#### **Discussion and Communication Flow**
```mermaid
sequenceDiagram
    participant User as User
    participant Discussion as Discussion Thread
    participant SSE as Server-Sent Events
    participant API as Message API
    participant DB as Database
    participant Participants as Other Participants
    
    User->>Discussion: Write Message
    Discussion->>API: Send Message
    API->>DB: Store Message
    DB-->>API: Message Stored
    API->>SSE: Broadcast Update
    SSE-->>Participants: Real-time Update
    API-->>User: Message Sent
    Participants->>Discussion: See New Message
    Discussion->>Participants: Display Message
```

#### **Notification Experience**
```mermaid
sequenceDiagram
    participant System as System
    participant Event as Event Trigger
    participant Notification as Notification System
    participant SSE as Server-Sent Events
    participant User as User
    participant UI as User Interface
    
    System->>Event: Status Change
    Event->>Notification: Generate Notification
    Notification->>SSE: Send Real-time Update
    SSE-->>User: Live Notification
    User->>UI: See Notification
    UI->>User: Display Toast/Alert
    User->>UI: Interact with Notification
    UI->>System: Navigate to Relevant Page
```

## User Interface Components

### **1. Dashboard Components**

#### **Grantee Dashboard**
- **Submission Overview**: List of user's submissions with status
- **Committee Browser**: Available committees and grant programs
- **Milestone Tracker**: Progress tracking for active grants
- **Notification Center**: Real-time updates and alerts
- **Profile Management**: User profile and settings

#### **Curator Dashboard**
- **Review Queue**: Pending submissions for review
- **Committee Overview**: Committee performance and metrics
- **Discussion Threads**: Active discussions and conversations
- **Voting Interface**: Voting tools and decision tracking
- **Analytics**: Committee performance and success metrics

#### **Admin Dashboard**
- **Platform Overview**: System-wide statistics and metrics
- **User Management**: User management and role assignment
- **Committee Management**: Committee creation and configuration
- **System Settings**: Platform configuration and maintenance
- **Analytics**: Comprehensive platform analytics

### **2. Form and Input Components**

#### **Submission Form**
- **Multi-step Form**: Progressive form completion
- **Draft Saving**: Auto-save and draft recovery
- **Validation**: Real-time form validation
- **File Upload**: Document and code repository links
- **Preview**: Submission preview before submission

#### **Review Interface**
- **Submission Details**: Comprehensive submission information
- **Discussion Panel**: Real-time discussion interface
- **Voting Tools**: Vote casting and decision recording
- **Feedback Form**: Review feedback and comments
- **Status Tracking**: Submission status and progress

### **3. Real-time Components**

#### **Discussion Threads**
- **Live Chat**: Real-time messaging interface
- **Message Threading**: Organized conversation threads
- **User Presence**: Online status and activity indicators
- **File Sharing**: Document and code sharing
- **Notification Badges**: Unread message indicators

#### **Notification System**
- **Toast Notifications**: In-app notification toasts
- **Status Updates**: Real-time status change notifications
- **Vote Alerts**: Voting and decision notifications
- **System Alerts**: Platform and system notifications
- **Email Notifications**: Email notification delivery (planned)

## User Experience Principles

### **1. Transparency and Openness**

#### **Public Visibility**
- **Submission Status**: Public submission status and progress
- **Committee Decisions**: Transparent voting and decision process
- **Discussion History**: Public discussion threads and conversations
- **Performance Metrics**: Committee and platform performance data
- **Success Stories**: Public success stories and achievements

#### **Accountability**
- **Decision Tracking**: Complete audit trail of decisions
- **Vote History**: Public voting history and rationale
- **Performance Metrics**: Committee and individual performance
- **Timeline Tracking**: Complete timeline of submission progress
- **Outcome Reporting**: Final outcomes and results

### **2. Collaboration and Communication**

#### **Real-time Collaboration**
- **Live Discussions**: Real-time discussion and collaboration
- **Instant Notifications**: Immediate notification delivery
- **Status Synchronization**: Real-time status updates
- **Multi-user Interface**: Support for multiple concurrent users
- **Conflict Resolution**: Handling of simultaneous edits and updates

#### **Communication Tools**
- **Discussion Threads**: Organized conversation management
- **Message Types**: Different message types (comments, votes, decisions)
- **User Mentions**: User mention and notification system
- **File Sharing**: Document and code sharing capabilities
- **Search and Filter**: Message search and filtering

### **3. Efficiency and Productivity**

#### **Workflow Optimization**
- **Automated Processes**: Automated workflow and status updates
- **Bulk Operations**: Bulk actions for efficiency
- **Keyboard Shortcuts**: Keyboard shortcuts for power users
- **Quick Actions**: Quick action buttons and shortcuts
- **Template System**: Reusable templates and configurations

#### **Performance Features**
- **Fast Loading**: Optimized loading and rendering
- **Offline Support**: Offline functionality and sync
- **Mobile Optimization**: Mobile-first responsive design
- **Progressive Web App**: PWA capabilities for mobile experience
- **Caching**: Intelligent caching and data management

### **4. Accessibility and Usability**

#### **Accessibility Features**
- **Screen Reader Support**: Full screen reader compatibility
- **Keyboard Navigation**: Complete keyboard navigation support
- **Color Contrast**: WCAG compliant color schemes
- **Text Scaling**: Support for text scaling and zoom
- **Alternative Text**: Comprehensive alt text for images

#### **Usability Design**
- **Intuitive Navigation**: Clear and logical navigation structure
- **Consistent Design**: Consistent design language and patterns
- **Error Handling**: Clear error messages and recovery
- **Help System**: Contextual help and documentation
- **User Onboarding**: Guided user onboarding and tutorials

## Mobile and Responsive Experience

### **1. Mobile-First Design**

#### **Responsive Layout**
- **Adaptive Design**: Responsive design for all screen sizes
- **Touch Optimization**: Touch-friendly interface elements
- **Mobile Navigation**: Mobile-optimized navigation patterns
- **Gesture Support**: Touch gestures and interactions
- **Performance**: Optimized performance for mobile devices

#### **Progressive Web App**
- **App-like Experience**: Native app-like user experience
- **Offline Functionality**: Offline access and synchronization
- **Push Notifications**: Mobile push notification support
- **Installation**: App installation and home screen support
- **Background Sync**: Background synchronization and updates

### **2. Cross-Platform Consistency**

#### **Unified Experience**
- **Consistent Interface**: Consistent interface across platforms
- **Synchronized Data**: Real-time data synchronization
- **Cross-Platform Notifications**: Unified notification system
- **Shared State**: Shared application state
- **Seamless Transitions**: Smooth transitions between platforms

## User Feedback and Iteration

### **1. User Feedback Collection**

#### **Feedback Mechanisms**
- **In-app Feedback**: Built-in feedback collection
- **User Surveys**: Regular user satisfaction surveys
- **Usage Analytics**: User behavior and usage analytics
- **Performance Metrics**: User experience performance metrics
- **Error Reporting**: User error reporting and tracking

#### **Continuous Improvement**
- **A/B Testing**: A/B testing for interface improvements
- **User Research**: Regular user research and interviews
- **Usability Testing**: Usability testing and optimization
- **Performance Monitoring**: Continuous performance monitoring
- **Feature Iteration**: Iterative feature development and improvement

### **2. User Experience Metrics**

#### **Key Performance Indicators**
- **User Engagement**: User engagement and activity metrics
- **Task Completion**: Task completion rates and success
- **User Satisfaction**: User satisfaction and feedback scores
- **Performance Metrics**: Page load times and responsiveness
- **Error Rates**: Error rates and user experience issues

#### **Success Metrics**
- **Submission Success**: Successful submission completion rates
- **Review Efficiency**: Review process efficiency and speed
- **User Retention**: User retention and engagement
- **Platform Adoption**: Platform adoption and growth
- **Committee Performance**: Committee performance and success
