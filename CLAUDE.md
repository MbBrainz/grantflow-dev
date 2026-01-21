# GrantFlow Project Configuration

## Tech Stack
- **Next.js 15** (App Router, React 19, Server Components)
- **shadcn/ui** (Radix UI + Tailwind CSS)
- **Vercel AI SDK** (streaming, function calling)
- **Drizzle ORM** (PostgreSQL/Supabase)
- **Tailwind CSS v4**

## Notion Project Management

Use the `notion-workspace` skill to manage tasks.

| Resource | ID |
|----------|-----|
| Project Page | `2373198d-3b69-8009-9ea6-dce3a1a41125` |
| Tasks Data Source | `1b93198d-3b69-8005-b2cc-000b8b53f7f2` |

---

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint
pnpm typecheck        # TypeScript validation

# shadcn/ui
npx shadcn@latest add [component]

# Drizzle
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
npx drizzle-kit studio
```

## Project Structure

```
app/
├── (auth)/          # Route groups
├── api/             # API routes
├── [dynamic]/       # Dynamic routes
├── layout.tsx       # Root layout
├── page.tsx         # Home page
└── globals.css

components/ui/       # shadcn components
lib/
├── db.ts           # Drizzle client
├── utils.ts        # cn() helper
└── queries/        # Database queries
schema/             # Drizzle schemas
```

---

## Critical: Next.js 15 Breaking Changes

### Async Request APIs
```typescript
// ✅ Next.js 15 - params/searchParams are async
export default async function Page({ params, searchParams }) {
  const { id } = await params;
  const { query } = await searchParams;
}

// cookies/headers are async
import { cookies, headers } from 'next/headers';
const cookieStore = await cookies();
const headersList = await headers();
```

### useFormState → useActionState
```typescript
// ✅ Import from 'react', not 'react-dom'
import { useActionState } from 'react'
```

### Fetch Caching
```typescript
// ✅ Explicit caching required (no longer cached by default)
const data = await fetch('/api/data', {
  next: { revalidate: 3600 },
})
```

---

## Component Types from Database Schema

**IMPORTANT**: Never create new types in component files if they exist in the database schema.

```typescript
// ❌ DON'T duplicate types
interface Committee {
  id: number
  name: string
  // Duplicating schema types!
}

// ✅ DO derive from schema
import type { Committee } from '@/lib/db/schema'

interface CommitteeBadgeProps {
  committee: Pick<Committee, 'id' | 'name' | 'description'>
  className?: string
}
```

**Rule**: If it comes from the database, import and derive the type.

---

## Core Patterns

### Server Components First
- Default to Server Components; use Client Components only for interactivity
- Fetch data directly in Server Components, not via client-side useEffect

```typescript
// ✅ Server Component data fetching
async function ProductList() {
  const products = await db.products.findMany();
  return <div>{/* render */}</div>;
}

// ❌ Avoid unnecessary client-side fetching
'use client';
function Bad() {
  useEffect(() => { fetch('/api/data')... }, []);
}
```

### Server Actions
```typescript
'use server';
export async function createItem(prevState: any, formData: FormData) {
  const validated = schema.parse(Object.fromEntries(formData));
  await db.items.create({ data: validated });
  revalidatePath('/items');
}
```

### Drizzle Queries
```typescript
// Query pattern for relations
const posts = await db.query.posts.findMany({
  with: { author: true },
  where: eq(posts.published, true),
  orderBy: [desc(posts.createdAt)],
});

// Select pattern for aggregations
const stats = await db
  .select({ total: count(), revenue: sum(orders.total) })
  .from(orders);
```

### AI SDK Streaming
```typescript
// API route
import { streamText } from 'ai'
export async function POST(req: Request) {
  const { messages } = await req.json()
  const result = await streamText({ model: anthropic('claude-3-sonnet'), messages })
  return result.toDataStreamResponse()
}

// Client hook
'use client';
import { useChat } from 'ai/react';
const { messages, input, handleInputChange, handleSubmit } = useChat();
```

---

## Security Checklist

- Validate Server Actions input with Zod
- Authenticate/authorize in Server Actions and middleware
- `NEXT_PUBLIC_*` for client-side env vars only
- Never expose API keys in client code
- Sanitize user input and AI responses

## Performance

- Use Server Components to reduce bundle size
- Implement streaming with Suspense boundaries
- Use `next/image` for optimized images
- Configure caching: `{ next: { revalidate: N, tags: [...] } }`
- Use `revalidatePath()` / `revalidateTag()` for on-demand updates

---

## Environment Variables

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```
