---
name: optimize-config
description: >-
  Optimize TailwindCSS configuration for better performance, smaller bundle
  size, and efficient development workflow
---

# Optimize TailwindCSS Configuration

This command analyzes and optimizes your TailwindCSS setup for maximum performance and minimal bundle size.

## What This Command Does

1. **Content Path Optimization**
   - Analyzes project structure to optimize content scanning
   - Configures precise file patterns for better purging
   - Excludes unnecessary directories and files

2. **Bundle Size Analysis**
   - Identifies unused utilities in your CSS bundle
   - Optimizes safelist configuration
   - Configures effective CSS purging strategies

3. **Build Performance**
   - Optimizes PostCSS pipeline configuration
   - Configures caching strategies
   - Sets up development vs production optimizations

4. **Plugin and Theme Cleanup**
   - Removes unused plugins and theme extensions
   - Optimizes custom utility configurations
   - Cleans up redundant theme settings

## Usage Examples

### Analyze Current Bundle Size

```bash
# Build CSS and analyze size
npx tailwindcss -i ./src/styles.css -o ./dist/output.css
wc -c ./dist/output.css

# With minification
npx tailwindcss -i ./src/styles.css -o ./dist/output.css --minify
wc -c ./dist/output.css

# Compress with Brotli
brotli -q 11 ./dist/output.css
ls -lh ./dist/output.css.br
```

### Content Path Optimization

```javascript
// Before: Generic paths
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
}

// After: Specific optimized paths
module.exports = {
  content: [
    // Be specific about directories
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts}',

    // Include component libraries if used
    './node_modules/@your-ui-lib/**/*.{js,ts,jsx,tsx}',

    // Exclude unnecessary files
    '!./node_modules',
    '!./.git',
    '!./.next',
    '!./dist',
    '!./coverage',
  ],
}
```

### Advanced Content Configuration

```javascript
module.exports = {
  content: [
    {
      files: ['./src/**/*.{js,ts,jsx,tsx}'],
      // Custom extraction for complex patterns
      transform: {
        js: content => {
          // Extract classes from template literals
          return (
            content.match(
              /(?:class|className)(?:Name)?[`:=]\s*[`"']([^`"']*)[`"']/g
            ) || []
          )
        },
      },
    },
    {
      files: ['./components/**/*.{js,ts,jsx,tsx}'],
      // Extract dynamic class compositions
      transform: {
        jsx: content => {
          const matches = content.match(/(?:clsx|cn|twMerge)\([^)]*\)/g) || []
          return matches.join(' ')
        },
      },
    },
  ],
}
```

## Performance Optimizations

### Production Build Configuration

```javascript
// postcss.config.js - Environment-specific optimization
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),

    // Production-only optimizations
    ...(process.env.NODE_ENV === 'production'
      ? [
          require('@fullhuman/postcss-purgecss')({
            content: [
              './pages/**/*.{js,ts,jsx,tsx}',
              './components/**/*.{js,ts,jsx,tsx}',
            ],
            defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
            safelist: {
              standard: [/^hljs/, /^prose/],
              deep: [/^animate-/, /^transition-/],
              greedy: [/^bg-/, /^text-/, /^border-/],
            },
          }),
          require('cssnano')({
            preset: [
              'advanced',
              {
                discardComments: { removeAll: true },
                reduceIdents: false,
                zindex: false,
              },
            ],
          }),
        ]
      : []),
  ],
}
```

### Webpack/Next.js Optimization

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    swcMinify: true,
  },

  webpack: (config, { dev, isServer }) => {
    // CSS optimization for production
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss)$/,
        chunks: 'all',
        enforce: true,
      }
    }

    return config
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
    devSourcemap: true,
  },

  build: {
    cssCodeSplit: true,
    cssMinify: 'esbuild',

    rollupOptions: {
      output: {
        manualChunks: {
          'tailwind-base': ['tailwindcss/base'],
          'tailwind-components': ['tailwindcss/components'],
          'tailwind-utilities': ['tailwindcss/utilities'],
        },
      },
    },

    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },
})
```

## Safelist Optimization

### Smart Safelist Configuration

```javascript
module.exports = {
  safelist: [
    // Dynamic color variations
    {
      pattern:
        /^(bg|text|border)-(red|green|blue|yellow|purple)-(50|100|500|600|700|900)$/,
      variants: ['hover', 'focus', 'active', 'disabled'],
    },

    // Animation and state classes
    {
      pattern: /^(opacity|scale|rotate|translate[xy]?)-(0|25|50|75|100)$/,
      variants: ['group-hover', 'peer-focus', 'motion-reduce'],
    },

    // Responsive grid columns (often dynamically generated)
    /^grid-cols-(1|2|3|4|6|12)$/,

    // Common state classes
    /^(animate|transition)-.+/,

    // Dynamic spacing that might be calculated
    {
      pattern: /^(p|m|w|h)-(0|1|2|4|8|16|32|64)$/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
  ],

  // Block classes that should never be included
  blocklist: [
    'container', // If using custom container
    'debug-*', // Debug utilities
  ],
}
```

## Bundle Analysis Tools

### CSS Analysis Script

```javascript
// scripts/analyze-css.js
const fs = require('fs')
const path = require('path')

function analyzeCSSBundle(filePath) {
  const css = fs.readFileSync(filePath, 'utf8')

  // Extract all utility classes
  const utilities = css.match(/\.[a-zA-Z][a-zA-Z0-9_-]*\s*{/g) || []
  const uniqueUtilities = [
    ...new Set(utilities.map(u => u.replace(/\s*{$/, ''))),
  ]

  // File size analysis
  const stats = fs.statSync(filePath)
  const sizeKB = (stats.size / 1024).toFixed(2)

  console.log(`CSS Bundle Analysis:`)
  console.log(`- File size: ${sizeKB}KB`)
  console.log(`- Utility classes: ${uniqueUtilities.length}`)
  console.log(
    `- Average bytes per utility: ${(stats.size / uniqueUtilities.length).toFixed(2)}`
  )

  // Most common utility patterns
  const patterns = {}
  uniqueUtilities.forEach(utility => {
    const pattern = utility
      .replace(/\d+/g, '#')
      .replace(/-(xs|sm|md|lg|xl|2xl)$/, '-*')
    patterns[pattern] = (patterns[pattern] || 0) + 1
  })

  const topPatterns = Object.entries(patterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  console.log('\nTop utility patterns:')
  topPatterns.forEach(([pattern, count]) => {
    console.log(`- ${pattern}: ${count} variants`)
  })
}

// Usage: node scripts/analyze-css.js dist/output.css
analyzeCSSBundle(process.argv[2])
```

### Unused CSS Detection

```bash
# Using PurgeCSS to find unused CSS
npm install -g purgecss

# Analyze unused CSS
purgecss --css dist/styles.css \
         --content 'src/**/*.{js,jsx,ts,tsx}' \
         --output temp/ \
         --rejected

# Compare sizes
echo "Original size:" && wc -c dist/styles.css
echo "Purged size:" && wc -c temp/styles.css
```

## Monitoring and Automation

### GitHub Actions for Bundle Size Monitoring

```yaml
# .github/workflows/css-size-check.yml
name: CSS Bundle Size Check

on: [pull_request]

jobs:
  css-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build CSS
        run: npm run build:css

      - name: Check bundle size
        run: |
          SIZE=$(wc -c < dist/styles.css)
          echo "CSS bundle size: $SIZE bytes"
          if [ $SIZE -gt 100000 ]; then
            echo "❌ CSS bundle is too large (>100KB)"
            exit 1
          else
            echo "✅ CSS bundle size is acceptable"
          fi

      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const size = fs.statSync('dist/styles.css').size;
            const sizeKB = (size / 1024).toFixed(2);

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `📊 CSS Bundle Size: ${sizeKB}KB`
            });
```

### Pre-commit Hook for CSS Optimization

```bash
#!/bin/sh
# .husky/pre-commit

# Build CSS and check size
npm run build:css

# Check if CSS file is too large
SIZE=$(wc -c < dist/styles.css)
if [ $SIZE -gt 100000 ]; then
  echo "❌ CSS bundle is too large (${SIZE} bytes > 100KB)"
  echo "Consider optimizing your Tailwind configuration"
  exit 1
fi

echo "✅ CSS bundle size is acceptable (${SIZE} bytes)"
```

## Optimization Checklist

### Performance Checklist

- [ ] Content paths are specific and exclude unnecessary files
- [ ] Safelist includes only genuinely dynamic classes
- [ ] Unused plugins are removed from configuration
- [ ] CSS is minified in production builds
- [ ] CSS code splitting is enabled where possible
- [ ] Bundle size is monitored in CI/CD pipeline

### Development Experience Checklist

- [ ] Hot reload works efficiently with content changes
- [ ] Build times are optimized for development
- [ ] Source maps are available for debugging
- [ ] Error reporting is clear for configuration issues

### Production Checklist

- [ ] CSS is compressed (Gzip/Brotli)
- [ ] Critical CSS is inlined where beneficial
- [ ] Unused CSS is properly purged
- [ ] Bundle analysis is automated
- [ ] Performance monitoring is in place

Remember: **Optimize for your specific use case, measure before and after, and maintain monitoring over time!**
