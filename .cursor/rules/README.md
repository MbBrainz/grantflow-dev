# Cursor Rules Documentation

This directory contains `.mdc` (Markdown with Configuration) files that provide context-aware rules and guidance for AI-assisted development in Cursor.

## Converted from CLAUDE.md Files

These rules were converted from the original `CLAUDE.md` files located throughout the repository:

### Core Framework Rules

- **`tech-stack.mdc`** - Comprehensive tech stack guide
  - Source: `/CLAUDE.md`
  - Applies to: All files (`**/*`)
  - Content: Next.js 15, React 19, shadcn/ui, Vercel AI SDK, Drizzle ORM, Tailwind CSS patterns and best practices

### Code Convention Rules

- **`server-actions.mdc`** - Server Actions Convention
  - Source: `/src/app/CLAUDE.md` (first section)
  - Applies to: `**/actions.ts`, `**/*-actions.ts`, `src/app/**/*.ts`
  - Content: `validatedActionWithUser` pattern, Zod schemas, drizzle-zod integration

- **`component-types.mdc`** - Component Type Safety
  - Source: `/src/app/CLAUDE.md` (second section)
  - Applies to: `src/components/**/*.tsx`, `src/app/**/*.tsx`
  - Content: Using `Pick<>` and `Omit<>` from database schema types, avoiding type duplication

- **`database-patterns.mdc`** - Database Layer Guidelines
  - Source: `/src/lib/db/CLAUDE.md`
  - Applies to: `src/lib/db/**/*.ts`, `**/queries/**/*.ts`, `**/writes/**/*.ts`
  - Content: Prefer `db.query` (relational) over `db.select`, type-safe patterns with Drizzle ORM

- **`notifications.mdc`** - Notifications System Requirements
  - Source: `/src/lib/notifications/CLAUDE.md`
  - Applies to: `src/lib/notifications/**/*`, `src/app/**/notifications/**/*`
  - Content: Multi-channel notification requirements (webapp, PWA, email, Telegram)

### UX Requirements

- **`ux-feedback.mdc`** - UX Feedback Requirements
  - Source: Cursor workspace rules
  - Applies to: `src/components/**/*.tsx`, `src/app/**/*.tsx`
  - Content: All user actions must have clear feedback - disabled buttons, loaders, success/error toasts

## Existing Rules (Pre-conversion)

These files existed before the CLAUDE.md conversion:

- **`architecture.mdc`** - Architecture patterns and guidelines
- **`plan.mdc`** - Project planning and roadmap
- **`stack.mdc`** - Technology stack specifics
- **`style.mdc`** - Styling conventions
- **`ux.mdc`** - General UX principles

## How .mdc Files Work

Each `.mdc` file has YAML frontmatter that controls when and where the rule applies:

```yaml
---
description: "Brief description of what this rule covers"
globs: ["**/pattern"]  # File patterns where this rule applies
---
```

Cursor automatically loads relevant rules based on the files you're working with, providing context-aware AI assistance.

## Original CLAUDE.md Files

The original `CLAUDE.md` files are still in place:

- `/CLAUDE.md` - Root comprehensive guide
- `/src/app/CLAUDE.md` - Server Actions and Component Type conventions
- `/src/lib/db/CLAUDE.md` - Database patterns
- `/src/lib/notifications/CLAUDE.md` - Notification requirements

These serve as reference documentation and are now also available as Cursor rules for AI-assisted development.

## Benefits of .mdc Format

✅ **Context-aware** - Rules apply only to relevant files
✅ **Better organization** - Separate concerns into focused files
✅ **Metadata support** - Control when/where rules apply
✅ **AI-optimized** - Cursor can load the most relevant rules for your current work
✅ **Version controlled** - Track changes to development conventions

## Maintaining Rules

When updating conventions:

1. Update the original `CLAUDE.md` file (if it's the source of truth)
2. Update the corresponding `.mdc` file in `.cursor/rules/`
3. Keep descriptions and patterns consistent between both formats

## Questions?

See the [Cursor Rules Documentation](https://docs.cursor.com/context/rules) for more information on how `.mdc` files work.

