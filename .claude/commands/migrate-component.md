---
name: migrate-component
description: Migrate existing component to shadcn/ui patterns
---

Convert an existing component to follow shadcn/ui patterns and best practices.

## Instructions

1. Analyze the existing component
2. Identify required shadcn/ui dependencies
3. Refactor to use:
   - CVA for variants
   - cn() for class merging
   - Radix UI primitives (if applicable)
   - Proper TypeScript types
   - forwardRef pattern
   - Accessibility attributes
4. Maintain backward compatibility where possible
5. Create migration guide

## Migration Patterns

### From Styled Components/Emotion

```tsx
// ❌ Before - Styled Components
const StyledButton = styled.button`
  background: ${props => (props.primary ? 'blue' : 'gray')};
  color: white;
  padding: 10px 20px;
  &:hover {
    opacity: 0.8;
  }
`

// ✅ After - shadcn/ui pattern
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  )
})
Button.displayName = 'Button'
```

### From Material-UI/Ant Design

```tsx
// ❌ Before - MUI
import { Button, TextField, Dialog } from '@mui/material'

;<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>
    <TextField label="Name" />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
  </DialogActions>
</Dialog>

// ✅ After - shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

;<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### From Bootstrap/Traditional CSS

```tsx
// ❌ Before - Bootstrap classes
;<div className="card">
  <div className="card-header">
    <h5 className="card-title">Title</h5>
  </div>
  <div className="card-body">
    <p className="card-text">Content</p>
    <button className="btn btn-primary">Action</button>
  </div>
</div>

// ✅ After - shadcn/ui
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

;<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## Migration Checklist

### Structure

- [ ] Convert to functional component
- [ ] Add forwardRef if needed
- [ ] Add displayName
- [ ] Export component and variants

### Styling

- [ ] Replace CSS-in-JS with Tailwind classes
- [ ] Implement CVA for variants
- [ ] Use cn() for class merging
- [ ] Convert theme tokens to CSS variables

### Types

- [ ] Add proper TypeScript interfaces
- [ ] Extend HTML element props
- [ ] Add VariantProps type
- [ ] Export types separately

### Behavior

- [ ] Replace UI library with Radix primitives
- [ ] Add asChild support if applicable
- [ ] Implement controlled/uncontrolled patterns
- [ ] Add proper event handlers

### Accessibility

- [ ] Add ARIA attributes
- [ ] Ensure keyboard navigation
- [ ] Add focus management
- [ ] Include screen reader support

## Common Replacements

| Old Library      | shadcn/ui Replacement     |
| ---------------- | ------------------------- |
| MUI Button       | Button with variants      |
| Ant Select       | Select with Radix         |
| Bootstrap Modal  | Dialog component          |
| Chakra Menu      | DropdownMenu              |
| Semantic UI Form | Form with React Hook Form |

## Migration Guide Template

````markdown
# Migration Guide: [ComponentName]

## Breaking Changes

- Changed prop: `color` → `variant`
- Removed prop: `size="medium"` (now default)
- New required prop: `asChild` for composition

## API Changes

```tsx
// Before
<OldComponent color="primary" size="large" />

// After
<NewComponent variant="default" size="lg" />
```
````

## Styling Changes

- Uses Tailwind classes instead of CSS modules
- Theme variables now use CSS custom properties
- Dark mode handled automatically

## Usage Examples

[Provide before/after examples]

```

## Example

If the user says: `/migrate-component components/CustomButton.jsx`

1. Read and analyze CustomButton.jsx
2. Identify styling system used
3. Create new button following shadcn patterns:
   - Add CVA variants
   - Convert styles to Tailwind
   - Add proper TypeScript types
   - Include forwardRef
4. Test compatibility
5. Provide migration guide
```
