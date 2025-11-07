# API Endpoint Summary and Diagram

## Overview
GrantFlow.dev implements a RESTful API architecture using Next.js API routes with server actions for form handling. The API supports authentication, real-time notifications, dashboard statistics, and committee management.

## API Endpoints Summary

### **Authentication Endpoints**

#### **NextAuth.js Authentication**
- **Route**: `/api/auth/[...nextauth]/route.ts`
- **Methods**: GET, POST
- **Purpose**: GitHub OAuth authentication and session management
- **Authentication**: None (public endpoint)
- **Response**: JWT session tokens and user data

### **User Management Endpoints**

#### **User Profile**
- **Route**: `/api/user/route.ts`
- **Methods**: GET
- **Purpose**: Retrieve current user profile and authentication status
- **Authentication**: Required (NextAuth session)
- **Response**: User profile data with committee memberships

#### **User Committees**
- **Route**: `/api/user/committees/route.ts`
- **Methods**: GET
- **Purpose**: Get user's committee memberships and roles
- **Authentication**: Required (NextAuth session)
- **Response**: List of committees with user roles and permissions

#### **Committee Membership Management**
- **Route**: `/api/user/committee-membership/route.ts`
- **Methods**: GET, POST, DELETE
- **Purpose**: Manage user committee memberships
- **Authentication**: Required (NextAuth session)
- **Response**: Membership status and role information

### **Dashboard Endpoints**

#### **Dashboard Statistics**
- **Route**: `/api/dashboard/stats/route.ts`
- **Methods**: GET
- **Purpose**: Retrieve dashboard statistics and metrics
- **Authentication**: Required (NextAuth session)
- **Response**: User-specific dashboard data including:
  - Submission statistics
  - Committee performance metrics
  - Upcoming deadlines
  - Recent activity

### **Team Management Endpoints**

#### **Team Information**
- **Route**: `/api/team/route.ts`
- **Methods**: GET
- **Purpose**: Get team/committee information for current user
- **Authentication**: Required (NextAuth session)
- **Response**: Team details, committee memberships, and user roles

### **Notification Endpoints**

#### **Real-time Notification Stream**
- **Route**: `/api/notifications/stream/route.ts`
- **Methods**: GET
- **Purpose**: Server-sent events for real-time notifications
- **Authentication**: Required (NextAuth session)
- **Response**: SSE stream with notification data
- **Features**:
  - Live discussion updates
  - Vote notifications
  - Status change alerts
  - Connection heartbeat

### **Payment Processing Endpoints (Currently Disabled)**

#### **Stripe Checkout**
- **Route**: `/api/stripe/checkout/route.ts`
- **Methods**: GET
- **Purpose**: Stripe payment processing (currently disabled)
- **Authentication**: Required (NextAuth session)
- **Status**: Disabled for MVP

#### **Stripe Webhook**
- **Route**: `/api/stripe/webhook/route.ts`
- **Methods**: POST
- **Purpose**: Stripe webhook handling (currently disabled)
- **Authentication**: Stripe webhook signature verification
- **Status**: Disabled for MVP

## API Endpoint Relationships Diagram

```mermaid
graph TB
    subgraph "Authentication Layer"
        A1[/api/auth/[...nextauth]]
        A2[NextAuth.js Session]
        A3[JWT Token Management]
    end
    
    subgraph "User Management"
        U1[/api/user]
        U2[/api/user/committees]
        U3[/api/user/committee-membership]
        U4[User Profile Data]
        U5[Committee Memberships]
    end
    
    subgraph "Dashboard & Analytics"
        D1[/api/dashboard/stats]
        D2[User Statistics]
        D3[Committee Metrics]
        D4[Upcoming Deadlines]
    end
    
    subgraph "Team Management"
        T1[/api/team]
        T2[Team Information]
        T3[Committee Details]
        T4[Member Roles]
    end
    
    subgraph "Real-time Communication"
        N1[/api/notifications/stream]
        N2[Server-Sent Events]
        N3[Live Updates]
        N4[Notification Delivery]
    end
    
    subgraph "Payment Processing (Disabled)"
        S1[/api/stripe/checkout]
        S2[/api/stripe/webhook]
        S3[Payment Processing]
        S4[Webhook Handling]
    end
    
    subgraph "Database Layer"
        DB1[User Data]
        DB2[Committee Data]
        DB3[Submission Data]
        DB4[Notification Data]
    end
    
    subgraph "External Services"
        E1[GitHub API]
        E2[Polkadot API]
        E3[OpenAI API]
        E4[Supabase Database]
    end
    
    %% Authentication Flow
    A1 --> A2
    A2 --> A3
    A3 --> U1
    A3 --> D1
    A3 --> T1
    A3 --> N1
    
    %% User Management Flow
    U1 --> U4
    U2 --> U5
    U3 --> U5
    U4 --> DB1
    U5 --> DB2
    
    %% Dashboard Flow
    D1 --> D2
    D1 --> D3
    D1 --> D4
    D2 --> DB1
    D3 --> DB2
    D4 --> DB3
    
    %% Team Management Flow
    T1 --> T2
    T1 --> T3
    T1 --> T4
    T2 --> DB1
    T3 --> DB2
    T4 --> DB2
    
    %% Real-time Flow
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> DB4
    
    %% External Integrations
    U1 --> E1
    D1 --> E2
    N1 --> E3
    DB1 --> E4
    DB2 --> E4
    DB3 --> E4
    DB4 --> E4
```

## API Endpoint Specifications

### **Authentication Endpoints**

#### **GET /api/auth/[...nextauth]**
```typescript
// NextAuth.js handler for authentication
export async function GET(request: NextRequest) {
  // Handles GitHub OAuth callback
  // Creates or updates user session
  // Returns JWT token
}

export async function POST(request: NextRequest) {
  // Handles authentication requests
  // Processes login/logout actions
  // Manages session state
}
```

**Response Format:**
```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "image": "avatar_url",
    "githubId": "github_id"
  },
  "accessToken": "jwt_token",
  "expires": "2024-01-01T00:00:00.000Z"
}
```

### **User Management Endpoints**

#### **GET /api/user**
```typescript
export async function GET() {
  const user = await getUser()
  return Response.json(user)
}
```

**Response Format:**
```json
{
  "id": 1,
  "name": "User Name",
  "email": "user@example.com",
  "githubId": "123456",
  "avatarUrl": "https://avatars.githubusercontent.com/u/123456",
  "walletAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "primaryGroupId": 1,
  "primaryRole": "curator",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### **GET /api/user/committees**
```typescript
export async function GET(request: NextRequest) {
  const user = await getUser()
  const committees = await getUserCommittees(user.id)
  return Response.json({ user, committees })
}
```

**Response Format:**
```json
{
  "user": { /* user object */ },
  "committees": [
    {
      "id": 1,
      "name": "Infrastructure Development Foundation",
      "type": "committee",
      "isActive": true,
      "role": "curator",
      "permissions": ["review", "vote", "manage"]
    }
  ]
}
```

### **Dashboard Endpoints**

#### **GET /api/dashboard/stats**
```typescript
export async function GET() {
  const user = await getUser()
  const [stats, deadlines] = await Promise.all([
    getDashboardStats(),
    getUpcomingDeadlines(user.id)
  ])
  return NextResponse.json({ ...stats, upcomingDeadlines: deadlines })
}
```

**Response Format:**
```json
{
  "totalSubmissions": 25,
  "pendingReviews": 8,
  "completedMilestones": 12,
  "totalFunding": 150000,
  "upcomingDeadlines": [
    {
      "id": 1,
      "title": "Milestone 1 Review",
      "dueDate": "2024-01-15T00:00:00.000Z",
      "submissionId": 123
    }
  ]
}
```

### **Team Management Endpoints**

#### **GET /api/team**
```typescript
export async function GET() {
  const user = await getUser()
  const committees = await getUserCommittees(user.id)
  return Response.json({
    user,
    committees: committees.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      isActive: c.isActive
    }))
  })
}
```

**Response Format:**
```json
{
  "user": { /* user object */ },
  "committees": [
    {
      "id": 1,
      "name": "Infrastructure Development Foundation",
      "type": "committee",
      "isActive": true
    }
  ]
}
```

### **Notification Endpoints**

#### **GET /api/notifications/stream**
```typescript
export async function GET(request: NextRequest) {
  const user = await getUser()
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      const welcomeMessage = {
        type: 'connection',
        message: 'Connected to notification stream',
        timestamp: new Date().toISOString(),
        userId: user.id
      }
      controller.enqueue(`data: ${JSON.stringify(welcomeMessage)}\n\n`)
      
      // Store controller reference for this user
      global.notificationStreams.set(user.id, controller)
      
      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        const heartbeatMessage = {
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        }
        controller.enqueue(`data: ${JSON.stringify(heartbeatMessage)}\n\n`)
      }, 30000)
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

**SSE Response Format:**
```
data: {"type":"connection","message":"Connected to notification stream","timestamp":"2024-01-01T00:00:00.000Z","userId":1}

data: {"type":"heartbeat","timestamp":"2024-01-01T00:00:00.000Z"}

data: {"type":"notification","message":"New submission received","timestamp":"2024-01-01T00:00:00.000Z","userId":1}
```

## API Authentication and Security

### **Authentication Methods**
- **NextAuth.js**: GitHub OAuth with JWT sessions
- **Session Management**: HTTP-only cookies with secure flags
- **Token Validation**: JWT token verification for protected routes
- **Role-based Access**: User role validation for endpoint access

### **Security Headers**
```typescript
// Security headers for API responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'"
}
```

### **Rate Limiting**
- **Authentication Endpoints**: 5 requests per minute
- **User Endpoints**: 100 requests per minute
- **Dashboard Endpoints**: 60 requests per minute
- **Notification Stream**: 1 connection per user

## API Error Handling

### **Error Response Format**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789"
}
```

### **Common Error Codes**
- **401 Unauthorized**: Invalid or expired authentication
- **403 Forbidden**: Insufficient permissions for endpoint
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side error

### **Error Handling Implementation**
```typescript
export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    const data = await fetchData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

## API Performance and Optimization

### **Caching Strategy**
- **User Data**: 5-minute cache for user profile data
- **Dashboard Stats**: 1-minute cache for dashboard statistics
- **Committee Data**: 10-minute cache for committee information
- **Real-time Data**: No caching for notification streams

### **Response Optimization**
- **Data Filtering**: Only return necessary fields
- **Pagination**: Implement pagination for large datasets
- **Compression**: Gzip compression for API responses
- **Connection Pooling**: Database connection optimization

### **Monitoring and Analytics**
- **Request Logging**: Comprehensive request/response logging
- **Performance Metrics**: Response time and throughput monitoring
- **Error Tracking**: Error rate and type analysis
- **Usage Analytics**: Endpoint usage and user behavior tracking

## Future API Enhancements

### **Planned Endpoints**
- **Committee Management**: `/api/committees/*` for committee CRUD operations
- **Submission Management**: `/api/submissions/*` for submission lifecycle
- **Analytics**: `/api/analytics/*` for platform metrics
- **Public API**: `/api/public/*` for public transparency features

### **API Versioning**
- **Version 1**: Current implementation
- **Version 2**: Planned enhancements with backward compatibility
- **Deprecation Policy**: 6-month notice for endpoint deprecation
- **Migration Support**: Automated migration tools for API changes
