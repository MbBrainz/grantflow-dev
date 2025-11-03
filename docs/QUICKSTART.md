# Quick Start Guide

## Local Development

```bash
# Navigate to docs directory
cd docs

# Install dependencies (if not already done)
pnpm install

# Start development server
pnpm dev
```

The site will be available at `http://localhost:5173`

## Project Structure

```
docs-site/
├── .vitepress/
│   └── config.ts              # Main configuration file
├── guides/                    # All documentation guides
│   ├── review-walkthrough.md
│   ├── submitter-walkthrough.md
│   ├── github-setup.md
│   ├── review-walkthrough-images/  # Images for review guide
│   └── submitter-walkthrough-images/ # Images for submitter guide
├── index.md                   # Homepage
├── package.json
├── README.md                  # Full documentation
├── DEPLOYMENT.md              # Deployment instructions
└── QUICKSTART.md              # This file
```

## Key Commands

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally

## Adding Content

1. **New Guide**: Create `.md` file in `guides/` folder
2. **Images**: Place in `guides/[guide-name]-images/` folder
3. **Update Sidebar**: Edit `.vitepress/config.ts` sidebar section
4. **Image Reference**: Use `./[guide-name]-images/image.png` format

## Configuration

Main configuration is in `.vitepress/config.ts`:
- Site title and metadata
- Navigation menu
- Sidebar structure
- Search settings
- Theme customization

## Next Steps

1. Review the documentation guides
2. Customize the theme/colors if needed
3. Deploy following `DEPLOYMENT.md`
4. Set up custom domain `docs.grantflow.dev`
