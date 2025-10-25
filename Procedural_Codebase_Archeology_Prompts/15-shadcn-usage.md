# Shadcn Component Usage Map

## Overview
GrantFlow.dev extensively uses shadcn/ui components throughout the application, providing a consistent and accessible design system. The components are used across all major features including submissions, discussions, milestones, and committee management.

## Shadcn Component Inventory

### **1. Core UI Components**

#### **Button Component**
- **File**: `src/components/ui/button.tsx`
- **Usage**: 25+ files across the application
- **Variants**: default, destructive, outline, secondary, ghost, link
- **Sizes**: default, sm, lg, icon
- **Key Features**: 
  - Class variance authority for styling
  - Radix UI Slot integration
  - Accessibility support
  - Icon support

#### **Card Component**
- **File**: `src/components/ui/card.tsx`
- **Usage**: 15+ files across the application
- **Subcomponents**: Card, CardHeader, CardTitle, CardContent, CardFooter
- **Key Features**:
  - Flexible layout system
  - Consistent styling
  - Responsive design

#### **Badge Component**
- **File**: `src/components/ui/badge.tsx`
- **Usage**: 12+ files across the application
- **Variants**: default, secondary, destructive, outline
- **Key Features**:
  - Status indicators
  - Color coding
  - Compact display

### **2. Form Components**

#### **Input Component**
- **File**: `src/components/ui/input.tsx`
- **Usage**: 8+ files across the application
- **Key Features**:
  - Consistent styling
  - Accessibility support
  - Validation states
  - File input support

#### **Label Component**
- **File**: `src/components/ui/label.tsx`
- **Usage**: 6+ files across the application
- **Key Features**:
  - Form accessibility
  - Consistent typography
  - Required field indicators

#### **Textarea Component**
- **File**: `src/components/ui/textarea.tsx`
- **Usage**: 3+ files across the application
- **Key Features**:
  - Multi-line text input
  - Consistent styling
  - Resize support

#### **Radio Group Component**
- **File**: `src/components/ui/radio-group.tsx`
- **Usage**: 2+ files across the application
- **Key Features**:
  - Form selection
  - Accessibility support
  - Consistent styling

### **3. Interactive Components**

#### **Dialog Component**
- **File**: `src/components/ui/dialog.tsx`
- **Usage**: 3+ files across the application
- **Key Features**:
  - Modal dialogs
  - Accessibility support
  - Focus management
  - Backdrop support

#### **Dropdown Menu Component**
- **File**: `src/components/ui/dropdown-menu.tsx`
- **Usage**: 2+ files across the application
- **Key Features**:
  - Context menus
  - Accessibility support
  - Keyboard navigation
  - Positioning

#### **Tooltip Component**
- **File**: `src/components/ui/tooltip.tsx`
- **Usage**: 1+ files across the application
- **Key Features**:
  - Hover information
  - Accessibility support
  - Positioning
  - Delay support

### **4. Feedback Components**

#### **Toast Component**
- **File**: `src/components/ui/toast.tsx`
- **Usage**: 1+ files across the application
- **Key Features**:
  - Notification system
  - Auto-dismiss
  - Action buttons
  - Positioning

#### **Toaster Component**
- **File**: `src/components/ui/toaster.tsx`
- **Usage**: 1+ files across the application
- **Key Features**:
  - Toast container
  - Positioning
  - Animation
  - Queue management

### **5. Custom Components**

#### **Async Button Component**
- **File**: `src/components/ui/async-button.tsx`
- **Usage**: 3+ files across the application
- **Key Features**:
  - Loading states
  - Disabled states
  - Error handling
  - Success feedback

#### **Avatar Component**
- **File**: `src/components/ui/avatar.tsx`
- **Usage**: 1+ files across the application
- **Key Features**:
  - User avatars
  - Fallback support
  - Size variants
  - Image optimization

#### **Lottie Animation Component**
- **File**: `src/components/ui/lottie-animation.tsx`
- **Usage**: 1+ files across the application
- **Key Features**:
  - Animation support
  - Performance optimization
  - Responsive design
  - Loading states

## Component Usage Analysis

### **1. Most Used Components**

#### **Button Component (25+ usages)**
```typescript
// Common usage patterns
<Button variant="default" size="sm">Submit</Button>
<Button variant="outline" size="lg">Cancel</Button>
<Button variant="destructive" size="icon">Delete</Button>
<Button variant="ghost" size="default">Edit</Button>
```

#### **Card Component (15+ usages)**
```typescript
// Common usage patterns
<Card>
  <CardHeader>
    <CardTitle>Submission Details</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content here</p>
  </CardContent>
</Card>
```

#### **Badge Component (12+ usages)**
```typescript
// Common usage patterns
<Badge variant="default">Active</Badge>
<Badge variant="destructive">Rejected</Badge>
<Badge variant="outline">Pending</Badge>
<Badge variant="secondary">Completed</Badge>
```

### **2. Form Component Usage**

#### **Input Components (8+ usages)**
```typescript
// Common usage patterns
<Input placeholder="Enter title" />
<Input type="email" placeholder="Email address" />
<Input type="password" placeholder="Password" />
<Input type="file" accept=".pdf,.doc,.docx" />
```

#### **Label Components (6+ usages)**
```typescript
// Common usage patterns
<Label htmlFor="title">Project Title</Label>
<Label htmlFor="description">Description</Label>
<Label htmlFor="amount">Funding Amount</Label>
```

### **3. Interactive Component Usage**

#### **Dialog Components (3+ usages)**
```typescript
// Common usage patterns
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
    </DialogHeader>
    <DialogDescription>
      Are you sure you want to proceed?
    </DialogDescription>
  </DialogContent>
</Dialog>
```

#### **Dropdown Menu Components (2+ usages)**
```typescript
// Common usage patterns
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Component Usage by Feature

### **1. Submission Management**

#### **Submission Views**
- **Button**: Action buttons (Submit, Edit, Delete, View)
- **Card**: Submission cards and containers
- **Badge**: Status indicators (Pending, Approved, Rejected)
- **Input**: Form inputs for submission data
- **Label**: Form labels for accessibility
- **Dialog**: Confirmation dialogs for actions

#### **Submission Forms**
- **Input**: Text inputs for submission details
- **Textarea**: Multi-line descriptions
- **Label**: Form labels and accessibility
- **Button**: Submit and cancel actions
- **Card**: Form containers and sections

### **2. Discussion System**

#### **Discussion Threads**
- **Card**: Message containers and threads
- **Input**: Message input fields
- **Button**: Send and action buttons
- **Badge**: User status and message types
- **Avatar**: User avatars and identification

#### **Real-time Features**
- **Toast**: Notification toasts for new messages
- **Badge**: Unread message indicators
- **Button**: Real-time action buttons
- **Card**: Live message containers

### **3. Milestone Management**

#### **Milestone Views**
- **Card**: Milestone containers and details
- **Badge**: Milestone status indicators
- **Button**: Action buttons (Approve, Reject, Edit)
- **Dialog**: Milestone review dialogs
- **Input**: Milestone form inputs

#### **Milestone Forms**
- **Input**: Milestone data inputs
- **Textarea**: Milestone descriptions
- **Label**: Form labels and accessibility
- **Button**: Submit and cancel actions
- **Card**: Form containers and sections

### **4. Committee Management**

#### **Committee Views**
- **Card**: Committee information cards
- **Badge**: Committee status and roles
- **Button**: Action buttons (Join, Leave, Manage)
- **Dialog**: Committee management dialogs
- **Input**: Committee configuration inputs

#### **Committee Forms**
- **Input**: Committee setup inputs
- **Textarea**: Committee descriptions
- **Label**: Form labels and accessibility
- **Button**: Submit and cancel actions
- **Card**: Form containers and sections

### **5. Review and Voting**

#### **Review Interfaces**
- **Card**: Review containers and details
- **Button**: Voting buttons and actions
- **Badge**: Review status indicators
- **Dialog**: Review confirmation dialogs
- **Input**: Review form inputs

#### **Voting Systems**
- **Radio Group**: Voting options and selections
- **Button**: Vote submission buttons
- **Badge**: Vote status indicators
- **Card**: Vote result containers
- **Toast**: Vote confirmation notifications

## Component Customization

### **1. Theme Integration**

#### **CSS Variables**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

#### **Component Variants**
```typescript
// Button variants
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

### **2. Accessibility Features**

#### **Keyboard Navigation**
- **Tab Order**: Logical tab order for all components
- **Focus Management**: Visible focus indicators
- **Keyboard Shortcuts**: Common keyboard shortcuts
- **Screen Reader Support**: ARIA labels and descriptions

#### **ARIA Support**
- **Labels**: Proper labeling for form elements
- **Descriptions**: Helpful descriptions for complex components
- **States**: Component state announcements
- **Roles**: Semantic roles for component types

### **3. Performance Optimization**

#### **Component Optimization**
- **Memoization**: React.memo for expensive components
- **Lazy Loading**: Dynamic imports for large components
- **Bundle Splitting**: Code splitting for better performance
- **Tree Shaking**: Unused code elimination

#### **Rendering Optimization**
- **Virtual Scrolling**: For large lists and tables
- **Debouncing**: For search and input components
- **Throttling**: For scroll and resize events
- **Caching**: Component-level caching strategies

## Component Testing

### **1. Unit Testing**

#### **Component Tests**
```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('applies variant styles', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })
})
```

#### **Accessibility Tests**
```typescript
// Example accessibility test
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Button } from '@/components/ui/button'

expect.extend(toHaveNoViolations)

describe('Button Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  it('should be focusable', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button')
    button.focus()
    expect(button).toHaveFocus()
  })
})
```

### **2. Integration Testing**

#### **Form Integration**
```typescript
// Example form integration test
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SubmissionForm } from '@/components/forms/submission-form'

describe('Submission Form Integration', () => {
  it('submits form with valid data', async () => {
    const onSubmit = jest.fn()
    render(<SubmissionForm onSubmit={onSubmit} />)
    
    fireEvent.change(screen.getByLabelText('Project Title'), {
      target: { value: 'Test Project' }
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test Description' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Project',
        description: 'Test Description'
      })
    })
  })
})
```

## Component Documentation

### **1. Component API Documentation**

#### **Button Component**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

// Usage examples
<Button variant="default" size="sm">Default Button</Button>
<Button variant="destructive" size="lg">Delete Button</Button>
<Button variant="outline" size="icon">Icon Button</Button>
```

#### **Card Component**
```typescript
interface CardProps extends React.ComponentProps<'div'> {
  className?: string
}

// Usage examples
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
</Card>
```

### **2. Usage Guidelines**

#### **Component Selection**
- **Use Button for actions**: Submit, cancel, edit, delete
- **Use Card for containers**: Content sections, forms, lists
- **Use Badge for status**: Status indicators, labels, tags
- **Use Input for data entry**: Text, email, password, file inputs
- **Use Dialog for modals**: Confirmations, forms, details

#### **Accessibility Guidelines**
- **Always use labels**: For form inputs and interactive elements
- **Provide focus indicators**: For keyboard navigation
- **Use semantic HTML**: For screen readers and assistive technology
- **Test with screen readers**: For accessibility compliance

#### **Performance Guidelines**
- **Use memoization**: For expensive components
- **Implement lazy loading**: For large component trees
- **Optimize re-renders**: With proper dependency arrays
- **Use code splitting**: For better bundle performance
