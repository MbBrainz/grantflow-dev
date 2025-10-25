# Configuration & Environment Variables Diagram

## Overview
GrantFlow.dev uses a comprehensive configuration system with environment variables, database settings, and external service integrations. The configuration is managed through environment variables, with different settings for development, staging, and production environments.

## Configuration Architecture Diagram

```mermaid
graph TB
    subgraph "Environment Configuration"
        ENV[Environment Variables]
        DEV[Development]
        STAGING[Staging]
        PROD[Production]
    end
    
    subgraph "Application Configuration"
        NEXT[Next.js Config]
        AUTH[Authentication Config]
        DB[Database Config]
        API[API Configuration]
    end
    
    subgraph "External Services"
        GITHUB[GitHub OAuth]
        POLKADOT[Polkadot API]
        OPENAI[OpenAI API]
        PUSHER[Pusher Service]
        SUPABASE[Supabase Database]
    end
    
    subgraph "Security Configuration"
        SECRETS[Secret Management]
        KEYS[API Keys]
        TOKENS[Access Tokens]
        CERTS[Certificates]
    end
    
    subgraph "Database Configuration"
        POSTGRES[PostgreSQL]
        REDIS[Redis Cache]
        MIGRATIONS[Database Migrations]
        SCHEMA[Schema Configuration]
    end
    
    subgraph "Deployment Configuration"
        VERCEL[Vercel Platform]
        CDN[Content Delivery]
        EDGE[Edge Functions]
        MONITORING[Monitoring]
    end
    
    %% Configuration Flow
    ENV --> DEV
    ENV --> STAGING
    ENV --> PROD
    
    DEV --> NEXT
    STAGING --> NEXT
    PROD --> NEXT
    
    NEXT --> AUTH
    NEXT --> DB
    NEXT --> API
    
    AUTH --> GITHUB
    API --> POLKADOT
    API --> OPENAI
    API --> PUSHER
    
    DB --> POSTGRES
    DB --> REDIS
    DB --> MIGRATIONS
    DB --> SCHEMA
    
    GITHUB --> SECRETS
    POLKADOT --> KEYS
    OPENAI --> TOKENS
    PUSHER --> CERTS
    
    POSTGRES --> SUPABASE
    REDIS --> SUPABASE
    
    NEXT --> VERCEL
    VERCEL --> CDN
    VERCEL --> EDGE
    VERCEL --> MONITORING
```

## Environment Variables Configuration

### **1. Core Application Configuration**

#### **Next.js Configuration**
```env
# Application Environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://grantflow.dev
NEXT_PUBLIC_APP_NAME=GrantFlow.dev
NEXT_PUBLIC_APP_DESCRIPTION=Multi-committee grant management platform

# Next.js Specific
NEXT_PUBLIC_VERCEL_URL=https://grantflow-dev.vercel.app
NEXT_PUBLIC_VERCEL_ENV=production
```

#### **Authentication Configuration**
```env
# NextAuth.js Configuration
NEXTAUTH_URL=https://grantflow.dev
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_DEBUG=false

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_APP_ID=your_github_app_id
GITHUB_APP_PRIVATE_KEY=your_github_app_private_key
```

#### **Database Configuration**
```env
# Primary Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database_name
DATABASE_HOST=your_database_host
DATABASE_PORT=5432
DATABASE_NAME=grantflow
DATABASE_USER=your_database_user
DATABASE_PASSWORD=your_database_password

# Redis Cache
REDIS_URL=redis://username:password@host:port
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### **2. External Service Configuration**

#### **GitHub Integration**
```env
# GitHub API Configuration
GITHUB_API_URL=https://api.github.com
GITHUB_API_VERSION=2022-11-28
GITHUB_RATE_LIMIT=5000
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

#### **Polkadot Blockchain Integration**
```env
# Polkadot Network Configuration
POLKADOT_RPC_URL=wss://rpc.polkadot.io
POLKADOT_WS_URL=wss://rpc.polkadot.io
POLKADOT_API_URL=https://api.polkadot.io
POLKADOT_NETWORK=polkadot
POLKADOT_CHAIN=polkadot
```

#### **AI and LLM Services**
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=4000

# Akash Chat API
AKASH_CHATAPI_KEY=your_akash_api_key
AKASH_CHATAPI_URL=https://api.akash.chat/v1
AKASH_MODEL=gpt-4
AKASH_TEMPERATURE=0.7
```

#### **Real-time Communication**
```env
# Pusher Configuration
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
PUSHER_USE_TLS=true
```

#### **Payment Processing**
```env
# Stripe Configuration (Currently Disabled)
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_CURRENCY=USD
```

### **3. Database and Storage Configuration**

#### **Supabase Configuration**
```env
# Supabase Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_PASSWORD=your_supabase_db_password
```

#### **File Storage Configuration**
```env
# File Storage
STORAGE_PROVIDER=supabase
STORAGE_BUCKET=grantflow-files
STORAGE_REGION=us-east-1
STORAGE_MAX_FILE_SIZE=10485760
STORAGE_ALLOWED_TYPES=image/jpeg,image/png,application/pdf
```

### **4. Security Configuration**

#### **Security Settings**
```env
# Security Configuration
AUTH_SECRET=your_auth_secret_key
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key
SESSION_SECRET=your_session_secret

# CORS Configuration
CORS_ORIGIN=https://grantflow.dev
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization
```

#### **Rate Limiting**
```env
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_SKIP_FAILED_REQUESTS=false
```

### **5. Monitoring and Analytics**

#### **Application Monitoring**
```env
# Monitoring Configuration
MONITORING_ENABLED=true
MONITORING_PROVIDER=vercel
MONITORING_API_KEY=your_monitoring_api_key
MONITORING_ENVIRONMENT=production

# Error Tracking
ERROR_TRACKING_ENABLED=true
ERROR_TRACKING_DSN=your_error_tracking_dsn
ERROR_TRACKING_ENVIRONMENT=production
```

#### **Analytics Configuration**
```env
# Analytics Configuration
ANALYTICS_ENABLED=true
ANALYTICS_PROVIDER=vercel
ANALYTICS_TRACKING_ID=your_analytics_tracking_id
ANALYTICS_PRIVACY_MODE=true
```

## Configuration Management

### **1. Environment-Specific Configuration**

#### **Development Environment**
```env
# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_DEBUG=true

# Development Database
DATABASE_URL=postgresql://localhost:5432/grantflow_dev
REDIS_URL=redis://localhost:6379

# Development Services
GITHUB_CLIENT_ID=dev_github_client_id
POLKADOT_RPC_URL=wss://localhost:9944
OPENAI_API_KEY=dev_openai_key
```

#### **Staging Environment**
```env
# Staging Configuration
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.grantflow.dev
NEXTAUTH_URL=https://staging.grantflow.dev
NEXTAUTH_DEBUG=false

# Staging Database
DATABASE_URL=postgresql://staging_host:5432/grantflow_staging
REDIS_URL=redis://staging_host:6379

# Staging Services
GITHUB_CLIENT_ID=staging_github_client_id
POLKADOT_RPC_URL=wss://staging.polkadot.io
OPENAI_API_KEY=staging_openai_key
```

#### **Production Environment**
```env
# Production Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://grantflow.dev
NEXTAUTH_URL=https://grantflow.dev
NEXTAUTH_DEBUG=false

# Production Database
DATABASE_URL=postgresql://prod_host:5432/grantflow_prod
REDIS_URL=redis://prod_host:6379

# Production Services
GITHUB_CLIENT_ID=prod_github_client_id
POLKADOT_RPC_URL=wss://rpc.polkadot.io
OPENAI_API_KEY=prod_openai_key
```

### **2. Configuration Validation**

#### **Environment Variable Validation**
```typescript
// src/lib/config/validation.ts
import { z } from 'zod'

const configSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  
  // Authentication
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  
  // External Services
  POLKADOT_RPC_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  PUSHER_APP_ID: z.string().min(1),
  PUSHER_KEY: z.string().min(1),
  PUSHER_SECRET: z.string().min(1),
})

export function validateConfig() {
  try {
    return configSchema.parse(process.env)
  } catch (error) {
    console.error('Configuration validation failed:', error)
    throw new Error('Invalid configuration')
  }
}
```

#### **Configuration Loading**
```typescript
// src/lib/config/index.ts
import { validateConfig } from './validation'

export const config = validateConfig()

export const isDevelopment = config.NODE_ENV === 'development'
export const isStaging = config.NODE_ENV === 'staging'
export const isProduction = config.NODE_ENV === 'production'

export const databaseConfig = {
  url: config.DATABASE_URL,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  name: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
}

export const redisConfig = {
  url: config.REDIS_URL,
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
}

export const authConfig = {
  url: config.NEXTAUTH_URL,
  secret: config.NEXTAUTH_SECRET,
  debug: config.NEXTAUTH_DEBUG,
  github: {
    clientId: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_CLIENT_SECRET,
  },
}

export const externalServices = {
  polkadot: {
    rpcUrl: config.POLKADOT_RPC_URL,
    wsUrl: process.env.POLKADOT_WS_URL,
    apiUrl: process.env.POLKADOT_API_URL,
  },
  openai: {
    apiKey: config.OPENAI_API_KEY,
    apiUrl: process.env.OPENAI_API_URL,
    model: process.env.OPENAI_MODEL,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  },
  pusher: {
    appId: config.PUSHER_APP_ID,
    key: config.PUSHER_KEY,
    secret: config.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
  },
}
```

### **3. Configuration Dependencies**

#### **Module Dependencies**
```mermaid
graph TB
    subgraph "Configuration Dependencies"
        ENV[Environment Variables]
        VALIDATION[Configuration Validation]
        LOADING[Configuration Loading]
        USAGE[Configuration Usage]
    end
    
    subgraph "Application Modules"
        AUTH[Authentication Module]
        DB[Database Module]
        API[API Module]
        EXTERNAL[External Services]
    end
    
    subgraph "External Dependencies"
        GITHUB[GitHub API]
        POLKADOT[Polkadot API]
        OPENAI[OpenAI API]
        PUSHER[Pusher Service]
    end
    
    %% Dependencies
    ENV --> VALIDATION
    VALIDATION --> LOADING
    LOADING --> USAGE
    
    USAGE --> AUTH
    USAGE --> DB
    USAGE --> API
    USAGE --> EXTERNAL
    
    AUTH --> GITHUB
    API --> POLKADOT
    API --> OPENAI
    API --> PUSHER
```

### **4. Configuration Security**

#### **Secret Management**
```typescript
// src/lib/config/secrets.ts
export class SecretManager {
  private static instance: SecretManager
  private secrets: Map<string, string> = new Map()
  
  private constructor() {
    this.loadSecrets()
  }
  
  public static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager()
    }
    return SecretManager.instance
  }
  
  private loadSecrets() {
    // Load secrets from environment variables
    const secretKeys = [
      'NEXTAUTH_SECRET',
      'GITHUB_CLIENT_SECRET',
      'OPENAI_API_KEY',
      'PUSHER_SECRET',
      'DATABASE_PASSWORD',
      'REDIS_PASSWORD'
    ]
    
    secretKeys.forEach(key => {
      const value = process.env[key]
      if (value) {
        this.secrets.set(key, value)
      }
    })
  }
  
  public getSecret(key: string): string | undefined {
    return this.secrets.get(key)
  }
  
  public hasSecret(key: string): boolean {
    return this.secrets.has(key)
  }
}
```

#### **Configuration Encryption**
```typescript
// src/lib/config/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

export class ConfigEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16
  
  public static encrypt(text: string, key: string): string {
    const keyBuffer = Buffer.from(key, 'hex')
    const iv = randomBytes(this.IV_LENGTH)
    const cipher = createCipheriv(this.ALGORITHM, keyBuffer, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted
  }
  
  public static decrypt(encryptedText: string, key: string): string {
    const keyBuffer = Buffer.from(key, 'hex')
    const [ivHex, tagHex, encrypted] = encryptedText.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    
    const decipher = createDecipheriv(this.ALGORITHM, keyBuffer, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}
```

### **5. Configuration Monitoring**

#### **Configuration Health Check**
```typescript
// src/lib/config/health.ts
export class ConfigHealthCheck {
  public static async checkConfiguration(): Promise<{
    status: 'healthy' | 'unhealthy'
    issues: string[]
    warnings: string[]
  }> {
    const issues: string[] = []
    const warnings: string[] = []
    
    // Check required environment variables
    const requiredVars = [
      'NODE_ENV',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'DATABASE_URL',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET'
    ]
    
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        issues.push(`Missing required environment variable: ${varName}`)
      }
    })
    
    // Check database connectivity
    try {
      await this.checkDatabaseConnection()
    } catch (error) {
      issues.push(`Database connection failed: ${error.message}`)
    }
    
    // Check external services
    try {
      await this.checkExternalServices()
    } catch (error) {
      warnings.push(`External service check failed: ${error.message}`)
    }
    
    return {
      status: issues.length > 0 ? 'unhealthy' : 'healthy',
      issues,
      warnings
    }
  }
  
  private static async checkDatabaseConnection(): Promise<void> {
    // Database connection check implementation
  }
  
  private static async checkExternalServices(): Promise<void> {
    // External services check implementation
  }
}
```

#### **Configuration Audit**
```typescript
// src/lib/config/audit.ts
export class ConfigAudit {
  public static auditConfiguration(): {
    timestamp: string
    environment: string
    variables: Record<string, { present: boolean; type: string }>
    security: {
      hasSecrets: boolean
      hasEncryption: boolean
      hasValidation: boolean
    }
  } {
    const timestamp = new Date().toISOString()
    const environment = process.env.NODE_ENV || 'unknown'
    
    const variables: Record<string, { present: boolean; type: string }> = {}
    const allVars = [
      'NODE_ENV', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET',
      'DATABASE_URL', 'REDIS_URL', 'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET', 'OPENAI_API_KEY', 'PUSHER_APP_ID'
    ]
    
    allVars.forEach(varName => {
      const value = process.env[varName]
      variables[varName] = {
        present: !!value,
        type: typeof value
      }
    })
    
    return {
      timestamp,
      environment,
      variables,
      security: {
        hasSecrets: !!process.env.NEXTAUTH_SECRET,
        hasEncryption: !!process.env.ENCRYPTION_KEY,
        hasValidation: true
      }
    }
  }
}
```

## Configuration Best Practices

### **1. Environment Management**

#### **Environment Separation**
- **Development**: Local development with debug settings
- **Staging**: Pre-production testing environment
- **Production**: Live production environment
- **Feature Branches**: Isolated feature testing

#### **Configuration Validation**
- **Startup Validation**: Validate all configuration on application startup
- **Runtime Validation**: Continuous configuration validation
- **Error Handling**: Graceful handling of configuration errors
- **Fallback Values**: Sensible fallback values for optional configuration

### **2. Security Best Practices**

#### **Secret Management**
- **Environment Variables**: Use environment variables for secrets
- **Encryption**: Encrypt sensitive configuration data
- **Access Control**: Restrict access to configuration files
- **Rotation**: Regular rotation of secrets and keys

#### **Configuration Security**
- **Input Validation**: Validate all configuration input
- **Output Sanitization**: Sanitize configuration output
- **Audit Logging**: Log configuration changes and access
- **Monitoring**: Monitor configuration for security issues

### **3. Performance Optimization**

#### **Configuration Caching**
- **Memory Caching**: Cache configuration in memory
- **Lazy Loading**: Load configuration only when needed
- **Hot Reloading**: Support configuration changes without restart
- **Validation Caching**: Cache configuration validation results

#### **Configuration Optimization**
- **Minimal Configuration**: Use only necessary configuration
- **Efficient Loading**: Optimize configuration loading
- **Resource Management**: Efficient resource usage
- **Performance Monitoring**: Monitor configuration performance

### **4. Maintenance and Updates**

#### **Configuration Updates**
- **Version Control**: Version control for configuration changes
- **Change Management**: Proper change management process
- **Rollback Capability**: Ability to rollback configuration changes
- **Testing**: Test configuration changes before deployment

#### **Configuration Monitoring**
- **Health Checks**: Regular configuration health checks
- **Performance Monitoring**: Monitor configuration performance
- **Error Tracking**: Track configuration-related errors
- **Alerting**: Alert on configuration issues
