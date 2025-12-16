# GrantFlow QA Remediation Plan

This plan converts the QA executive summary into an implementation roadmap that stays DRY, reuses existing primitives, and avoids duplicate UI components.

## Decisions Confirmed

1) **Milestone totals must equal total amount**
- The “total funding amount” is **derived**, not user-entered.
- Submission `totalAmount` is persisted for analytics/reporting, but computed as: `sum(milestones.amount)`.

2) **Milestone “in progress” is a UI concept**
- We will **not** add a new database status unless we later find it’s required for audits/reporting.
- DB statuses remain canonical; UI derives:
  - **Locked**: cannot submit because prior milestone(s) not completed.
  - **Active / In progress**: first unlocked milestone that is not completed and not in review.

3) **Reject feedback minimum enforced via Zod**
- Reject votes must require **≥ 50 characters** of feedback.
- Enforce **server-side first**, plus client-side for immediate UX.

---

## Non-Negotiables (DRY + UX Consistency)

### Reuse existing primitives (do not create duplicates)
- Loading/disabled button wrapper: `src/components/ui/async-button.tsx`
- Button: `src/components/ui/button.tsx`
- Banner-style messaging: `src/components/ui/info-box.tsx` (use `variant="error|warning|success|info"`)
- Status pills: `src/components/ui/status-badge.tsx` (prefer this over local `StatusBadge` implementations)
- Toast system: `src/lib/hooks/use-toast.ts`
- Milestone totals validation utility: `src/lib/validation/submission.ts` (already used in new submission page)
- GitHub repo/commit reading: `src/lib/github/simple-client.ts` (already has `getRepositoryInfo`)
- Multisig explanation: `src/components/milestone/multisig-flow-explanation.tsx`

### When it’s OK to add a new component
- Only if it will be used **in at least 2 places immediately** and doesn’t already exist in `src/components/ui/*`.

---

## Workstreams and Phased Delivery (PR-sized)

### Phase 0 — Inventory + alignment (no behavioral changes)
**Goal:** Avoid rework and confirm all existing patterns.

- Inventory all button/loading patterns; converge on `AsyncButton` usage where appropriate.
- Inventory all ad-hoc status badges; converge on `src/components/ui/status-badge.tsx`.
- Inventory all server actions returning `{ error: string }` to ensure consistent display paths.

**Outputs**
- A short internal checklist in this doc updated with “found + location” notes.

---

### Phase 1 — Critical: consistent error handling + form feedback
**Goal:** Every form shows a prominent error state and consistent success feedback.

#### 1.1 Standardize server action return shape
- Extend `validatedActionWithUser` / `validatedActionWithUserState` to support:
  - `formError: string`
  - `fieldErrors: Record<string, string>` (optional)
- Keep backwards compatibility with existing `{ error: string }`.
- Source: `src/lib/auth/middleware.ts`

#### 1.2 One reusable “top-of-form error banner” pattern
- Use `InfoBox` with `variant="error"` instead of creating a new component.
- Implement a simple wrapper (`FormErrorBanner`) only if reused 2+ times and it only composes `InfoBox`.

#### 1.3 Apply consistently
- Submission creation: `src/app/(dashboard)/dashboard/submissions/new/page.tsx`
- Milestone submission: `src/components/milestone-submission-form.tsx`
- Grantee submission view: `src/components/submissions/grantee-submission-view.tsx`

**Acceptance criteria**
- Server validation failures are shown immediately and prominently.
- Field-level errors show inline where the form uses React Hook Form/Zod.
- Submissions do not “fail silently”; no more repeated clicking.

---

### Phase 2 — Critical: submission amount model (total derived from milestones)
**Goal:** Users cannot set total amount manually; it’s derived.

#### 2.1 UI changes (New Submission)
- Replace editable “Total Funding Amount” input with:
  - a computed, read-only “Total Funding (derived)” display
  - the existing milestone breakdown + warnings remain useful
- Update draft logic to stop storing `totalAmount` as user input (derive on load).
- File: `src/app/(dashboard)/dashboard/submissions/new/page.tsx`

#### 2.2 Server changes (Create submission)
- Update Zod schema to:
  - remove `totalAmount` from required user input (or ignore it)
  - validate milestone amounts are all valid/positive
  - compute `totalAmount = sum(milestones.amount)` during action
- Ensure persisted `submissions.totalAmount` is always derived.
- File: `src/app/(dashboard)/dashboard/submissions/actions.ts`

#### 2.3 Backfill / migration (if needed)
- If existing submissions have inconsistent totals, run a one-time migration:
  - `submissions.totalAmount = sum(milestones.amount)` for each submission
- Use drizzle migration or a safe script under `scripts/`.

**Acceptance criteria**
- UI cannot submit a mismatched total because there is no independent total.
- Backend rejects/normalizes any client-sent `totalAmount` payload.

---

### Phase 3 — Critical: milestone status consistency (remove “ghost states”)
**Goal:** DB statuses are consistent; UI clearly shows Locked vs In Progress vs Submitted for review.

#### 3.1 Canonical DB status definitions (keep current enum)
Current DB enum: `pending | in-review | changes-requested | completed | rejected` in `src/lib/db/schema/milestones.ts`.

Interpretation:
- `pending`: milestone not yet reviewed; may be “active/in progress” in UI if unlocked
- `in-review`: submitted, awaiting committee review
- `changes-requested`: committee responded; grantee must update and resubmit
- `rejected`: rejected (but system supports resubmission); UI should say “Rejected — resubmission required”
- `completed`: approved and paid (or otherwise finalized)

#### 3.2 Remove invalid `in_progress` usage
- Find and replace references to `in_progress` (not in DB enum) with canonical behavior:
  - If code means “unlocked/active”, derive in UI, don’t store as status.
  - If code means “not allowed”, use sequential checks + “locked” UI.
- Likely files (confirmed by QA summary + quick scan):
  - `src/app/(dashboard)/dashboard/submissions/milestone-actions.ts`
  - `src/components/submissions/grantee-submission-view.tsx`
  - `src/components/milestone-status.tsx`

#### 3.3 UI: add explicit “Locked” state
- Derive `locked` as: any previous milestone status != `completed`.
- Show:
  - Locked badge + message: “Complete Milestone X first”
  - Disable “Submit milestone” action when locked
- Keep server-side enforcement (already present) as the final authority:
  - `src/app/(dashboard)/dashboard/submissions/milestone-actions.ts`

#### 3.4 Data cleanup (optional)
- If any rows contain invalid statuses (should not be possible with enum), verify and fix.

**Acceptance criteria**
- A milestone never appears “submitted” while still showing `pending`.
- Users always see whether a milestone is locked, active, in review, rejected, or completed.

---

### Phase 4 — Critical: multisig + review dialog clarity and result feedback
**Goal:** Reviewers understand the on-chain transaction steps and see a clear result summary.

#### 4.1 Use the existing multisig explainer consistently
- Ensure `MultisigFlowExplanation` is shown in:
  - `src/components/milestone/milestone-voting-panel.tsx`
  - `src/components/review/milestone-review-dialog.tsx`
- Keep one authoritative explanation component:
  - `src/components/milestone/multisig-flow-explanation.tsx`

#### 4.2 Clarify wallet requirements by vote path
- In the review dialog:
  - “Approve requires wallet connection; Reject/Abstain do not.”
  - Check wallet status before allowing “Approve” selection/submit path.
- File: `src/components/review/milestone-review-dialog.tsx`

#### 4.3 Post-transaction summary (don’t auto-close instantly)
- After signing:
  - show tx hash, signature count vs threshold, and execution status
  - include block explorer link when available
  - keep dialog open briefly or until user closes
- Files:
  - `src/components/review/milestone-review-dialog.tsx`
  - potentially `src/components/milestone/milestone-voting-panel.tsx`

**Acceptance criteria**
- Reviewers can predict what happens before clicking.
- Reviewers always know whether their action created/approved/executed.

---

### Phase 5 — High: reviewer voting UX (filters, visibility, rejection requirements)
**Goal:** Reviewers quickly find items needing their vote and cannot reject without adequate feedback.

#### 5.1 Add “Needs My Vote” filter + improve naming
- Update `ReviewDashboardClient` filters:
  - Add “Needs My Vote”
  - Rename “Active” to “In Progress” / “Not Rejected”
  - Add count badges
  - Consider defaulting to “Needs My Vote”
- File: `src/app/(dashboard)/dashboard/review/review-dashboard-client.tsx`

#### 5.2 Show vote status prominently
- Ensure vote status is visible in:
  - submission list cards
  - submission header
- Files:
  - `src/components/submissions/reviewer-submission-view.tsx`
  - relevant list component(s) under `src/app/(dashboard)/dashboard/*`

#### 5.3 Enforce reject feedback minimum (Zod, server-side)
- Update the existing Zod schemas used by `submitReview`:
  - if `vote === "reject"`, require `feedback.trim().length >= 50`
- Apply client-side form hints/validation to match.
- Files:
  - `src/lib/db/schema/actions` (where `submitReviewSchema` lives)
  - `src/components/discussion/reviewer-voting.tsx`
  - `src/components/review/milestone-review-dialog.tsx`

**Acceptance criteria**
- Reject vote cannot be submitted without adequate feedback (server-enforced).
- Review dashboard can be filtered down to “things I must act on”.

---

### Phase 6 — High: discussion thread performance (pagination)
**Goal:** Large discussions don’t load everything and don’t full-page reload.

- Implement server-side pagination (20–50 messages per page).
- Add “Load more” and “Jump to latest”.
- Replace `window.location.reload()` behavior with a refetch/appended update.
- File: `src/components/discussion/discussion-thread.tsx`
- Expect changes in the relevant DB query for discussion/messages (likely under `src/lib/db/queries`).

**Acceptance criteria**
- Page load time does not grow linearly with message count.
- New messages do not force a full reload.

---

### Phase 7 — Medium: global UX consistency (labels, empty states, dates, loading)
**Goal:** Cohesive UX, fewer surprises, more predictability.

#### 7.1 Standardize button labels
- Create a small shared map of verb phrases for core actions (submission, milestone, multisig).
- Apply incrementally; prioritize irreversible actions with confirmations.

#### 7.2 Empty states
- Replace generic “No X found” with contextual guidance + primary action.
- Reuse `Card`/`InfoBox` patterns (avoid new empty-state component unless reused widely).

#### 7.3 Date/time formatting
- Create one shared helper for:
  - recent: relative (“2h ago”)
  - this week: “Mon 3:45 PM”
  - older: “Dec 6, 2025”
  - tooltip with full timestamp + timezone
- Replace ad-hoc `toLocaleDateString()` and duplicated `formatTimeAgo`.

#### 7.4 Loading states
- Use `AsyncButton` for action loading.
- Add skeletons/spinners for list fetches where users currently see “nothing”.

---

## Testing & Validation Checklist (per phase)

- Unit-level:
  - Zod schemas: reject feedback requirement, derived totals.
- Integration-level:
  - Create submission persists derived total.
  - Milestone sequential lock enforced (server + UI).
  - Review reject vote fails without sufficient feedback.
- UX sanity:
  - Top-of-form error banner shows for every action failure.
  - No full-page reloads for discussion updates after pagination work.

---

## Risks / Watchouts

- **Conflicting validation** currently exists around totals (equality refine vs “must not exceed”). Phase 2 must consolidate on “derived total” to eliminate contradictions.
- **Status drift**: UI currently references non-enum statuses (`in_progress`). Phase 3 must remove these to prevent runtime logic bugs.
- **Merged multisig workflow** is inherently complex; Phase 4 must prioritize clarity and “what just happened” feedback.

