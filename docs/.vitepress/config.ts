import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'GrantFlow Documentation',
  description: 'Complete guide for using GrantFlow - Grant management platform',

  // Theme configuration
  themeConfig: {
    // Logo
    logo: '/logo.svg',

    // Site title in nav
    siteTitle: 'GrantFlow Docs',

    // Navigation menu
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guides', link: '/guides/' },
    ],

    // Sidebar navigation
    sidebar: {
      '/guides/': [
        {
          text: 'User Guides',
          items: [
            {
              text: 'Reviewer Walkthrough',
              link: '/guides/review-walkthrough',
            },
            {
              text: 'Submitter Walkthrough',
              link: '/guides/submitter-walkthrough',
            },
          ],
        },
        {
          text: 'Developer Guides',
          items: [{ text: 'GitHub Integration', link: '/guides/github-setup' }],
        },
      ],
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/' },
            { text: 'Reviewer Guide', link: '/guides/review-walkthrough' },
            { text: 'Submitter Guide', link: '/guides/submitter-walkthrough' },
          ],
        },
      ],
    },

    // Search
    search: {
      provider: 'local',
    },

    // Social links (optional)
    socialLinks: [
      // Add your social links here, e.g.
      // { icon: 'github', link: 'https://github.com/your-org/grantflow' },
    ],

    // Footer
    footer: {
      message: 'Built with VitePress',
      copyright: 'Copyright © 2025 GrantFlow',
    },

    // Edit link (optional)
    editLink: {
      pattern: 'https://github.com/MbBrainz/grantflow-dev/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    // Last updated
    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },
  },

  // Markdown configuration
  markdown: {
    lineNumbers: true,
  },

  // Build configuration
  base: '/',
  outDir: './.vitepress/dist',

  // Head configuration
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
})
