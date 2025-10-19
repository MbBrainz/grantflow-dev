# Server Actions Convention

## Always Use `validatedActionWithUser`

All Server Actions in this application MUST use the `validatedActionWithUser` pattern from `@/lib/auth/middleware`. This ensures consistent validation, authentication, and type safety.

## Pattern

```typescript
// 1. Import the middleware
import { validatedActionWithUser } from '@/lib/auth/middleware'
import { z } from 'zod'

// 2. Define Zod schema with z.coerce for automatic type conversion
const MyActionSchema = z.object({
  id: z.coerce.number(),           // Converts FormData string to number
  name: z.string().min(1),
  email: z.string().email(),
  amount: z.coerce.number().min(0), // Converts and validates
  isActive: z.coerce.boolean(),     // Converts string 'true'/'false' to boolean
})

// 3. Infer TypeScript type from schema
type MyActionData = z.infer<typeof MyActionSchema>

// 4. Export action using validatedActionWithUser
export const myAction = validatedActionWithUser(
  MyActionSchema,
  async (
    data: MyActionData,           // Validated and type-safe
    formData: FormData,            // Original FormData (rarely needed)
    user: { id: number; email: string | null }  // Authenticated user
  ) => {
    // Implementation here
    // data is already validated and typed
    // user is guaranteed to be authenticated

    // Always return one of these patterns:
    return { success: true, data: result }
    // or
    return { error: 'Something went wrong' }
  }
)
```

## Calling from Client Components

```typescript
'use client'

async function handleSubmit() {
  const formData = new FormData()
  formData.append('id', '123')
  formData.append('name', 'Example')

  // Call with empty prevState and FormData
  const result = await myAction({}, formData)

  if (result.error) {
    // Handle error
    toast({ title: 'Error', description: result.error })
  } else if (result.success) {
    // Handle success
    toast({ title: 'Success' })
  }
}
```

## Benefits

✅ **Automatic Authentication** - No need to call `getSession()` manually
✅ **Automatic Validation** - Zod schema validates all inputs
✅ **Type Safety** - Full TypeScript inference from schema to data
✅ **Type Coercion** - `z.coerce` automatically converts FormData strings
✅ **Consistent Error Handling** - Standard return types
✅ **Less Boilerplate** - No manual parsing or validation code

## Common Patterns

### Optional Fields
```typescript
const schema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  withDefault: z.string().default('default value'),
})
```

### Nested Objects
```typescript
const schema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
})
```

### Arrays
```typescript
const schema = z.object({
  tags: z.array(z.string()),
  ids: z.array(z.coerce.number()),
})

// When submitting:
formData.append('tags', JSON.stringify(['tag1', 'tag2']))
```

### Custom Validation
```typescript
const schema = z.object({
  amount: z.coerce
    .number()
    .min(0, 'Amount must be positive')
    .max(10000, 'Amount too large'),
  email: z.string()
    .email('Invalid email')
    .refine(val => val.endsWith('@company.com'), {
      message: 'Must be a company email',
    }),
})
```

## Error Handling

Always return errors in a consistent format:

```typescript
export const myAction = validatedActionWithUser(
  schema,
  async (data, formData, user) => {
    try {
      // Your logic here

      if (someCondition) {
        return { error: 'Specific error message' }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error('[myAction]: Error', error)
      return {
        error: error instanceof Error
          ? error.message
          : 'An unexpected error occurred'
      }
    }
  }
)
```

## Examples in Codebase

- `src/app/(dashboard)/dashboard/submissions/actions.ts:481` - `submitReview` (unified action for both submission and milestone reviews)
- `src/app/(dashboard)/dashboard/submissions/milestone-actions.ts:39` - `completeMilestone`
- `src/app/(dashboard)/dashboard/submissions/milestone-actions.ts:213` - `submitMilestone`

## Special Case: Optional Fields Pattern

The `submitReview` action demonstrates how to handle optional fields elegantly:

```typescript
// Schema with optional milestoneId
const submitReviewSchema = z.object({
  submissionId: z.coerce.number().min(1, 'Invalid submission ID'),
  milestoneId: z.coerce.number().optional(), // Optional!
  vote: z.enum(['approve', 'reject', 'abstain']),
  feedback: z.string().optional(),
})

// The action handles both cases
export const submitReview = validatedActionWithUser(
  submitReviewSchema,
  async (data, formData, user) => {
    // Logic adapts based on whether milestoneId is present
    const reviewType = data.milestoneId ? 'milestone' : 'submission'
    // ... rest of implementation
  }
)

// Client usage - only add milestoneId if present
const formData = new FormData()
formData.append('submissionId', String(submissionId))
if (milestoneId) {
  formData.append('milestoneId', String(milestoneId))
}
formData.append('vote', selectedVote)
```

This pattern allows a single action to handle multiple related use cases.

## Migration from Old Pattern

❌ **DON'T DO THIS** (old pattern):
```typescript
export async function myAction(formData: FormData) {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')

  const rawData = {
    id: parseInt(formData.get('id') as string),
    name: formData.get('name') as string,
  }

  const validation = schema.safeParse(rawData)
  if (!validation.success) {
    return { error: validation.error.message }
  }
  // ...
}
```

✅ **DO THIS** (new pattern):
```typescript
export const myAction = validatedActionWithUser(
  schema,
  async (data, formData, user) => {
    // data is already validated and typed
    // user is already authenticated
    // ...
  }
)
```

## Notes

- The `formData` parameter is available but rarely needed since `data` contains all validated values
- User is guaranteed to be authenticated; the middleware handles redirects automatically
- Use `z.coerce` for form fields that need type conversion (numbers, booleans, dates)
- Always use TypeScript inference with `z.infer<typeof Schema>` for type safety

## Using drizzle-zod Schemas with validatedActionWithUser

The `validatedActionWithUser` middleware now supports drizzle-zod schemas! You can use `insertSchema` directly for most cases.

**✅ Direct Use (Recommended when schema matches FormData):**

```typescript
import { insertReviewSchema, insertMessageSchema } from '@/lib/db/schema'

// Works perfectly - schema fields match FormData
export const submitReview = validatedActionWithUser(
  insertReviewSchema,
  async (data, formData, user) => {
    // data is fully typed as NewReview
    await db.insert(reviews).values({
      ...data,
      reviewerId: user.id,
    })
  }
)

export const postMessage = validatedActionWithUser(
  insertMessageSchema,
  async (data, formData, user) => {
    // data is fully typed as NewMessage
    await createMessage(data)
  }
)
```

**⚠️ Known Limitation: `.extend()` Type Inference**

While drizzle-zod schemas work directly, using `.extend()` on them causes type inference issues where extended fields become `unknown`:

```typescript
// ❌ Type inference breaks with .extend()
const schema = insertPayoutSchema.extend({
  milestoneId: z.coerce.number(), // This becomes 'unknown' in inferred type
})

export const completeMilestone = validatedActionWithUser(
  schema,
  async (data, formData, user) => {
    // data.milestoneId is typed as 'unknown' ❌
    data.milestoneId // Type error!
  }
)
```

**✅ Workaround: Manual Schema with Documentation**

When you need custom fields beyond the database schema, define a manual Zod schema:

```typescript
/**
 * Schema for completing a milestone with payout
 * Note: Defined manually due to drizzle-zod .extend() type inference issues
 * Matches insertPayoutSchema structure with FormData-specific fields
 */
const CompleteMilestoneSchema = z.object({
  milestoneId: z.coerce.number().min(1, 'Invalid milestone ID'),
  committeeId: z.coerce.number().min(1, 'Invalid committee ID'),
  transactionHash: z.string().min(1).max(128),
  blockExplorerUrl: z.string().url().max(500),
  amount: z.coerce.number().min(0),
  walletFrom: z.string().optional(),
  walletTo: z.string().optional(),
})

export const completeMilestone = validatedActionWithUser(
  CompleteMilestoneSchema,  // ✅ Full type safety
  async (data, formData, user) => {
    // All fields properly typed
  }
)
```

**Best Practices:**

1. **Use drizzle-zod schemas directly** when schema fields match FormData exactly
2. **Define manual schemas** when you need:
   - `z.coerce` for FormData string-to-number conversion
   - Additional fields beyond the database schema
   - Custom validation rules
3. **Document the relationship** to the database schema in comments
4. **Remember**: `insertSchema` already excludes auto-generated fields (`id`, `createdAt`, `updatedAt`)

**Examples in Codebase:**
- `src/app/(dashboard)/dashboard/submissions/actions.ts:467` - `submitReview` uses `insertReviewSchema` directly
- `src/app/(dashboard)/dashboard/submissions/discussion-actions.ts:29` - `postMessage` uses `insertMessageSchema` directly
- `src/app/(dashboard)/dashboard/submissions/milestone-actions.ts:24` - `completeMilestone` uses manual schema (needs custom fields)

---

# Component Type Safety Convention

## Always Use `Pick<>` and `Omit<>` from Database Schema Types

Components should NEVER manually define types for database entities. Always derive component prop types from the existing database schema using TypeScript's `Pick<>` and `Omit<>` utilities.

## Why This Matters

✅ **Single Source of Truth** - Database schema is the authoritative type definition
✅ **Automatic Updates** - Schema changes propagate to all components automatically
✅ **Type Safety** - Compiler ensures required fields actually exist in the database
✅ **No Duplication** - Avoid maintaining the same types in multiple places
✅ **Explicit Dependencies** - Clear which fields the component actually needs

## Pattern

### ❌ DON'T DO THIS (Manual Type Definition)

```typescript
// components/committee-badge.tsx
interface Committee {
  id: number
  name: string
  description: string
  logoUrl: string
  // Duplicating types that already exist in the schema!
}

interface CommitteeBadgeProps {
  committee: Committee
  className?: string
}
```

### ✅ DO THIS (Derive from Schema)

```typescript
// components/committee-badge.tsx
import type { Committee } from '@/lib/db/schema'

interface CommitteeBadgeProps {
  committee: Pick<Committee, 'id' | 'name' | 'description' | 'logoUrl' | 'focusAreas' | 'isActive'>
  className?: string
}
```

## Examples in Codebase

### Excellent Examples

**`src/components/submissions/milestone-status-overview.tsx:27-47`** - Model implementation
```typescript
import type { Milestone, Submission } from '@/lib/db/schema'

interface MilestoneStatusOverviewProps {
  submission: Pick<Submission, 'id' | 'title' | 'status' | 'submitterId'> & {
    milestones: Pick<
      Milestone,
      | 'id'
      | 'title'
      | 'description'
      | 'status'
      | 'amount'
      | 'dueDate'
      | 'deliverables'
      | 'githubRepoUrl'
      | 'submittedAt'
      | 'reviewedAt'
      | 'createdAt'
    >[]
  }
  currentUserId?: number | null
  onSubmitMilestone?: (milestoneId: number) => void
  className?: string
}
```

**`src/components/milestone-submission-form.tsx:34-57`**
```typescript
import type { Milestone } from '@/lib/db/schema'

interface MilestoneSubmissionFormProps {
  milestone: Pick<
    Milestone,
    | 'id'
    | 'title'
    | 'description'
    | 'requirements'
    | 'amount'
    | 'dueDate'
    | 'status'
    | 'deliverables'
    | 'githubRepoUrl'
    | 'githubCommitHash'
  >
  submissionRepoUrl: string | null
  previousMilestoneCommitSha?: string | null
  onSubmit: (data: SubmitData) => Promise<void>
  onCancel: () => void
}
```

**`src/components/milestone-completion-form.tsx:16-21`**
```typescript
import type { Milestone } from '@/lib/db/schema'

interface MilestoneCompletionFormProps {
  milestone: Pick<Milestone, 'id' | 'title' | 'amount'>
  committeeId: number
  onSuccess?: () => void
  onCancel?: () => void
}
```

**`src/app/(dashboard)/dashboard/page.tsx:24-28`**
```typescript
import type { User } from '@/lib/db/schema'

type UserData = Pick<User, 'id' | 'name' | 'email' | 'primaryRole'> & {
  role: string // API-specific field for compatibility
}
```

## When Component-Local Types Are OK

You CAN define types locally when they are:

- **UI-specific state** (not database entities)
- **Component configuration options**
- **Derived/computed types** that don't exist in the schema
- **API response wrappers** that add fields to schema types

### Example: UI-Specific Types (OK)

```typescript
// This is fine - it's UI state, not a database entity
interface FilterState {
  searchTerm: string
  selectedCategory: string | null
  sortOrder: 'asc' | 'desc'
}
```

### Example: API Response Wrapper (OK)

```typescript
import type { Group } from '@/lib/db/schema'

// This is fine - wrapping schema type with API metadata
interface UserCommitteesResponse {
  success: boolean
  memberships: {
    committee: Group  // ✅ Reusing schema type
    role: string
    isActive: boolean
  }[]
  totalMemberships: number
  activeMemberships: number
}
```

## Common Patterns

### Pattern 1: Simple Pick

```typescript
import type { User } from '@/lib/db/schema'

type UserSummary = Pick<User, 'id' | 'name' | 'email'>
```

### Pattern 2: Pick with Extension

```typescript
import type { Submission } from '@/lib/db/schema'

type SubmissionWithMeta = Pick<Submission, 'id' | 'title' | 'status'> & {
  isOwner: boolean  // Add UI-specific field
  canEdit: boolean
}
```

### Pattern 3: Nested Picks

```typescript
import type { Submission, Milestone } from '@/lib/db/schema'

interface SubmissionDetailProps {
  submission: Pick<Submission, 'id' | 'title' | 'status'> & {
    milestones: Pick<Milestone, 'id' | 'title' | 'status' | 'amount'>[]
  }
}
```

### Pattern 4: Omit (When Excluding Fields)

```typescript
import type { User } from '@/lib/db/schema'

// Public profile excludes sensitive fields
type PublicUserProfile = Omit<User, 'passwordHash' | 'deletedAt' | 'githubId'>
```

## Helper Types for Complex Picks

For frequently used combinations, create type aliases:

```typescript
// lib/types/common.ts
import type { User, Milestone, Submission } from '@/lib/db/schema'

export type UserSummary = Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>

export type MilestoneSummary = Pick<Milestone, 'id' | 'title' | 'status' | 'amount' | 'dueDate'>

export type SubmissionSummary = Pick<Submission, 'id' | 'title' | 'status' | 'totalAmount' | 'createdAt'>
```

Then use in components:

```typescript
import type { MilestoneSummary } from '@/lib/types/common'

interface MilestoneListProps {
  milestones: MilestoneSummary[]
}
```

## Migration Checklist

When updating existing components:

1. ✅ Import the schema type: `import type { Entity } from '@/lib/db/schema'`
2. ✅ Replace interface with `Pick<Entity, 'field1' | 'field2' | ...>`
3. ✅ Update component destructuring if prop names changed
4. ✅ Verify TypeScript compilation passes
5. ✅ Test component functionality

## Rule of Thumb

**If it comes from the database, import and derive the type. Don't recreate it.**
