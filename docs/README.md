# GrantFlow Documentation Site

This directory contains the VitePress documentation site for GrantFlow.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Build for production:
```bash
pnpm build
```

4. Preview the production build:
```bash
pnpm preview
```

## Structure

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress configuration
├── guides/                 # Documentation guides
│   ├── review-walkthrough.md
│   ├── submitter-walkthrough.md
│   ├── github-setup.md
│   ├── review-walkthrough-images/  # Images for review guide
│   └── submitter-walkthrough-images/ # Images for submitter guide
├── index.md               # Homepage
└── package.json
```

## Deployment

### Option 1: Vercel (Recommended)

1. Install Vercel CLI: `pnpm add -g vercel`
2. From the `docs-site` directory, run: `vercel`
3. Configure the build settings:
   - Build command: `pnpm build`
   - Output directory: `.vitepress/dist`
4. Set up custom domain `docs.grantflow.dev` in Vercel dashboard

### Option 2: Netlify

1. Connect your repository to Netlify
2. Set build settings:
   - Build command: `pnpm build`
   - Publish directory: `.vitepress/dist`
   - Base directory: `docs-site`
3. Configure custom domain `docs.grantflow.dev`

### Option 3: GitHub Pages

1. Update `.vitepress/config.ts` to set `base: '/grantflow-dev/'` (or your repo name)
2. Add GitHub Actions workflow or use GitHub Pages directly
3. Point GitHub Pages to `.vitepress/dist` directory

## Adding New Documentation

1. Create a new `.md` file in the `guides/` directory
2. Add it to the sidebar in `.vitepress/config.ts`
3. Images should be placed in `guides/[guide-name]-images/`
4. Reference images with relative paths: `./[guide-name]-images/image.png`

## Customization

Edit `.vitepress/config.ts` to customize:
- Site title and description
- Navigation menu
- Sidebar structure
- Theme colors
- Social links
- Footer content
