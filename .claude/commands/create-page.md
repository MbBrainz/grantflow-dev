---
name: create-page
description: Create a new Next.js 15 App Router page with proper structure
---

Create a new Next.js 15 App Router page: $ARGUMENTS

Follow Next.js 15 best practices:

1. Create app/[route-path]/page.tsx with async params/searchParams
2. Add loading.tsx with proper Suspense fallback
3. Add error.tsx as Client Component with error boundary
4. Include proper TypeScript types for route parameters
5. Use Server Components by default
6. Add proper metadata for SEO

Page types available:

- **default** - Standard page with basic layout
- **dynamic** - Dynamic route with [id] parameter
- **protected** - Page with authentication check
- **api** - API route handler

Example: `/create-page dashboard/analytics dynamic`
