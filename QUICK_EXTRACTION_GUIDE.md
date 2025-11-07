# Quick Extraction Guide

## TL;DR

Extract non-Polkadot improvements from `polkadot-integration` branch to a new `code-quality-improvements` branch.

## Quick Command Sequence

```bash
# 1. Create new branch from main
git checkout main
git pull origin main
git checkout -b code-quality-improvements

# 2. Extract improvements (run these commands)
git checkout polkadot-integration -- src/lib/utils.ts
git checkout polkadot-integration -- src/lib/reset.d.ts
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/security/page.tsx
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/general/page.tsx
git checkout polkadot-integration -- src/components/providers/notification-provider.tsx
git checkout polkadot-integration -- src/components/dashboard/user-committees.tsx
git checkout polkadot-integration -- src/lib/notifications/client.ts
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/submissions/submissions-page-client.tsx
git checkout polkadot-integration -- src/app/(login)/actions.ts
git checkout polkadot-integration -- src/app/(login)/login.tsx
git checkout polkadot-integration -- src/components/ui/status-badge.tsx
git checkout polkadot-integration -- src/components/ui/metadata-grid.tsx
git checkout polkadot-integration -- src/components/ui/info-box.tsx
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/committees/[id]/committee-detail-view.tsx
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/programs/[id]/grant-program-detail-view.tsx
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/submissions/new/page.tsx
git checkout polkadot-integration -- src/lib/auth/middleware.ts
git checkout polkadot-integration -- docs/index.md
git checkout polkadot-integration -- docs/README.md

# 3. Manual edits needed:
# - src/app/(dashboard)/layout.tsx: Remove Polkadot imports/components, keep fetcher
# - package.json: Add @total-typescript/ts-reset, add pnpm overrides, NO Polkadot deps

# 4. Test and commit
pnpm install
pnpm build
git add .
git commit -m "chore: extract code quality improvements from polkadot-integration"
git push origin code-quality-improvements
```

## Files to Extract (Summary)

### Type Safety
- `src/lib/utils.ts` - Typed fetcher
- `src/lib/reset.d.ts` - TS reset types
- Files using new fetcher (5 files)
- Type improvements (3 files)

### Error Handling
- `src/app/(login)/actions.ts`
- `src/app/(login)/login.tsx`

### UI Components
- `src/components/ui/status-badge.tsx`
- `src/components/ui/metadata-grid.tsx`
- `src/components/ui/info-box.tsx`

### Navigation
- 3 detail view files (remove back buttons)

### Code Quality
- `src/lib/auth/middleware.ts` - Documentation
- `src/lib/notifications/client.ts` - Type guards
- `src/app/(dashboard)/dashboard/submissions/submissions-page-client.tsx` - Labels parsing

### Documentation
- `docs/index.md`
- `docs/README.md`

## Files to AVOID (Polkadot-specific)

- `src/lib/polkadot/*` - All Polkadot files
- `src/components/wallet/*` - Wallet components
- `src/components/committee/multisig-config-form.tsx`
- `src/lib/db/schema/milestone-approvals.ts`
- `src/app/(dashboard)/dashboard/submissions/multisig-actions.ts`
- Any file with `multisig` or `polkadot` in name

## Manual Edits Required

1. **layout.tsx**: Remove LunoKitProvider, PolkadotWalletSelector, PolkadotChainSelector
2. **package.json**: Add `@total-typescript/ts-reset` only, no Polkadot deps

