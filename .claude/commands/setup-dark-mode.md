---
name: setup-dark-mode
description: >-
  Set up comprehensive dark mode support with TailwindCSS using CSS variables,
  theme switching, and system preferences
---

# Setup Dark Mode with TailwindCSS

This command sets up a complete dark mode system using TailwindCSS with CSS variables, automatic theme detection, and smooth transitions.

## What This Command Does

1. **CSS Variables Configuration**
   - Sets up semantic color system using CSS variables
   - Configures light and dark theme variants
   - Creates smooth transition system between themes
   - Implements proper contrast ratios for accessibility

2. **Theme Configuration**
   - Configures TailwindCSS for class-based dark mode
   - Sets up color palette using CSS variables
   - Creates theme-aware utility classes
   - Optimizes for design system consistency

3. **JavaScript Theme Controller**
   - Detects system theme preferences
   - Provides manual theme switching functionality
   - Persists user theme preferences
   - Handles theme transitions smoothly

4. **Component Integration**
   - Creates theme-aware components
   - Implements proper dark mode patterns
   - Sets up theme toggle components
   - Provides theme context for React/Vue apps

## Configuration Setup

### TailwindCSS Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // CSS variable-based color system
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },

        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },

        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },

        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Semantic colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },

        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },

        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
    },
  },
  plugins: [],
}
```

### CSS Variables Setup

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light theme colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    /* Semantic colors */
    --success: 142.1 76.2% 36.3%;
    --success-foreground: 355.7 100% 97.3%;

    --warning: 32.5 94.6% 43.7%;
    --warning-foreground: 26 83.3% 14.1%;

    --info: 217.2 91.2% 59.8%;
    --info-foreground: 210 40% 98%;

    /* Design tokens */
    --radius: 0.5rem;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md:
      0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg:
      0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl:
      0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  }

  .dark {
    /* Dark theme colors */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;

    /* Semantic colors for dark theme */
    --success: 142.1 70.6% 45.3%;
    --success-foreground: 144.9 80.4% 10%;

    --warning: 32.5 94.6% 43.7%;
    --warning-foreground: 26 83.3% 14.1%;

    --info: 217.2 91.2% 59.8%;
    --info-foreground: 222.2 84% 4.9%;

    /* Dark theme shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.3);
    --shadow-md:
      0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
    --shadow-lg:
      0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3);
    --shadow-xl:
      0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3);
  }

  /* Global base styles */
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings:
      'rlig' 1,
      'calt' 1;
  }

  /* Smooth theme transitions */
  html {
    transition: color-scheme 0.2s ease-in-out;
  }

  * {
    transition:
      background-color 0.2s ease-in-out,
      border-color 0.2s ease-in-out,
      color 0.2s ease-in-out;
  }

  /* Focus styles */
  .focus-visible {
    @apply focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none;
  }
}

/* Custom scrollbar for dark mode */
@layer utilities {
  .scrollbar-thin {
    scrollbar-width: thin;
  }

  .scrollbar-track-transparent {
    scrollbar-color: hsl(var(--muted)) transparent;
  }

  .dark .scrollbar-track-transparent {
    scrollbar-color: hsl(var(--muted)) transparent;
  }
}
```

## Theme Management

### JavaScript Theme Controller

```javascript
// lib/theme.js
class ThemeManager {
  constructor() {
    this.theme = 'system'
    this.systemTheme = 'light'
    this.init()
  }

  init() {
    // Get stored theme or default to system
    this.theme = localStorage.getItem('theme') || 'system'

    // Listen for system theme changes
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.systemTheme = this.mediaQuery.matches ? 'dark' : 'light'

    this.mediaQuery.addEventListener('change', e => {
      this.systemTheme = e.matches ? 'dark' : 'light'
      if (this.theme === 'system') {
        this.applyTheme()
      }
    })

    // Apply initial theme
    this.applyTheme()
  }

  setTheme(theme) {
    this.theme = theme
    localStorage.setItem('theme', theme)
    this.applyTheme()
    this.notifyListeners()
  }

  applyTheme() {
    const root = document.documentElement
    const isDark =
      this.theme === 'dark' ||
      (this.theme === 'system' && this.systemTheme === 'dark')

    if (isDark) {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }

  getTheme() {
    return this.theme
  }

  getEffectiveTheme() {
    return this.theme === 'system' ? this.systemTheme : this.theme
  }

  // Event listener system
  listeners = new Set()

  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      callback({
        theme: this.theme,
        effectiveTheme: this.getEffectiveTheme(),
      })
    })
  }
}

// Create global instance
const themeManager = new ThemeManager()

export { themeManager }
```

### React Theme Hook

```jsx
// hooks/useTheme.js
import { useState, useEffect } from 'react'
import { themeManager } from '@/lib/theme'

export function useTheme() {
  const [theme, setThemeState] = useState(themeManager.getTheme())
  const [effectiveTheme, setEffectiveTheme] = useState(
    themeManager.getEffectiveTheme()
  )

  useEffect(() => {
    const unsubscribe = themeManager.subscribe(({ theme, effectiveTheme }) => {
      setThemeState(theme)
      setEffectiveTheme(effectiveTheme)
    })

    return unsubscribe
  }, [])

  const setTheme = newTheme => {
    themeManager.setTheme(newTheme)
  }

  return {
    theme,
    effectiveTheme,
    setTheme,
    themes: ['light', 'dark', 'system'],
  }
}
```

### React Theme Provider

```jsx
// providers/ThemeProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeProviderContext = createContext({
  theme: 'system',
  setTheme: () => null,
})

export function ThemeProvider({ children, defaultTheme = 'system' }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || defaultTheme
    }
    return defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: theme => {
      localStorage.setItem('theme', theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
```

## Theme Toggle Components

### Simple Theme Toggle

```jsx
// components/ThemeToggle.jsx
import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/Button'

export function ThemeToggle() {
  const { effectiveTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(effectiveTheme === 'light' ? 'dark' : 'light')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  )
}
```

### Advanced Theme Selector

```jsx
// components/ThemeSelector.jsx
import React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Button } from '@/components/ui/Button'

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const currentTheme = themes.find(t => t.value === theme)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <currentTheme.icon className="mr-2 h-4 w-4" />
          {currentTheme.label}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="cursor-pointer"
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
            {theme === value && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Animated Theme Toggle

```jsx
// components/AnimatedThemeToggle.jsx
import React from 'react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

export function AnimatedThemeToggle() {
  const { effectiveTheme, setTheme } = useTheme()
  const isDark = effectiveTheme === 'dark'

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-12 w-12 items-center justify-center rounded-full',
        'bg-background border-border border-2 shadow-lg',
        'transition-all duration-300 ease-in-out',
        'hover:scale-110 hover:shadow-xl',
        'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none'
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative h-6 w-6 overflow-hidden">
        {/* Sun icon */}
        <svg
          className={cn(
            'absolute inset-0 h-6 w-6 text-yellow-500 transition-all duration-300',
            isDark
              ? 'scale-0 rotate-90 opacity-0'
              : 'scale-100 rotate-0 opacity-100'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>

        {/* Moon icon */}
        <svg
          className={cn(
            'absolute inset-0 h-6 w-6 text-blue-400 transition-all duration-300',
            isDark
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-0 -rotate-90 opacity-0'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>
    </button>
  )
}
```

## Theme-Aware Components

### Dark Mode Image Component

```jsx
// components/ThemeAwareImage.jsx
import React from 'react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeAwareImage({
  lightSrc,
  darkSrc,
  alt,
  className,
  ...props
}) {
  const { effectiveTheme } = useTheme()
  const src = effectiveTheme === 'dark' ? darkSrc : lightSrc

  return <img src={src} alt={alt} className={className} {...props} />
}
```

### Theme Detection Script

```html
<!-- Add to document head for no-flash theme detection -->
<script>
  ;(function () {
    const theme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches

    if (theme === 'dark' || (!theme && systemPrefersDark)) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
    }
  })()
</script>
```

## Testing Dark Mode

### Dark Mode Test Suite

```javascript
// tests/dark-mode.test.js
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'

describe('Dark Mode', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  test('applies dark mode class when theme is dark', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <div>Test content</div>
      </ThemeProvider>
    )

    expect(document.documentElement).toHaveClass('dark')
  })

  test('toggles theme when button is clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const toggleButton = screen.getByLabelText(/toggle theme/i)
    fireEvent.click(toggleButton)

    expect(document.documentElement).toHaveClass('dark')
  })

  test('persists theme preference', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const toggleButton = screen.getByLabelText(/toggle theme/i)
    fireEvent.click(toggleButton)

    expect(localStorage.getItem('theme')).toBe('dark')
  })
})
```

Remember: **Dark mode should enhance user experience with proper contrast ratios, smooth transitions, and respect for user preferences!**
