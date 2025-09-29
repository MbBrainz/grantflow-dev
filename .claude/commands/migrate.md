---
name: migrate
description: Handle Drizzle migrations (generate, push, rollback)
---

Handle Drizzle migrations: $ARGUMENTS

Available actions:

- **generate** - Generate migration from schema changes
- **push** - Push schema changes to database
- **rollback** - Rollback last migration
- **status** - Check migration status

Steps:

1. Check current migration status
2. Execute the requested migration action
3. Verify the operation completed successfully
4. Show resulting database state

Always backup production data before running migrations.
