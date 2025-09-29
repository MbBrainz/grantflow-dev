---
name: create-component
description: >-
  Create reusable components using TailwindCSS utilities with proper patterns
  and best practices
---

# Create TailwindCSS Component

This command helps create well-structured, reusable components using TailwindCSS utilities following best practices and design system patterns.

## What This Command Does

1. **Component Architecture**
   - Creates component files with proper TailwindCSS utility composition
   - Implements responsive design patterns
   - Sets up proper TypeScript/PropTypes definitions
   - Follows accessibility best practices

2. **Utility Composition**
   - Uses semantic utility class combinations
   - Implements proper state management (hover, focus, active)
   - Creates responsive variants using breakpoint prefixes
   - Follows mobile-first methodology

3. **Design System Integration**
   - Uses design tokens from TailwindCSS configuration
   - Implements consistent spacing and typography scales
   - Applies proper color palette and semantic colors
   - Follows component variant patterns

4. **Performance Optimization**
   - Uses efficient utility combinations
   - Optimizes for CSS purging
   - Implements proper class composition strategies
   - Avoids unnecessary custom CSS

## Component Templates

### Button Component

```jsx
// components/Button.jsx
import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}

        {children}

        {rightIcon && !loading && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
```

### Card Component

```jsx
// components/Card.jsx
import React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
  }
>(({ className, hover = false, padding = 'md', children, ...props }, ref) => {
  const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        hover && "transition-shadow hover:shadow-md",
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))

Card.displayName = "Card"
CardHeader.displayName = "CardHeader"
CardTitle.displayName = "CardTitle"
CardDescription.displayName = "CardDescription"
CardContent.displayName = "CardContent"
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### Input Component

```jsx
// components/Input.jsx
import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3",
        lg: "h-12 px-4 text-base",
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:ring-green-500",
      },
    },
    defaultVariants: {
      size: "default",
      state: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: 'sm' | 'default' | 'lg'
  state?: 'default' | 'error' | 'success'
  label?: string
  helperText?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    size,
    state,
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    ...props
  }, ref) => {
    const inputState = error ? 'error' : state

    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              inputVariants({ size, state: inputState }),
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              className
            )}
            ref={ref}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>

        {(helperText || error) && (
          <p className={cn(
            "text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input, inputVariants }
```

### Badge Component

```jsx
// components/Badge.jsx
import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        outline: "text-foreground",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
  size?: 'sm' | 'default' | 'lg'
  removable?: boolean
  onRemove?: () => void
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, removable, onRemove, children, ...props }, ref) => {
    return (
      <div
        className={cn(badgeVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {children}
        {removable && (
          <button
            onClick={onRemove}
            className="ml-1 -mr-1 rounded-full p-0.5 hover:bg-black/10 focus:outline-none"
            aria-label="Remove badge"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

Badge.displayName = "Badge"

export { Badge, badgeVariants }
```

### Alert Component

```jsx
// components/Alert.jsx
import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success: "border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600",
        warning: "border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600",
        info: "border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
    dismissible?: boolean
    onDismiss?: () => void
  }
>(({ className, variant, dismissible, onDismiss, children, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  >
    {children}
    {dismissible && (
      <button
        onClick={onDismiss}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
        <span className="sr-only">Close</span>
      </button>
    )}
  </div>
))

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))

Alert.displayName = "Alert"
AlertTitle.displayName = "AlertTitle"
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
```

## Layout Components

### Container Component

```jsx
// components/Container.jsx
import React from 'react'
import { cn } from '@/lib/utils'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', padding = true, ...props }, ref) => {
    const sizeClasses = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      '2xl': 'max-w-8xl',
      full: 'max-w-full'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto',
          sizeClasses[size],
          padding && 'px-4 sm:px-6 lg:px-8',
          className
        )}
        {...props}
      />
    )
  }
)

Container.displayName = 'Container'

export { Container }
```

### Grid Component

```jsx
// components/Grid.jsx
import React from 'react'
import { cn } from '@/lib/utils'

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, gap = 'md', responsive = true, ...props }, ref) => {
    const gapClasses = {
      none: 'gap-0',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    }

    const getResponsiveCols = (cols: number) => {
      if (!responsive) return `grid-cols-${cols}`

      switch (cols) {
        case 1: return 'grid-cols-1'
        case 2: return 'grid-cols-1 md:grid-cols-2'
        case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        case 5: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
        case 6: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
        case 12: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-12'
        default: return `grid-cols-${cols}`
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          getResponsiveCols(cols),
          gapClasses[gap],
          className
        )}
        {...props}
      />
    )
  }
)

Grid.displayName = 'Grid'

export { Grid }
```

## Utility Functions

### Class Name Utility

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Responsive utility
export function responsive(
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string,
  xxl?: string
) {
  return cn(
    base,
    sm && `sm:${sm}`,
    md && `md:${md}`,
    lg && `lg:${lg}`,
    xl && `xl:${xl}`,
    xxl && `2xl:${xxl}`
  )
}

// Focus ring utility
export function focusRing(color: string = 'ring-primary') {
  return `focus:outline-none focus:ring-2 ${color} focus:ring-offset-2`
}
```

## Component Generation Script

### Auto-generate Component

```javascript
// scripts/create-component.js
const fs = require('fs')
const path = require('path')

function createComponent(name, type = 'basic') {
  const componentName = name.charAt(0).toUpperCase() + name.slice(1)
  const fileName = `${componentName}.tsx`
  const componentDir = `./components/${componentName}`

  // Create component directory
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true })
  }

  const templates = {
    basic: basicComponentTemplate,
    form: formComponentTemplate,
    layout: layoutComponentTemplate,
    interactive: interactiveComponentTemplate,
  }

  const template = templates[type] || templates.basic
  const componentCode = template(componentName, name)

  // Write component file
  fs.writeFileSync(path.join(componentDir, fileName), componentCode)

  // Create index file
  const indexContent = `export { ${componentName} } from './${componentName}'\nexport type { ${componentName}Props } from './${componentName}'`
  fs.writeFileSync(path.join(componentDir, 'index.ts'), indexContent)

  console.log(`✅ Component ${componentName} created successfully!`)
  console.log(`📁 Location: ${componentDir}`)
  console.log(`📝 Files created:`)
  console.log(`   - ${fileName}`)
  console.log(`   - index.ts`)
}

function basicComponentTemplate(componentName, kebabName) {
  return `import React from 'react'
import { cn } from '@/lib/utils'

export interface ${componentName}Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

const ${componentName} = React.forwardRef<HTMLDivElement, ${componentName}Props>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-background text-foreground',
      secondary: 'bg-secondary text-secondary-foreground'
    }
    
    const sizes = {
      sm: 'p-2 text-sm',
      md: 'p-4 text-base', 
      lg: 'p-6 text-lg'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border transition-colors',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

${componentName}.displayName = '${componentName}'

export { ${componentName} }
`
}

// Usage: node scripts/create-component.js MyComponent basic
const [, , name, type] = process.argv
if (!name) {
  console.error('Please provide a component name')
  process.exit(1)
}

createComponent(name, type)
```

Remember: **Focus on utility composition, responsive design, accessibility, and performance optimization when creating TailwindCSS components!**
