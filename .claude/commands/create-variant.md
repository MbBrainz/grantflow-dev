---
name: create-variant
description: Add a new variant to an existing shadcn/ui component
---

Add a new variant to an existing shadcn/ui component using CVA (class-variance-authority).

## Instructions

1. Locate the component file in `components/ui/[component].tsx`
2. Find the existing CVA variants configuration
3. Add the new variant to the appropriate variant type
4. Update TypeScript types if needed
5. Provide usage example of the new variant

## Arguments

- `component-name`: The component to modify (e.g., `button`, `card`)
- `variant-type`: The type of variant (`variant`, `size`, or custom)
- `variant-name`: The name of the new variant

## Example

If the user says: `/create-variant button size=xl`

1. Open `components/ui/button.tsx`
2. Find the `buttonVariants` CVA configuration
3. Add to the `size` variants:

```tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: { ... },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        // NEW VARIANT
        xl: "h-12 rounded-md px-10 text-lg",
      },
    },
  }
)
```

4. Show usage:

```tsx
<Button size="xl">Extra Large Button</Button>
```

## Common Variant Types

- **variant**: Visual style (default, destructive, outline, secondary, ghost, link)
- **size**: Component size (sm, default, lg, xl)
- **state**: Interactive state (active, disabled, loading)
- **theme**: Theme-specific (brand, success, warning, info)

## Best Practices

1. Keep variant names consistent across components
2. Update TypeScript types when adding variants
3. Test the variant with all other variant combinations
4. Ensure accessibility is maintained
5. Document the new variant in comments
