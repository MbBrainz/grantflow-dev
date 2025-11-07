# Branch Isolation Plan: Non-Polkadot Improvements

## Analysis Summary

The `polkadot-integration` branch contains two categories of changes:
1. **Polkadot/Multisig Integration** (should stay on branch)
2. **General Code Quality Improvements** (should be isolated and merged to main)

## Category 1: Polkadot/Multisig Integration (Keep on Branch)

These changes are specifically for Polkadot integration and should remain on the branch:

### Core Polkadot Files
- `src/lib/polkadot/*` - All Polkadot integration files
- `src/components/wallet/*` - Wallet selector components
- `src/components/committee/multisig-config-form.tsx` - Multisig configuration UI
- `src/lib/db/schema/milestone-approvals.ts` - Multisig-related schema
- `src/lib/db/writes/milestone-approvals.ts` - Multisig write operations
- `src/lib/hooks/use-multisig-approval.ts` - Multisig hooks
- `src/app/(dashboard)/dashboard/submissions/multisig-actions.ts` - Multisig server actions
- `src/app/(dashboard)/dashboard/committees/[id]/actions.ts` - Multisig config update action

### Integration Points
- `src/app/(dashboard)/layout.tsx` - LunoKitProvider integration
- `src/components/milestone/milestone-voting-panel.tsx` - Multisig voting UI
- `src/components/milestone/signatory-vote-list.tsx` - Signatory display
- `src/components/review/milestone-review-dialog.tsx` - Multisig review integration
- `src/lib/db/schema/jsonTypes/GroupSettings.ts` - MultisigConfig type

### Configuration
- `.env.example` - Multisig environment variables
- `.gitignore` - `.papi/` directory (Polkadot API generated files)
- `eslint.config.mjs` - `.papi` ignore pattern
- `package.json` - Polkadot dependencies (`@luno-kit/*`, `dedot`, `@dedot/chaintypes`)

---

## Category 2: General Code Quality Improvements (Isolate & Merge)

These improvements are independent of Polkadot and should be extracted to a separate branch:

### 2.1 Type Safety Improvements

**Files to Extract:**
- `src/lib/utils.ts` - Added typed `fetcher` function
- `src/lib/reset.d.ts` - TypeScript reset types
- `package.json` - `@total-typescript/ts-reset` dependency

**Files Modified (using new fetcher):**
- `src/app/(dashboard)/dashboard/security/page.tsx`
- `src/app/(dashboard)/dashboard/general/page.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/components/providers/notification-provider.tsx`
- `src/components/dashboard/user-committees.tsx`

**Type Improvements:**
- `src/components/dashboard/user-committees.tsx` - Better SWR typing with Error type
- `src/components/providers/notification-provider.tsx` - Improved type guards
- `src/lib/notifications/client.ts` - Type guard for SSE messages
- `src/app/(dashboard)/dashboard/submissions/submissions-page-client.tsx` - Better labels parsing

### 2.2 Error Handling Improvements

**Files:**
- `src/app/(login)/actions.ts` - Connection error detection and better error messages
- `src/app/(login)/login.tsx` - Toast notifications for errors

### 2.3 UI/UX Improvements

**New Components:**
- `src/components/ui/status-badge.tsx` - Reusable status badge component
- `src/components/ui/metadata-grid.tsx` - Metadata display grid
- `src/components/ui/info-box.tsx` - Info box component

**Navigation Simplification:**
- `src/app/(dashboard)/dashboard/committees/[id]/committee-detail-view.tsx` - Removed "Back" button
- `src/app/(dashboard)/dashboard/programs/[id]/grant-program-detail-view.tsx` - Removed "Back" button
- `src/app/(dashboard)/dashboard/submissions/new/page.tsx` - Removed "Back" buttons

### 2.4 Code Quality

**Documentation:**
- `src/lib/auth/middleware.ts` - Added JSDoc comments for `validatedActionWithUser` and `validatedActionWithUserState`

**Type Safety:**
- `src/lib/notifications/client.ts` - Added type guard `isSSEMessage()` function
- Removed unnecessary eslint-disable comments where types are now properly handled

### 2.5 Documentation Cleanup

**Files:**
- `docs/index.md` - Removed github-setup.md references
- `docs/README.md` - Removed github-setup.md from structure
- `docs/QUICKSTART.md` - File deleted (if it existed)

### 2.6 Configuration

**Files:**
- `package.json` - pnpm overrides for build dependencies (unrelated to Polkadot)

---

## Git Isolation Strategy

### Option A: Create New Branch from Main (Recommended)

This approach creates a clean branch with only the improvements:

```bash
# 1. Ensure you're on polkadot-integration branch
git checkout polkadot-integration

# 2. Create a new branch from main for improvements
git checkout main
git pull origin main
git checkout -b code-quality-improvements

# 3. Cherry-pick or manually apply improvements
# For each improvement category, selectively apply changes

# Type Safety Improvements
git checkout polkadot-integration -- src/lib/utils.ts
git checkout polkadot-integration -- src/lib/reset.d.ts
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/security/page.tsx
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/general/page.tsx
git checkout polkadot-integration -- src/app/(dashboard)/layout.tsx
git checkout polkadot-integration -- src/components/providers/notification-provider.tsx
git checkout polkadot-integration -- src/components/dashboard/user-committees.tsx
git checkout polkadot-integration -- src/lib/notifications/client.ts
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/submissions/submissions-page-client.tsx

# Error Handling
git checkout polkadot-integration -- src/app/(login)/actions.ts
git checkout polkadot-integration -- src/app/(login)/login.tsx

# UI Components
git checkout polkadot-integration -- src/components/ui/status-badge.tsx
git checkout polkadot-integration -- src/components/ui/metadata-grid.tsx
git checkout polkadot-integration -- src/components/ui/info-box.tsx

# Navigation Simplification
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/committees/[id]/committee-detail-view.tsx
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/programs/[id]/grant-program-detail-view.tsx
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/submissions/new/page.tsx

# Documentation
git checkout polkadot-integration -- src/lib/auth/middleware.ts
git checkout polkadot-integration -- docs/index.md
git checkout polkadot-integration -- docs/README.md

# Package.json (selective - only non-Polkadot changes)
# Manually edit package.json to add:
# - @total-typescript/ts-reset in devDependencies
# - pnpm overrides (if not already present)

# 4. Review and commit
git add .
git commit -m "chore: extract code quality improvements from polkadot-integration branch

- Add typed fetcher utility function
- Improve error handling in login actions
- Add new UI components (StatusBadge, MetadataGrid, InfoBox)
- Simplify navigation by removing back buttons
- Improve type safety across codebase
- Add TypeScript reset types
- Improve SSE message type guards
- Better labels parsing in submissions"

# 5. Test the branch
pnpm install
pnpm build
pnpm test  # if tests exist

# 6. Create PR to main
git push origin code-quality-improvements
```

### Option B: Interactive Rebase (Advanced)

If you want to split commits on the polkadot-integration branch:

```bash
# 1. Create a backup branch
git checkout polkadot-integration
git branch polkadot-integration-backup

# 2. Interactive rebase to split commits
git rebase -i main

# 3. For each commit, use 'edit' to split it
# 4. Use git add -p to stage only non-Polkadot changes
# 5. Create new commits for improvements
# 6. Continue rebase

# This is more complex but preserves commit history
```

### Option C: Manual Extraction Script

Create a script to automate the file extraction:

```bash
#!/bin/bash
# extract-improvements.sh

BRANCH="polkadot-integration"
TARGET_BRANCH="code-quality-improvements"

# Files to extract (non-Polkadot improvements)
FILES=(
  "src/lib/utils.ts"
  "src/lib/reset.d.ts"
  "src/app/(dashboard)/dashboard/security/page.tsx"
  "src/app/(dashboard)/dashboard/general/page.tsx"
  "src/app/(login)/actions.ts"
  "src/app/(login)/login.tsx"
  "src/components/ui/status-badge.tsx"
  "src/components/ui/metadata-grid.tsx"
  "src/components/ui/info-box.tsx"
  "src/lib/auth/middleware.ts"
  "src/lib/notifications/client.ts"
  "docs/index.md"
  "docs/README.md"
  # ... add all files from Category 2
)

git checkout main
git pull origin main
git checkout -b $TARGET_BRANCH

for file in "${FILES[@]}"; do
  git checkout $BRANCH -- "$file" 2>/dev/null || echo "File not found: $file"
done

echo "Files extracted. Review changes and commit."
```

---

## Recommended Approach: Step-by-Step

### Phase 1: Create Improvement Branch

```bash
# Start from main
git checkout main
git pull origin main
git checkout -b code-quality-improvements
```

### Phase 2: Extract Type Safety Improvements

```bash
# Core utilities
git checkout polkadot-integration -- src/lib/utils.ts
git checkout polkadot-integration -- src/lib/reset.d.ts

# Files using new fetcher (but remove Polkadot-specific parts)
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/security/page.tsx
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/general/page.tsx
git checkout polkadot-integration -- src/components/providers/notification-provider.tsx
git checkout polkadot-integration -- src/components/dashboard/user-committees.tsx

# Remove Polkadot imports from layout.tsx manually
git checkout polkadot-integration -- src/app/(dashboard)/layout.tsx
# Then manually remove LunoKitProvider, PolkadotWalletSelector, etc.
```

### Phase 3: Extract Error Handling

```bash
git checkout polkadot-integration -- src/app/(login)/actions.ts
git checkout polkadot-integration -- src/app/(login)/login.tsx
```

### Phase 4: Extract UI Components

```bash
git checkout polkadot-integration -- src/components/ui/status-badge.tsx
git checkout polkadot-integration -- src/components/ui/metadata-grid.tsx
git checkout polkadot-integration -- src/components/ui/info-box.tsx
```

### Phase 5: Extract Navigation Simplification

```bash
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/committees/[id]/committee-detail-view.tsx
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/programs/[id]/grant-program-detail-view.tsx
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/submissions/new/page.tsx
```

### Phase 6: Extract Code Quality Improvements

```bash
git checkout polkadot-integration -- src/lib/auth/middleware.ts
git checkout polkadot-integration -- src/lib/notifications/client.ts
git checkout polkadot-integration -- src/app/(dashboard)/dashboard/submissions/submissions-page-client.tsx
```

### Phase 7: Extract Documentation

```bash
git checkout polkadot-integration -- docs/index.md
git checkout polkadot-integration -- docs/README.md
```

### Phase 8: Manual Edits Required

**package.json:**
- Add `@total-typescript/ts-reset` to devDependencies
- Add pnpm overrides (if not already present)
- Do NOT add Polkadot dependencies

**src/app/(dashboard)/layout.tsx:**
- Remove LunoKitProvider wrapper
- Remove PolkadotWalletSelector and PolkadotChainSelector imports/components
- Keep the fetcher import change

### Phase 9: Test & Commit

```bash
# Install dependencies
pnpm install

# Build to check for errors
pnpm build

# Review all changes
git status
git diff --cached

# Commit
git add .
git commit -m "chore: extract code quality improvements

- Add typed fetcher utility for SWR
- Improve error handling with connection detection
- Add toast notifications for login errors
- Create reusable UI components (StatusBadge, MetadataGrid, InfoBox)
- Simplify navigation by removing redundant back buttons
- Improve type safety with TypeScript reset types
- Add type guards for SSE messages
- Better labels parsing in submissions
- Improve documentation and code comments"
```

### Phase 10: Create PR

```bash
git push origin code-quality-improvements
# Create PR to main branch
```

---

## Verification Checklist

After extraction, verify:

- [ ] No Polkadot-related imports in extracted files
- [ ] No `@luno-kit` dependencies in package.json
- [ ] No multisig-related code
- [ ] All type improvements are present
- [ ] Error handling improvements are included
- [ ] New UI components are included
- [ ] Navigation simplifications are included
- [ ] Code builds successfully (`pnpm build`)
- [ ] No TypeScript errors
- [ ] No linting errors

---

## Post-Extraction: Clean Up Polkadot Branch

After merging improvements to main, rebase polkadot-integration:

```bash
git checkout polkadot-integration
git rebase main
# Resolve any conflicts
git push origin polkadot-integration --force-with-lease
```

This ensures the Polkadot branch only contains Polkadot-specific changes going forward.

