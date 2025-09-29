---
name: add-component
description: Add shadcn/ui components to your project
---

Add one or more shadcn/ui components to your project.

## Instructions

1. Check if shadcn/ui is initialized in the project
2. If not initialized, suggest running `npx shadcn@latest init` first
3. For each component requested:
   - Run `npx shadcn@latest add [component]`
   - Verify component was added successfully
   - Check for any peer dependencies
4. If components have dependencies on each other, install in correct order
5. Provide usage examples for the installed components

## Component Dependencies

Some components depend on others:

- `form` requires `button`, `label`, `input`
- `data-table` requires `table`, `button`, `dropdown-menu`, `input`
- `date-picker` requires `button`, `calendar`, `popover`
- `combobox` requires `command`, `popover`, `button`

## Common Components

**Layout**: card, separator, aspect-ratio, scroll-area
**Forms**: input, label, button, select, checkbox, radio-group, switch, textarea, form
**Overlays**: dialog, alert-dialog, sheet, popover, tooltip, hover-card
**Navigation**: navigation-menu, tabs, breadcrumb, pagination
**Data**: table, data-table, badge, avatar, progress
**Feedback**: alert, toast, skeleton, sonner

## Arguments

- Component names separated by spaces: `button card dialog`
- Or use `--all` to add all available components

## Example

If the user says: `/add-component form select date-picker`

Execute:

```bash
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add date-picker
```

Then provide usage examples for each component added.
