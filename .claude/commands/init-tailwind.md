---
name: init-tailwind
description: Initialize TailwindCSS in a new project with optimal configuration
---

# Initialize TailwindCSS Project

This command sets up a new TailwindCSS project with best practices and optimal configuration.

## What This Command Does

1. **Install TailwindCSS and Dependencies**
   - Installs TailwindCSS, PostCSS, and Autoprefixer
   - Adds common TailwindCSS plugins
   - Sets up development dependencies

2. **Create Configuration Files**
   - Generates optimized `tailwind.config.js`
   - Creates `postcss.config.js`
   - Sets up CSS entry point with Tailwind directives

3. **Configure Content Paths**
   - Sets up content scanning for your framework
   - Optimizes purging configuration
   - Adds safelist for dynamic classes

## Usage Examples

### Next.js Project

```bash
# Install TailwindCSS for Next.js
npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography @tailwindcss/forms @tailwindcss/aspect-ratio

# Generate config files
npx tailwindcss init -p

# Configure for Next.js paths
```

### React/Vite Project

```bash
# Install TailwindCSS for Vite
npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography @tailwindcss/forms

# Generate config
npx tailwindcss init -p

# Configure for React/Vite paths
```

### Vanilla HTML Project

```bash
# Install TailwindCSS CLI
npm install -D tailwindcss

# Generate config
npx tailwindcss init

# Build CSS file
npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch
```

## Configuration Templates

### Optimized Tailwind Config

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
```

### PostCSS Configuration

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### CSS Entry Point

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }

  body {
    @apply bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50;
  }

  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500 text-white;
  }
}
```

## Project-Specific Optimizations

### Next.js Optimization

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
}
module.exports = nextConfig
```

### Vite Optimization

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    cssCodeSplit: true,
  },
})
```

## Package.json Scripts

```json
{
  "scripts": {
    "build-css": "tailwindcss -i ./src/input.css -o ./dist/output.css",
    "watch-css": "tailwindcss -i ./src/input.css -o ./dist/output.css --watch",
    "build-css-prod": "tailwindcss -i ./src/input.css -o ./dist/output.css --minify"
  }
}
```

## Best Practices Setup

1. **Content Configuration**
   - Include all template file paths
   - Use specific extensions for better performance
   - Exclude build directories and node_modules

2. **Plugin Selection**
   - Start with essential plugins (typography, forms)
   - Add aspect-ratio for responsive images
   - Consider container-queries for advanced layouts

3. **Theme Configuration**
   - Extend default theme rather than replacing
   - Use semantic color names
   - Define consistent spacing and typography scales

4. **Performance**
   - Enable CSS purging for production
   - Use specific content paths
   - Consider CSS-in-JS integration if needed

Remember: **Start simple, extend gradually, and optimize for your specific use case!**
