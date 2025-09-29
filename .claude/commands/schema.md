---
name: schema
description: Generate type-safe Drizzle schema for a table
---

Generate a complete Drizzle ORM schema for the table "$ARGUMENTS".

Follow these requirements:

1. Use proper TypeScript types and imports
2. Include appropriate indexes for performance
3. Add relationships if referenced tables exist
4. Include proper constraints and validations
5. Generate both insert and select type exports
6. Follow Drizzle naming conventions

If no table name is provided, show available schema patterns and examples.
