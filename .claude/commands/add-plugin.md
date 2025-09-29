---
name: add-plugin
description: >-
  Add and configure TailwindCSS plugins for extended functionality, forms,
  typography, animations, and custom utilities
---

# Add TailwindCSS Plugin

This command helps you add, configure, and optimize TailwindCSS plugins to extend functionality and enhance your design system.

## What This Command Does

1. **Plugin Installation**
   - Installs official and community TailwindCSS plugins
   - Configures plugin settings for optimal performance
   - Integrates plugins with existing configuration
   - Updates content paths for plugin-specific classes

2. **Configuration Setup**
   - Configures plugin options and customizations
   - Sets up plugin-specific utility classes
   - Optimizes for CSS bundle size and purging
   - Integrates with design system tokens

3. **Usage Examples**
   - Provides implementation examples for each plugin
   - Shows best practices and common patterns
   - Demonstrates responsive and interactive usage
   - Includes accessibility considerations

4. **Performance Optimization**
   - Configures plugins for optimal bundle size
   - Sets up effective purging strategies
   - Optimizes for build performance
   - Monitors plugin impact on CSS output

## Official Plugins

### Typography Plugin (@tailwindcss/typography)

#### Installation and Setup

```bash
# Install typography plugin
npm install -D @tailwindcss/typography

# Or with yarn
yarn add -D @tailwindcss/typography
```

#### Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      typography: ({ theme }) => ({
        // Default prose styles
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.gray.700'),
            '[class~="lead"]': {
              color: theme('colors.gray.600'),
              fontSize: theme('fontSize.xl')[0],
              lineHeight: theme('fontSize.xl')[1].lineHeight,
            },
            a: {
              color: theme('colors.blue.600'),
              textDecoration: 'none',
              fontWeight: theme('fontWeight.medium'),
              '&:hover': {
                color: theme('colors.blue.700'),
                textDecoration: 'underline',
              },
            },
            'h1, h2, h3, h4, h5, h6': {
              color: theme('colors.gray.900'),
              fontWeight: theme('fontWeight.bold'),
            },
            h1: {
              fontSize: theme('fontSize.4xl')[0],
              lineHeight: theme('fontSize.4xl')[1].lineHeight,
            },
            h2: {
              fontSize: theme('fontSize.3xl')[0],
              lineHeight: theme('fontSize.3xl')[1].lineHeight,
            },
            h3: {
              fontSize: theme('fontSize.2xl')[0],
              lineHeight: theme('fontSize.2xl')[1].lineHeight,
            },
            code: {
              color: theme('colors.gray.900'),
              backgroundColor: theme('colors.gray.100'),
              padding: theme('spacing.1'),
              borderRadius: theme('borderRadius.sm'),
              fontSize: theme('fontSize.sm')[0],
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: 0,
            },
            pre: {
              backgroundColor: theme('colors.gray.900'),
              color: theme('colors.gray.100'),
              padding: theme('spacing.4'),
              borderRadius: theme('borderRadius.lg'),
              overflow: 'auto',
            },
            blockquote: {
              borderLeftWidth: theme('borderWidth.4'),
              borderLeftColor: theme('colors.gray.300'),
              paddingLeft: theme('spacing.4'),
              fontStyle: 'italic',
              color: theme('colors.gray.600'),
            },
          },
        },

        // Dark mode typography
        invert: {
          css: {
            '--tw-prose-body': theme('colors.gray.300'),
            '--tw-prose-headings': theme('colors.gray.100'),
            '--tw-prose-lead': theme('colors.gray.400'),
            '--tw-prose-links': theme('colors.blue.400'),
            '--tw-prose-bold': theme('colors.gray.100'),
            '--tw-prose-counters': theme('colors.gray.400'),
            '--tw-prose-bullets': theme('colors.gray.500'),
            '--tw-prose-hr': theme('colors.gray.700'),
            '--tw-prose-quotes': theme('colors.gray.200'),
            '--tw-prose-quote-borders': theme('colors.gray.700'),
            '--tw-prose-captions': theme('colors.gray.400'),
            '--tw-prose-code': theme('colors.gray.100'),
            '--tw-prose-pre-code': theme('colors.gray.100'),
            '--tw-prose-pre-bg': theme('colors.gray.800'),
            '--tw-prose-th-borders': theme('colors.gray.600'),
            '--tw-prose-td-borders': theme('colors.gray.700'),
          },
        },

        // Size variants
        sm: {
          css: {
            fontSize: theme('fontSize.sm')[0],
            lineHeight: theme('fontSize.sm')[1].lineHeight,
            h1: { fontSize: theme('fontSize.2xl')[0] },
            h2: { fontSize: theme('fontSize.xl')[0] },
            h3: { fontSize: theme('fontSize.lg')[0] },
          },
        },

        lg: {
          css: {
            fontSize: theme('fontSize.lg')[0],
            lineHeight: theme('fontSize.lg')[1].lineHeight,
            h1: { fontSize: theme('fontSize.5xl')[0] },
            h2: { fontSize: theme('fontSize.4xl')[0] },
            h3: { fontSize: theme('fontSize.3xl')[0] },
          },
        },

        xl: {
          css: {
            fontSize: theme('fontSize.xl')[0],
            lineHeight: theme('fontSize.xl')[1].lineHeight,
            h1: { fontSize: theme('fontSize.6xl')[0] },
            h2: { fontSize: theme('fontSize.5xl')[0] },
            h3: { fontSize: theme('fontSize.4xl')[0] },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

#### Usage Examples

```html
<!-- Basic prose content -->
<article class="prose lg:prose-xl max-w-none">
  <h1>Article Title</h1>
  <p class="lead">This is a lead paragraph with emphasis.</p>
  <p>
    Regular paragraph content with <a href="#">links</a> and
    <strong>bold text</strong>.
  </p>

  <blockquote>This is a blockquote with proper styling.</blockquote>

  <pre><code>console.log('Code blocks are styled too')</code></pre>
</article>

<!-- Dark mode prose -->
<article class="prose dark:prose-invert">
  <h2>Dark Mode Compatible</h2>
  <p>Content that adapts to dark themes.</p>
</article>

<!-- Size variants -->
<div class="prose prose-sm">Small typography</div>
<div class="prose prose-lg">Large typography</div>
<div class="prose prose-xl">Extra large typography</div>

<!-- Custom prose without max-width -->
<div class="prose max-w-none">
  <p>Full width content without prose max-width constraint.</p>
</div>
```

### Forms Plugin (@tailwindcss/forms)

#### Installation and Setup

```bash
# Install forms plugin
npm install -D @tailwindcss/forms
```

#### Configuration

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class', // 'base' or 'class'
    }),
  ],
}
```

#### Usage Examples

```html
<!-- Form inputs with class strategy -->
<form class="space-y-4">
  <div>
    <label for="name" class="block text-sm font-medium text-gray-700"
      >Name</label
    >
    <input
      type="text"
      id="name"
      class="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    />
  </div>

  <div>
    <label for="email" class="block text-sm font-medium text-gray-700"
      >Email</label
    >
    <input
      type="email"
      id="email"
      class="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    />
  </div>

  <div>
    <label for="message" class="block text-sm font-medium text-gray-700"
      >Message</label
    >
    <textarea
      id="message"
      rows="4"
      class="form-textarea mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    ></textarea>
  </div>

  <div>
    <label class="flex items-center">
      <input
        type="checkbox"
        class="form-checkbox rounded text-blue-600 focus:ring-blue-500"
      />
      <span class="ml-2 text-sm text-gray-700">I agree to the terms</span>
    </label>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700">Options</label>
    <div class="mt-2 space-y-2">
      <label class="flex items-center">
        <input
          type="radio"
          name="option"
          value="1"
          class="form-radio text-blue-600 focus:ring-blue-500"
        />
        <span class="ml-2 text-sm text-gray-700">Option 1</span>
      </label>
      <label class="flex items-center">
        <input
          type="radio"
          name="option"
          value="2"
          class="form-radio text-blue-600 focus:ring-blue-500"
        />
        <span class="ml-2 text-sm text-gray-700">Option 2</span>
      </label>
    </div>
  </div>

  <div>
    <label for="select" class="block text-sm font-medium text-gray-700"
      >Select</label
    >
    <select
      id="select"
      class="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
      <option>Option 1</option>
      <option>Option 2</option>
      <option>Option 3</option>
    </select>
  </div>

  <button
    type="submit"
    class="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
  >
    Submit
  </button>
</form>
```

### Aspect Ratio Plugin (@tailwindcss/aspect-ratio)

#### Installation and Setup

```bash
# Install aspect ratio plugin
npm install -D @tailwindcss/aspect-ratio
```

#### Configuration

```javascript
// tailwind.config.js
module.exports = {
  plugins: [require('@tailwindcss/aspect-ratio')],
}
```

#### Usage Examples

```html
<!-- Video embed with 16:9 aspect ratio -->
<div class="aspect-w-16 aspect-h-9">
  <iframe
    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
    frameborder="0"
    allowfullscreen
  ></iframe>
</div>

<!-- Square image container -->
<div class="aspect-w-1 aspect-h-1">
  <img src="image.jpg" alt="Square image" class="object-cover" />
</div>

<!-- Card with consistent aspect ratios -->
<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
  <div class="overflow-hidden rounded-lg bg-white shadow-md">
    <div class="aspect-w-16 aspect-h-9">
      <img src="image1.jpg" alt="Card 1" class="object-cover" />
    </div>
    <div class="p-4">
      <h3 class="font-semibold">Card Title 1</h3>
    </div>
  </div>

  <div class="overflow-hidden rounded-lg bg-white shadow-md">
    <div class="aspect-w-16 aspect-h-9">
      <img src="image2.jpg" alt="Card 2" class="object-cover" />
    </div>
    <div class="p-4">
      <h3 class="font-semibold">Card Title 2</h3>
    </div>
  </div>
</div>

<!-- Modern CSS aspect-ratio property (newer alternative) -->
<div class="aspect-video">
  <iframe src="video.mp4" class="h-full w-full object-cover"></iframe>
</div>

<div class="aspect-square">
  <img src="square-image.jpg" alt="Square" class="h-full w-full object-cover" />
</div>

<!-- Custom aspect ratios -->
<div class="aspect-w-4 aspect-h-3">
  <div
    class="flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white"
  >
    4:3 Aspect Ratio
  </div>
</div>
```

### Container Queries Plugin (@tailwindcss/container-queries)

#### Installation and Setup

```bash
# Install container queries plugin
npm install -D @tailwindcss/container-queries
```

#### Configuration

```javascript
// tailwind.config.js
module.exports = {
  plugins: [require('@tailwindcss/container-queries')],
}
```

#### Usage Examples

```html
<!-- Component-level responsive design -->
<div class="@container">
  <div class="@md:flex @md:items-center @md:space-x-4">
    <img class="h-48 w-full rounded-lg object-cover @md:h-24 @md:w-24" />
    <div class="mt-4 @md:mt-0 @md:flex-1">
      <h3 class="text-lg font-semibold @lg:text-xl">Product Title</h3>
      <p class="text-sm text-gray-600 @lg:text-base">Product description</p>
      <div class="mt-2 @lg:flex @lg:items-center @lg:justify-between">
        <span class="font-bold @lg:text-lg">$99.99</span>
        <button class="rounded bg-blue-600 px-4 py-2 text-white @lg:ml-4">
          Add to Cart
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Card grid with container queries -->
<div class="@container">
  <div
    class="grid gap-4 @sm:grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 @xl:grid-cols-4"
  >
    <div class="rounded-lg bg-white p-4 shadow">
      <h4 class="font-semibold @lg:text-lg">Card Title</h4>
      <p class="text-sm text-gray-600 @lg:text-base">
        Card content that adapts to container size.
      </p>
    </div>
  </div>
</div>

<!-- Sidebar with container-specific styling -->
<div class="flex">
  <aside class="@container w-64 bg-gray-100 p-4">
    <nav class="@sm:space-y-2 @md:space-y-4">
      <a class="block hover:text-blue-600 @sm:text-sm @md:text-base"
        >Navigation Item</a
      >
    </nav>
  </aside>

  <main class="flex-1 p-6">
    <div class="@container">
      <h1 class="text-2xl font-bold @md:text-3xl @lg:text-4xl">Main Content</h1>
    </div>
  </main>
</div>
```

## Popular Community Plugins

### Line Clamp Plugin (@tailwindcss/line-clamp)

#### Installation and Setup

```bash
# Install line clamp plugin (now built into Tailwind v3.3+)
npm install -D @tailwindcss/line-clamp
```

#### Usage Examples

```html
<!-- Clamp text to specific number of lines -->
<p class="line-clamp-3 text-sm text-gray-600">
  This is a long paragraph that will be clamped to exactly 3 lines with an
  ellipsis at the end when it overflows beyond the specified number of lines.
</p>

<!-- Different line clamp values -->
<div class="space-y-4">
  <p class="line-clamp-1">Single line with ellipsis</p>
  <p class="line-clamp-2">Two lines maximum with ellipsis</p>
  <p class="line-clamp-4">Up to four lines with ellipsis</p>
  <p class="line-clamp-none">No line clamping applied</p>
</div>

<!-- Responsive line clamping -->
<p class="line-clamp-2 md:line-clamp-3 lg:line-clamp-4">
  Responsive line clamping that shows more lines on larger screens.
</p>
```

### Animations Plugin (tailwindcss-animate)

#### Installation and Setup

```bash
# Install animations plugin
npm install -D tailwindcss-animate
```

#### Configuration

```javascript
// tailwind.config.js
module.exports = {
  plugins: [require('tailwindcss-animate')],
}
```

#### Usage Examples

```html
<!-- Predefined animations -->
<div class="animate-fade-in">Fades in smoothly</div>
<div class="animate-slide-up">Slides up from bottom</div>
<div class="animate-scale-in">Scales in from center</div>
<div class="animate-bounce-in">Bounces in with spring effect</div>

<!-- Loading animations -->
<div
  class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
></div>
<div class="h-4 animate-pulse rounded bg-gray-300"></div>

<!-- Hover animations -->
<button class="transform transition-transform hover:animate-bounce">
  Bounce on Hover
</button>

<div class="group">
  <div class="group-hover:animate-wiggle transform transition-transform">
    <span>Wiggle on group hover</span>
  </div>
</div>

<!-- Staggered animations -->
<div class="space-y-2">
  <div class="animate-slide-in-left" style="animation-delay: 0ms;">Item 1</div>
  <div class="animate-slide-in-left" style="animation-delay: 100ms;">
    Item 2
  </div>
  <div class="animate-slide-in-left" style="animation-delay: 200ms;">
    Item 3
  </div>
</div>
```

### Debugging Plugin (tailwindcss-debug-screens)

#### Installation and Setup

```bash
# Install debug plugin (development only)
npm install -D tailwindcss-debug-screens
```

#### Configuration

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    process.env.NODE_ENV === 'development' &&
      require('tailwindcss-debug-screens'),
  ].filter(Boolean),
}
```

#### Usage

```html
<!-- Add debug indicator to body -->
<body class="debug-screens">
  <!-- Your content -->
</body>
```

## Custom Plugin Development

### Creating a Custom Plugin

```javascript
// plugins/custom-utilities.js
const plugin = require('tailwindcss/plugin')

module.exports = plugin(function ({ addUtilities, addComponents, theme }) {
  // Add custom utilities
  addUtilities({
    '.text-shadow': {
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
    },
    '.text-shadow-lg': {
      textShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)',
    },
    '.scrollbar-hide': {
      '-ms-overflow-style': 'none',
      'scrollbar-width': 'none',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
    '.backdrop-blur-xs': {
      backdropFilter: 'blur(2px)',
    },
  })

  // Add custom components
  addComponents({
    '.btn-primary': {
      backgroundColor: theme('colors.blue.600'),
      color: theme('colors.white'),
      padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
      borderRadius: theme('borderRadius.md'),
      fontWeight: theme('fontWeight.medium'),
      '&:hover': {
        backgroundColor: theme('colors.blue.700'),
      },
      '&:focus': {
        outline: 'none',
        boxShadow: `0 0 0 3px ${theme('colors.blue.500')}33`,
      },
    },
    '.card': {
      backgroundColor: theme('colors.white'),
      borderRadius: theme('borderRadius.lg'),
      boxShadow: theme('boxShadow.md'),
      padding: theme('spacing.6'),
    },
  })
})
```

#### Using Custom Plugin

```javascript
// tailwind.config.js
module.exports = {
  plugins: [require('./plugins/custom-utilities')],
}
```

### Advanced Custom Plugin with Variants

```javascript
// plugins/advanced-utilities.js
const plugin = require('tailwindcss/plugin')

module.exports = plugin(
  function ({ addUtilities, matchUtilities, theme }) {
    // Static utilities
    addUtilities({
      '.writing-vertical': {
        'writing-mode': 'vertical-rl',
      },
    })

    // Dynamic utilities with arbitrary values
    matchUtilities(
      {
        'text-shadow': value => ({
          textShadow: value,
        }),
      },
      { values: theme('textShadow') }
    )

    matchUtilities(
      {
        'animation-delay': value => ({
          animationDelay: value,
        }),
      },
      { values: theme('animationDelay') }
    )
  },
  {
    // Extend theme
    theme: {
      textShadow: {
        sm: '1px 1px 2px rgba(0, 0, 0, 0.1)',
        DEFAULT: '2px 2px 4px rgba(0, 0, 0, 0.1)',
        lg: '4px 4px 8px rgba(0, 0, 0, 0.15)',
      },
      animationDelay: {
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms',
      },
    },
  }
)
```

## Plugin Performance Optimization

### Bundle Size Analysis Script

```javascript
// scripts/analyze-plugins.js
const fs = require('fs')
const postcss = require('postcss')
const tailwindcss = require('tailwindcss')

async function analyzePluginImpact(configPath) {
  // Base configuration without plugins
  const baseConfig = {
    content: ['./test.html'],
    plugins: [],
  }

  // Configuration with plugins
  const pluginConfig = require(configPath)

  // Generate CSS for both configurations
  const baseCSS = await generateCSS(baseConfig)
  const pluginCSS = await generateCSS(pluginConfig)

  console.log('Plugin Impact Analysis:')
  console.log(`Base CSS size: ${baseCSS.length} bytes`)
  console.log(`With plugins: ${pluginCSS.length} bytes`)
  console.log(`Difference: ${pluginCSS.length - baseCSS.length} bytes`)
  console.log(
    `Increase: ${(((pluginCSS.length - baseCSS.length) / baseCSS.length) * 100).toFixed(2)}%`
  )
}

async function generateCSS(config) {
  const result = await postcss([tailwindcss(config)]).process(
    '@tailwind base; @tailwind components; @tailwind utilities;',
    { from: undefined }
  )

  return result.css
}

analyzePluginImpact('./tailwind.config.js')
```

Remember: **Choose plugins based on actual needs, configure them properly, and monitor their impact on bundle size and performance!**
