# Deployment Guide for docs.grantflow.dev

This guide walks through deploying the VitePress documentation site to `docs.grantflow.dev`.

## Prerequisites

- Repository access to grantflow-dev
- DNS access for grantflow.dev domain
- Vercel/Netlify account (or preferred hosting provider)

## Option 1: Vercel (Recommended - Easiest)

### Initial Setup

1. **Install Vercel CLI** (if not already installed):
```bash
pnpm add -g vercel
```

2. **From the docs-site directory, deploy**:
```bash
cd docs-site
vercel
```

3. **Follow the prompts**:
   - Link to existing project or create new
   - Confirm project settings
   - Deploy

### Configure for docs.grantflow.dev

1. **Add Custom Domain**:
   - Go to Vercel Dashboard > Your Project > Settings > Domains
   - Add `docs.grantflow.dev`
   - Follow DNS configuration instructions

2. **Configure DNS**:
   - Add a CNAME record pointing `docs.grantflow.dev` to `cname.vercel-dns.com`
   - Or use the A record provided by Vercel

3. **Build Settings** (in Vercel Dashboard):
   - Root Directory: `docs` (important: this makes Vercel use `docs/package.json`)
   - Build Command: `pnpm build`
   - Output Directory: `.vitepress/dist`
   - Install Command: `pnpm install`
   
   **Note**: The docs site is fully self-contained. It has its own `package.json` with all required dependencies (VitePress bundles everything it needs). No need to install dependencies from the root package.json.

### Continuous Deployment

Vercel will automatically deploy when you push to your main branch. Make sure your `vercel.json` (if needed) is configured correctly.

## Option 2: Netlify

### Initial Setup

1. **Connect Repository**:
   - Go to Netlify Dashboard
   - Add new site from Git
   - Select your repository

2. **Configure Build Settings**:
   ```
   Base directory: docs
   Build command: pnpm build
   Publish directory: docs/.vitepress/dist
   ```

3. **Environment Variables** (if needed):
   - Add `NODE_VERSION=20` or your preferred Node version

4. **Custom Domain**:
   - Go to Site Settings > Domain Management
   - Add custom domain: `docs.grantflow.dev`
   - Configure DNS as instructed

### Continuous Deployment

Netlify will automatically deploy on push to main branch.

## Option 3: GitHub Pages

1. **Update Config**:
   - Edit `docs-site/.vitepress/config.ts`
   - Set `base: '/grantflow-dev/'` (or your repo name)

2. **Build**:
```bash
cd docs-site
pnpm build
```

3. **Configure GitHub Pages**:
   - Go to Repository Settings > Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` or `main` with `/docs` folder
   - Folder: `.vitepress/dist`

4. **Use GitHub Actions** (Recommended):
   - Create `.github/workflows/docs.yml`:
```yaml
name: Deploy Docs

on:
  push:
    branches: [main]
    paths:
      - 'docs-site/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter docs-site build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs-site/.vitepress/dist
```

## Post-Deployment

1. **Verify HTTPS**: Ensure SSL certificate is active
2. **Test Navigation**: Check all links work correctly
3. **Test Images**: Verify all images load properly
4. **Search Functionality**: Test the search feature
5. **Mobile Responsiveness**: Test on mobile devices

## Troubleshooting

### Images Not Loading
- Check image paths are relative (starting with `./`)
- Verify images are in the correct directory structure
- Rebuild the site after moving images

### 404 Errors
- Ensure `base` in config matches your deployment path
- Check that all markdown files are in the correct locations
- Verify sidebar links match actual file paths

### Build Failures
- Check Node version (VitePress requires Node 18+)
- Ensure all dependencies are installed
- Check for syntax errors in config or markdown files

## Maintenance

- **Adding New Docs**: Add markdown files to `guides/` and update sidebar in `config.ts`
- **Updating**: Just push changes - deployment is automatic
- **Monitoring**: Check deployment logs in your hosting provider dashboard
