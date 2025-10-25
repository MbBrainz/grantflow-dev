# Module Dependency Graph

## Overview
GrantFlow.dev implements a well-structured modular architecture with clear dependency relationships between different layers and components. The dependency graph shows how modules interact and depend on each other, providing insights into the system's architecture and potential refactoring opportunities.

## Core Dependency Architecture

### **1. High-Level Module Dependencies**

#### **Application Layer Dependencies**
```mermaid
graph TB
    subgraph "Application Layer"
        App[Next.js App]
        Pages[Pages & Routes]
        Components[React Components]
        Providers[Context Providers]
    end
    
    subgraph "Business Logic Layer"
        Actions[Server Actions]
        Queries[Database Queries]
        Services[External Services]
        Utils[Utility Functions]
    end
    
    subgraph "Data Layer"
        Schema[Database Schema]
        ORM[Drizzle ORM]
        DB[PostgreSQL Database]
    end
    
    subgraph "External Services"
        GitHub[GitHub API]
        Polkadot[Polkadot API]
        Auth[NextAuth.js]
        Notifications[Pusher/SSE]
    end
    
    App --> Pages
    Pages --> Components
    Components --> Providers
    Components --> Actions
    Actions --> Queries
    Queries --> Schema
    Schema --> ORM
    ORM --> DB
    Actions --> Services
    Services --> GitHub
    Services --> Polkadot
    Actions --> Auth
    Components --> Notifications
```

### **2. Detailed Module Dependency Graph**

#### **Core Module Dependencies**
```mermaid
graph TD
    subgraph "Frontend Modules"
        A1[App Layout]
        A2[Dashboard Pages]
        A3[Submission Components]
        A4[Discussion Components]
        A5[Review Components]
        A6[UI Components]
    end
    
    subgraph "Backend Modules"
        B1[Server Actions]
        B2[API Routes]
        B3[Database Queries]
        B4[Authentication]
        B5[External Services]
    end
    
    subgraph "Data Modules"
        C1[Database Schema]
        C2[Drizzle ORM]
        C3[Database Connection]
        C4[Query Builders]
    end
    
    subgraph "Utility Modules"
        D1[Validation]
        D2[Authentication Utils]
        D3[External API Clients]
        D4[Notification System]
    end
    
    A1 --> A2
    A2 --> A3
    A2 --> A4
    A2 --> A5
    A3 --> A6
    A4 --> A6
    A5 --> A6
    
    A3 --> B1
    A4 --> B1
    A5 --> B1
    B1 --> B2
    B1 --> B3
    B1 --> B4
    B1 --> B5
    
    B3 --> C1
    C1 --> C2
    C2 --> C3
    B3 --> C4
    
    B1 --> D1
    B4 --> D2
    B5 --> D3
    B1 --> D4
```

## Module Dependency Analysis

### **1. Frontend Module Dependencies**

#### **Component Dependencies**
```typescript
// Component dependency hierarchy
src/components/
├── ui/                    // Base UI components (no dependencies)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── providers/             // Context providers (depends on ui/)
│   ├── notification-provider.tsx
│   ├── session-provider.tsx
│   └── polkadot-provider.tsx
├── submissions/           // Submission components (depends on ui/, providers/)
│   ├── submission-card.tsx
│   ├── reviewer-submission-view.tsx
│   └── grantee-submission-view.tsx
├── discussion/            // Discussion components (depends on ui/, providers/)
│   ├── discussion-thread.tsx
│   └── reviewer-voting.tsx
├── milestone/            // Milestone components (depends on ui/, providers/)
│   ├── milestone-voting-panel.tsx
│   └── signatory-vote-list.tsx
└── committee/            // Committee components (depends on ui/)
    ├── committee-info-card.tsx
    └── grant-program-card.tsx
```

#### **Page Dependencies**
```typescript
// Page dependency hierarchy
src/app/
├── layout.tsx             // Root layout (depends on providers/)
├── (dashboard)/           // Dashboard pages (depends on components/)
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── submissions/
│   │   └── review/
│   └── layout.tsx
├── (login)/               // Authentication pages (depends on components/)
│   ├── login.tsx
│   ├── sign-in/
│   └── sign-up/
└── api/                   // API routes (depends on business logic/)
    ├── auth/
    ├── dashboard/
    └── notifications/
```

### **2. Backend Module Dependencies**

#### **Server Action Dependencies**
```typescript
// Server action dependencies
src/app/(dashboard)/dashboard/submissions/actions.ts
├── @/lib/db/drizzle          // Database connection
├── @/lib/db/schema           // Database schema
├── @/lib/db/queries          // Database queries
├── @/lib/auth/middleware     // Authentication middleware
├── @/lib/validation/submission // Validation schemas
└── next/cache               // Next.js cache utilities
```

#### **API Route Dependencies**
```typescript
// API route dependencies
src/app/api/
├── auth/[...nextauth]/route.ts
│   ├── @/lib/auth/next-auth  // NextAuth configuration
│   └── @/lib/db/queries      // User queries
├── dashboard/stats/route.ts
│   ├── @/lib/db/queries        // Dashboard queries
│   └── @/lib/auth/middleware // Authentication
└── notifications/stream/route.ts
    ├── @/lib/notifications/server // Notification system
    └── @/lib/auth/middleware     // Authentication
```

### **3. Data Layer Dependencies**

#### **Database Schema Dependencies**
```typescript
// Database schema dependencies
src/lib/db/schema/
├── users.ts                 // Base user schema
├── groups.ts                // Groups schema (depends on users.ts)
├── submissions.ts           // Submissions schema (depends on groups.ts, users.ts)
├── milestones.ts            // Milestones schema (depends on submissions.ts)
├── discussions.ts           // Discussions schema (depends on submissions.ts)
├── reviews.ts               // Reviews schema (depends on submissions.ts, users.ts)
├── payouts.ts               // Payouts schema (depends on submissions.ts)
└── notifications.ts         // Notifications schema (depends on users.ts)
```

#### **Query Dependencies**
```typescript
// Database query dependencies
src/lib/db/queries/
├── index.ts                 // Query exports
├── users.ts                 // User queries (depends on schema/)
├── groups.ts                // Group queries (depends on schema/)
├── submissions.ts           // Submission queries (depends on schema/)
├── milestones.ts            // Milestone queries (depends on schema/)
├── discussions.ts           // Discussion queries (depends on schema/)
├── reviews.ts               // Review queries (depends on schema/)
├── payouts.ts               // Payout queries (depends on schema/)
└── notifications.ts         // Notification queries (depends on schema/)
```

### **4. External Service Dependencies**

#### **GitHub Integration Dependencies**
```typescript
// GitHub service dependencies
src/lib/github/
├── simple-client.ts         // GitHub API client
│   ├── @octokit/rest       // Octokit REST client
│   ├── @octokit/app        // Octokit app client
│   └── @octokit/auth-app   // Octokit app authentication
└── types.ts                 // GitHub type definitions
```

#### **Polkadot Integration Dependencies**
```typescript
// Polkadot service dependencies
src/lib/polkadot/
├── client.ts               // Polkadot API client
│   ├── polkadot-api        // Polkadot API
│   └── @polkadot/util-crypto // Polkadot crypto utilities
├── multisig.ts             // Multisig functionality
│   └── @/lib/db/schema     // Database schema for multisig config
└── README.md               // Polkadot integration documentation
```

## Dependency Analysis by Layer

### **1. Presentation Layer Dependencies**

#### **Component Dependencies**
```mermaid
graph TD
    subgraph "UI Components"
        UI1[Button]
        UI2[Card]
        UI3[Input]
        UI4[Badge]
        UI5[Dialog]
    end
    
    subgraph "Feature Components"
        F1[SubmissionCard]
        F2[DiscussionThread]
        F3[MilestonePanel]
        F4[ReviewDialog]
    end
    
    subgraph "Page Components"
        P1[DashboardPage]
        P2[SubmissionPage]
        P3[ReviewPage]
    end
    
    F1 --> UI1
    F1 --> UI2
    F1 --> UI4
    F2 --> UI1
    F2 --> UI2
    F2 --> UI3
    F3 --> UI1
    F3 --> UI2
    F4 --> UI1
    F4 --> UI5
    
    P1 --> F1
    P1 --> F2
    P2 --> F1
    P2 --> F2
    P3 --> F3
    P3 --> F4
```

#### **Provider Dependencies**
```mermaid
graph TD
    subgraph "Context Providers"
        P1[SessionProvider]
        P2[NotificationProvider]
        P3[PolkadotProvider]
    end
    
    subgraph "External Services"
        E1[NextAuth.js]
        E2[Pusher/SSE]
        E3[Polkadot API]
    end
    
    P1 --> E1
    P2 --> E2
    P3 --> E3
```

### **2. Business Logic Layer Dependencies**

#### **Server Action Dependencies**
```mermaid
graph TD
    subgraph "Server Actions"
        SA1[SubmissionActions]
        SA2[ReviewActions]
        SA3[MilestoneActions]
        SA4[UserActions]
    end
    
    subgraph "Database Layer"
        DB1[Database Queries]
        DB2[Database Schema]
        DB3[Database Connection]
    end
    
    subgraph "External Services"
        ES1[GitHub API]
        ES2[Polkadot API]
        ES3[Notification Service]
    end
    
    SA1 --> DB1
    SA1 --> ES1
    SA1 --> ES3
    SA2 --> DB1
    SA2 --> ES3
    SA3 --> DB1
    SA3 --> ES1
    SA3 --> ES2
    SA4 --> DB1
    
    DB1 --> DB2
    DB2 --> DB3
```

#### **API Route Dependencies**
```mermaid
graph TD
    subgraph "API Routes"
        AR1[Auth Routes]
        AR2[Dashboard Routes]
        AR3[Notification Routes]
        AR4[User Routes]
    end
    
    subgraph "Business Logic"
        BL1[Authentication]
        BL2[Database Queries]
        BL3[External Services]
        BL4[Validation]
    end
    
    AR1 --> BL1
    AR2 --> BL2
    AR3 --> BL3
    AR4 --> BL1
    AR4 --> BL2
    
    BL1 --> BL4
    BL2 --> BL4
    BL3 --> BL4
```

### **3. Data Layer Dependencies**

#### **Database Schema Dependencies**
```mermaid
graph TD
    subgraph "Core Schemas"
        CS1[Users]
        CS2[Groups]
        CS3[GrantPrograms]
    end
    
    subgraph "Business Schemas"
        BS1[Submissions]
        BS2[Milestones]
        BS3[Discussions]
        BS4[Reviews]
        BS5[Payouts]
    end
    
    subgraph "Supporting Schemas"
        SS1[Notifications]
        SS2[GroupMemberships]
        SS3[GroupAnalytics]
        SS4[PlatformMetrics]
    end
    
    BS1 --> CS1
    BS1 --> CS2
    BS1 --> CS3
    BS2 --> BS1
    BS3 --> BS1
    BS4 --> BS1
    BS4 --> CS1
    BS5 --> BS1
    
    SS1 --> CS1
    SS2 --> CS1
    SS2 --> CS2
    SS3 --> CS2
    SS4 --> CS2
```

#### **Query Dependencies**
```mermaid
graph TD
    subgraph "Query Modules"
        Q1[User Queries]
        Q2[Group Queries]
        Q3[Submission Queries]
        Q4[Milestone Queries]
        Q5[Discussion Queries]
        Q6[Review Queries]
    end
    
    subgraph "Database Layer"
        DL1[Database Connection]
        DL2[Query Builders]
        DL3[Schema Types]
    end
    
    Q1 --> DL1
    Q1 --> DL2
    Q1 --> DL3
    Q2 --> DL1
    Q2 --> DL2
    Q2 --> DL3
    Q3 --> DL1
    Q3 --> DL2
    Q3 --> DL3
    Q4 --> DL1
    Q4 --> DL2
    Q4 --> DL3
    Q5 --> DL1
    Q5 --> DL2
    Q5 --> DL3
    Q6 --> DL1
    Q6 --> DL2
    Q6 --> DL3
```

## Dependency Metrics and Analysis

### **1. Dependency Complexity Metrics**

#### **Module Coupling Analysis**
```typescript
// Dependency coupling metrics
interface DependencyMetrics {
  totalModules: number
  highCouplingModules: string[]
  lowCouplingModules: string[]
  circularDependencies: string[]
  dependencyDepth: number
  averageDependencies: number
}

// High coupling modules (many dependencies)
const highCouplingModules = [
  'src/app/(dashboard)/dashboard/submissions/actions.ts',
  'src/lib/db/queries/index.ts',
  'src/components/discussion/discussion-thread.tsx',
  'src/lib/auth/next-auth.ts'
]

// Low coupling modules (few dependencies)
const lowCouplingModules = [
  'src/components/ui/button.tsx',
  'src/components/ui/card.tsx',
  'src/lib/utils.ts',
  'src/lib/validation/helpers.ts'
]
```

#### **Dependency Depth Analysis**
```typescript
// Dependency depth analysis
interface DependencyDepth {
  module: string
  depth: number
  dependencies: string[]
  dependents: string[]
}

// Deep dependency chains
const deepDependencies = [
  {
    module: 'src/app/(dashboard)/dashboard/submissions/actions.ts',
    depth: 5,
    dependencies: [
      'src/lib/db/drizzle',
      'src/lib/db/schema',
      'src/lib/db/queries',
      'src/lib/auth/middleware',
      'src/lib/validation/submission'
    ]
  }
]
```

### **2. Circular Dependency Analysis**

#### **Circular Dependencies**
```typescript
// Circular dependency detection
interface CircularDependency {
  modules: string[]
  cycle: string[]
  severity: 'low' | 'medium' | 'high'
}

// Potential circular dependencies
const circularDependencies = [
  {
    modules: ['src/lib/db/schema', 'src/lib/db/queries'],
    cycle: ['schema -> queries -> schema'],
    severity: 'low'
  }
]
```

### **3. Dependency Optimization Opportunities**

#### **Refactoring Opportunities**
```typescript
// Dependency optimization recommendations
interface OptimizationOpportunity {
  module: string
  issue: string
  recommendation: string
  priority: 'low' | 'medium' | 'high'
}

const optimizationOpportunities = [
  {
    module: 'src/app/(dashboard)/dashboard/submissions/actions.ts',
    issue: 'High coupling with multiple layers',
    recommendation: 'Extract business logic to service layer',
    priority: 'high'
  },
  {
    module: 'src/components/discussion/discussion-thread.tsx',
    issue: 'Direct database dependencies',
    recommendation: 'Use dependency injection for data access',
    priority: 'medium'
  }
]
```

## Dependency Management Best Practices

### **1. Dependency Design Principles**

#### **Single Responsibility Principle**
- **Module Focus**: Each module should have a single, well-defined responsibility
- **Clear Boundaries**: Dependencies should respect module boundaries
- **Minimal Coupling**: Minimize dependencies between modules
- **High Cohesion**: Keep related functionality together

#### **Dependency Inversion Principle**
- **Abstraction**: Depend on abstractions, not concretions
- **Interface Segregation**: Use specific interfaces rather than general ones
- **Dependency Injection**: Inject dependencies rather than creating them
- **Loose Coupling**: Minimize direct dependencies between modules

### **2. Dependency Management Strategies**

#### **Module Organization**
- **Layer Separation**: Clear separation between presentation, business logic, and data layers
- **Feature Grouping**: Group related modules by feature
- **Shared Utilities**: Centralize common utilities and helpers
- **External Services**: Isolate external service dependencies

#### **Dependency Injection**
- **Service Locator**: Use service locator pattern for dependencies
- **Constructor Injection**: Inject dependencies through constructors
- **Method Injection**: Inject dependencies through method parameters
- **Property Injection**: Inject dependencies through properties

### **3. Dependency Monitoring**

#### **Dependency Tracking**
- **Static Analysis**: Use tools to analyze static dependencies
- **Runtime Monitoring**: Monitor runtime dependency usage
- **Performance Impact**: Track performance impact of dependencies
- **Change Impact**: Analyze impact of dependency changes

#### **Dependency Health**
- **Coupling Metrics**: Monitor module coupling levels
- **Circular Dependencies**: Detect and resolve circular dependencies
- **Unused Dependencies**: Identify and remove unused dependencies
- **Version Conflicts**: Monitor and resolve version conflicts
