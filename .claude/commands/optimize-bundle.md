---
name: optimize-bundle
description: Analyze and optimize bundle size
---

Analyze bundle size and optimize for production.

## Instructions

1. Run bundle analysis
2. Identify large dependencies
3. Find unused code
4. Implement optimization strategies
5. Generate optimization report

## Analysis Tools

### Next.js

```bash
# Install bundle analyzer
npm install -D @next/bundle-analyzer

# Configure next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // your config
})

# Run analysis
ANALYZE=true npm run build
```

### Vite

```bash
# Install rollup plugin
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  visualizer({
    open: true,
    gzipSize: true,
    brotliSize: true,
  })
]

# Run build
npm run build
```

### General

```bash
# webpack-bundle-analyzer
npm install -D webpack-bundle-analyzer

# source-map-explorer
npm install -D source-map-explorer
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

## Optimization Strategies

### 1. Code Splitting

```tsx
// Dynamic imports
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Route-based splitting (Next.js)
export default function Page() {
  return <div>Auto code-split by route</div>
}

// Conditional loading
if (userNeedsFeature) {
  const module = await import('./feature')
  module.initialize()
}
```

### 2. Tree Shaking

```tsx
// ❌ Bad - imports entire library
import _ from 'lodash'

// ✅ Good - imports only what's needed
import debounce from 'lodash/debounce'

// For shadcn/ui - already optimized!
// Components are copied, not imported from package
```

### 3. Component Optimization

```tsx
// Memoize expensive components
const MemoizedComponent = memo(ExpensiveComponent)

// Lazy load heavy components
const Chart = lazy(() => import('./Chart'))

<Suspense fallback={<Skeleton />}>
  <Chart />
</Suspense>
```

### 4. Asset Optimization

```tsx
// Next.js Image optimization
import Image from 'next/image'

;<Image src="/hero.jpg" width={1200} height={600} priority alt="Hero" />

// Font optimization
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})
```

### 5. Dependency Optimization

```json
// Use lighter alternatives
{
  "dependencies": {
    // "moment": "^2.29.0", // 67kb
    "date-fns": "^2.29.0", // 13kb (tree-shakeable)

    // "lodash": "^4.17.0", // 71kb
    "lodash-es": "^4.17.0" // Tree-shakeable
  }
}
```

### 6. Tailwind CSS Optimization

```js
// tailwind.config.js
module.exports = {
  content: [
    // Be specific to avoid scanning unnecessary files
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // Remove unused styles in production
  purge:
    process.env.NODE_ENV === 'production'
      ? ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}']
      : [],
}
```

## Optimization Checklist

- [ ] Enable production mode
- [ ] Remove console.logs and debug code
- [ ] Minify JavaScript and CSS
- [ ] Enable gzip/brotli compression
- [ ] Optimize images (WebP, AVIF)
- [ ] Lazy load non-critical resources
- [ ] Use CDN for static assets
- [ ] Implement caching strategies
- [ ] Remove unused dependencies
- [ ] Tree shake imports

## Report Format

```markdown
# Bundle Optimization Report

## Current Stats

- Total bundle size: XXXkb
- Gzipped size: XXXkb
- Largest chunks: [...]

## Issues Found

1. Large dependency: [package] (XXXkb)
2. Duplicate code in: [files]
3. Unused exports in: [modules]

## Optimizations Applied

1. ✅ Code split [component]
2. ✅ Lazy loaded [routes]
3. ✅ Replaced [heavy-lib] with [light-lib]

## Results

- Bundle size reduced by: XX%
- Initial load improved by: XXms
- Lighthouse score: XX → XX

## Recommendations

1. Consider replacing...
2. Lazy load...
3. Split chunk for...
```

## Example

If the user says: `/optimize-bundle`

1. Analyze current bundle size
2. Identify optimization opportunities:
   - Large dependencies to replace
   - Components to lazy load
   - Unused code to remove
3. Implement optimizations
4. Re-analyze and compare results
5. Generate detailed report
