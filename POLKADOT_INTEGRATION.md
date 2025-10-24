# Polkadot Multisig Integration - Implementation Summary

This document summarizes the Polkadot multisig integration for GrantFlow's milestone-based grant payments.

## ✅ What Was Built

### 1. Database Schema Extensions

**New Tables:**
- `milestone_approvals` - Tracks on-chain multisig execution process
- `multisig_signatures` - Individual blockchain signatures from committee members

**Enhanced Tables:**
- `groups.settings.multisig` - Committee multisig wallet configuration
- Relationship: `multisig_signatures.reviewId` → `reviews.id` (links off-chain decision to on-chain execution)

### 2. Polkadot Client Setup

**Files:** `/src/lib/polkadot/`
- `client.ts` - WebSocket connection to Polkadot network (Paseo testnet / mainnet)
- `multisig.ts` - Core multisig functions:
  - `initiateMultisigApproval()` - First signatory publishes + votes
  - `approveMultisigCall()` - Intermediate signatories approve  
  - `finalizeMultisigCall()` - Last signatory executes transaction
  - `createBatchedPaymentCall()` - Atomic transfer + remark

### 3. Database Write Operations

**File:** `/src/lib/db/writes/milestone-approvals.ts`
- `createMilestoneApproval()` - Record multisig initiation
- `createMultisigSignature()` - Record individual signatures
- `getMilestoneApprovalWithVotes()` - Fetch approval with all signatures
- `completeMilestoneApproval()` - Mark milestone complete after execution
- `hasUserVoted()` - Check if signatory already signed

### 4. Server Actions

**File:** `/src/app/(dashboard)/dashboard/submissions/multisig-actions.ts`
- `initiateMultisigApproval` - Start multisig approval process
- `castMultisigVote` - Record intermediate signatures
- `finalizeMultisigApproval` - Execute final transaction and complete milestone
- `getMilestoneApprovalStatus` - Query current approval state

### 5. Wallet Provider

**File:** `/src/components/providers/polkadot-provider.tsx`
- React context for Polkadot wallet connections
- Supports: Polkadot.js, Talisman, SubWallet, Nova
- Auto-reconnection from localStorage
- Account selection and signer management

## 🔄 Two Workflow Patterns

Committees can choose between two approval workflows:

### Merged Workflow (Decision + Execution Combined)
```
Review Approval → Blockchain Signature → Threshold Met → Payment Executes
```
- **Use case:** High-trust committees, fast execution
- **Process:** Single action approves AND signs blockchain transaction
- **Link:** `multisig_signatures.reviewId` points to `reviews.id`

### Separated Workflow (Two-Phase Process)
```
Phase 1: Review Approval → Quorum → Mark "Approved Pending Payment"
Phase 2: Initiate Payment → Signatures → Threshold Met → Payment Executes
```
- **Use case:** High-value grants, regulated environments
- **Process:** Discuss/approve first, then separate payment authorization
- **Link:** Signatures in phase 2 have `reviewId = null`

## 📊 Configuration

Committee admins configure multisig in group settings:

```typescript
interface MultisigConfig {
  multisigAddress: string              // Committee's multisig wallet
  signatories: string[]                // Member wallet addresses
  threshold: number                    // Required signatures (e.g., 2 of 3)
  approvalWorkflow: 'merged' | 'separated'  // Which pattern to use
  requireAllSignatories: boolean       // Force all to sign vs. threshold
  votingTimeoutBlocks: number          // Expiry time
  automaticExecution: boolean          // Auto-execute on threshold
  network: 'polkadot' | 'kusama' | 'paseo'  // Which chain
}
```

## 🔐 Security & Architecture

**First-Signatory-Votes Pattern:**
- First committee member calls `asMulti` with full call data
- Transaction is published on-chain AND counts as first approval
- Deposit is locked from initiator (~20 tokens)
- Subsequent signatories use `approveAsMulti` (only need call hash)
- Final signatory provides full call data again to execute

**Atomic Execution:**
- Uses `utility.batchAll()` to combine transfer + remark
- All-or-nothing: both succeed or both fail
- On-chain record of milestone completion

**Type Safety:**
- All schemas use Zod validation
- Drizzle ORM type inference
- No `any` types in codebase

## 🚀 What's Next (Not Yet Implemented)

### Priority 1: UI Components
- [ ] `MilestoneVotingPanel` - Show approval progress, signature status
- [ ] `WalletConnectButton` - Connect Polkadot wallet extensions
- [ ] `ApprovalWorkflowSelector` - Toggle between merged/separated
- [ ] `SignatureProgress` - Visual progress of multisig approvals

### Priority 2: Integration with Existing Flow
- [ ] Replace manual `MilestoneCompletionForm` with multisig workflow
- [ ] Update `MilestoneStatus` component to show blockchain progress
- [ ] Add workflow selector in committee management UI
- [ ] Notification system for signature requests

### Priority 3: Testing & Validation
- [ ] Test on Paseo testnet with real committee
- [ ] Validate transaction cost calculations
- [ ] Error handling for failed transactions
- [ ] Edge cases: expired approvals, rejected signatures

### Priority 4: Advanced Features
- [ ] Query pending multisigs from blockchain
- [ ] Cancel/replace pending approvals
- [ ] Batch multiple milestone payments
- [ ] Historical signature analytics

## 📦 Dependencies Needed

Add to `package.json`:
```json
{
  "dependencies": {
    "polkadot-api": "^1.15.0",
    "@polkadot-api/descriptors": "latest",
    "@polkadot/util-crypto": "^12.0.0"
  }
}
```

## 🗄️ Database Migration

Run migration to create new tables:
```bash
pnpm db:push
```

This will create:
- `milestone_approvals` table
- `multisig_signatures` table  
- New enum types: `approval_status`, `signature_type`

## 🧪 Testing Checklist

Before production:
- [ ] Test wallet connections (all supported extensions)
- [ ] Test merged workflow end-to-end on testnet
- [ ] Test separated workflow end-to-end on testnet
- [ ] Verify transaction costs and gas estimates
- [ ] Test threshold edge cases (2/3, 3/5, unanimous)
- [ ] Test rejection/cancellation flows
- [ ] Verify proper error handling and rollback
- [ ] Load test with multiple concurrent approvals

## 📚 Documentation

See detailed documentation:
- `/src/lib/polkadot/README.md` - Workflow patterns and examples
- Polkadot multisig docs: https://wiki.polkadot.com/learn/learn-guides-accounts-multisig/
- PolkadotAPI docs: https://papi.how

## 🎯 Key Design Decisions

1. **Separate tables for reviews vs signatures** - Reviews are off-chain decisions, signatures are on-chain cryptographic proofs
2. **Optional reviewId link** - Connects off-chain vote to on-chain signature in merged workflow
3. **Workflow configuration** - Committees choose their own pattern based on trust/requirements
4. **First-signatory-votes** - Follows Polkadot best practice of publishing + voting in one transaction
5. **Batched calls** - Atomic transfer + remark ensures data integrity

## 🔗 Integration Points

**Existing Code Modified:**
- ❌ None yet (all new code, no modifications to existing)

**Existing Code Will Need Updates:**
- `src/components/milestone-completion-form.tsx` - Add multisig option
- `src/components/milestone-status.tsx` - Show blockchain status  
- `src/app/(dashboard)/dashboard/committees/[id]/manage/page.tsx` - Multisig config UI
- `src/components/review/milestone-review-dialog.tsx` - Integrate signature flow

## 💡 Usage Example (Pseudocode)

### Merged Workflow
```typescript
// Committee member approves milestone
async function approveMilestone() {
  // 1. Create review (off-chain)
  const review = await submitReview({ vote: 'approve' })
  
  // 2. Connect wallet and sign (on-chain)
  const { selectedSigner } = usePolkadot()
  
  // 3. Initiate or join multisig
  if (!existingApproval) {
    await initiateMultisigApproval({
      approvalWorkflow: 'merged',
      reviewId: review.id
    })
  } else {
    await castMultisigVote({
      signatureType: 'signed',
      reviewId: review.id
    })
  }
}
```

### Separated Workflow
```typescript
// Phase 1: Approve (off-chain)
async function approveMilestone() {
  await submitReview({ vote: 'approve' })
  // Quorum check happens automatically
}

// Phase 2: Execute payment (on-chain)
async function executePayment() {
  const { selectedSigner } = usePolkadot()
  
  await initiateMultisigApproval({
    approvalWorkflow: 'separated',
    reviewId: null // No review link in separated mode
  })
}
```

---

**Status:** Core infrastructure complete, UI integration pending
**Next Steps:** Build React components and integrate with existing milestone flow



