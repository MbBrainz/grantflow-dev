# Polkadot Multisig Integration for Milestone Approvals

This document explains how GrantFlow integrates Polkadot multisig wallets for milestone-based grant payouts.

## Overview

GrantFlow supports two workflow patterns that committees can configure:

### 1. **Merged Workflow** (Decision + Execution Combined)
In this pattern, the review approval and blockchain signature happen together:

```
Grantee submits milestone
    ↓
Committee reviews (reviews table)
    ↓
Member approves review AND signs blockchain transaction (single action)
    ↓
More members approve/sign
    ↓
Threshold reached → Payment executes automatically
    ↓
Milestone marked complete
```

**Benefits:**
- ✅ Faster - one-step approval
- ✅ Atomic - decision = execution
- ✅ Less coordination overhead
- ✅ Ideal for high-trust committees

**Drawbacks:**
- ❌ Less flexibility
- ❌ Cannot approve conditionally without payment

### 2. **Separated Workflow** (Two-Phase Process)
In this pattern, review approval and payment execution are separate:

```
Grantee submits milestone
    ↓
Committee reviews and discusses (reviews table)
    ↓
Members vote approve/reject (off-chain decision)
    ↓
Quorum reached → Milestone marked "approved" (not paid yet)
    ↓
[MANUAL TRIGGER]
    ↓
Committee member initiates multisig payment
    ↓
Members sign blockchain transaction
    ↓
Threshold reached → Payment executes
    ↓
Milestone marked complete
```

**Benefits:**
- ✅ More control - separate approval from payment
- ✅ Can approve milestone before payment is ready
- ✅ Explicit financial authorization
- ✅ Better for regulated environments or high-value grants

**Drawbacks:**
- ❌ Slower - two-phase process
- ❌ More coordination required
- ❌ Payment can be delayed after approval

## Database Schema

### Tables

**1. `reviews`** (existing)
- Off-chain committee voting and feedback
- Used in BOTH workflows for discussion and decision-making
- Fields: submissionId, milestoneId, reviewerId, vote (approve/reject/abstain), feedback

**2. `milestone_approvals`** (new)
- On-chain multisig execution tracking
- Created when blockchain payment is initiated
- Fields: multisigCallHash, callData, timepoint, status, approvalWorkflow

**3. `multisig_signatures`** (new)
- Individual blockchain signatures from committee members
- Links back to reviews table via `reviewId`
- Fields: signatoryAddress, signatureType (signed/rejected), txHash, reviewId

### Relationships

```
Milestone
  ├── reviews[] (off-chain voting)
  └── milestone_approvals[] (on-chain execution)
        └── multisig_signatures[] (blockchain signatures)
              └── review (optional link)
```

## Workflow Implementation

### Merged Workflow

**Step 1: Member Approves (Decision + Execution)**
```typescript
// When member clicks "Approve" on milestone review
async function approveMilestoneWithSignature() {
  // 1. Create review record (off-chain vote)
  const review = await createReview({
    milestoneId,
    vote: 'approve',
    feedback: '...'
  })
  
  // 2. If first approval, initiate multisig
  const approval = await initiateMultisigApproval({
    milestoneId,
    approvalWorkflow: 'merged'
  })
  
  // 3. Sign blockchain transaction
  const signature = await createMultisigSignature({
    approvalId: approval.id,
    reviewId: review.id, // Link signature to review
    signatureType: 'signed',
    txHash: '0x...'
  })
}
```

**Step 2: Other Members Approve**
Same as above - approve + sign

**Step 3: Final Member Approval**
- Last approval triggers execution
- Payment sent automatically
- Milestone marked complete

### Separated Workflow

**Phase 1: Review Decision (Off-Chain)**
```typescript
// Members vote without blockchain interaction
async function voteOnMilestone() {
  const review = await createReview({
    milestoneId,
    vote: 'approve',
    feedback: '...'
  })
  
  // Check if quorum reached
  const quorum = await checkQuorum(milestoneId)
  if (quorum) {
    // Mark milestone as approved (but not paid)
    await updateMilestone(milestoneId, { 
      status: 'approved_pending_payment' 
    })
  }
}
```

**Phase 2: Payment Execution (On-Chain)**
```typescript
// Separate action to initiate payment
async function initiatePayment() {
  // 1. Verify milestone is approved
  if (milestone.status !== 'approved_pending_payment') {
    throw new Error('Milestone not approved yet')
  }
  
  // 2. Initiate multisig
  const approval = await initiateMultisigApproval({
    milestoneId,
    approvalWorkflow: 'separated'
  })
  
  // 3. First member signs
  await createMultisigSignature({
    approvalId: approval.id,
    reviewId: null, // No direct review link in separated mode
    signatureType: 'signed'
  })
}

// Other members sign the payment
async function signPayment() {
  await createMultisigSignature({
    approvalId,
    signatureType: 'signed'
  })
}
```

## Committee Configuration

Committees configure their workflow in the multisig settings:

```typescript
interface MultisigConfig {
  multisigAddress: string
  signatories: string[] // Committee member wallet addresses
  threshold: number // e.g., 2 of 3
  
  approvalWorkflow: 'merged' | 'separated'
  // ↑ This determines which workflow is used
  
  requireAllSignatories: boolean
  votingTimeoutBlocks: number
  automaticExecution: boolean
  network: 'polkadot' | 'kusama' | 'paseo'
}
```

## UI Components

### For Merged Workflow

**MilestoneReviewCard** - Single "Approve & Sign" button
- Shows wallet connection status
- One-click approval that triggers blockchain signature
- Progress shows: "2 of 3 approvals (signatures)"

### For Separated Workflow

**MilestoneReviewCard** - "Approve" button (phase 1)
- Off-chain voting
- Progress shows: "2 of 3 votes"

**MilestonePaymentCard** - Appears after approval (phase 2)
- "Initiate Payment" button (for first signer)
- "Sign Payment" button (for others)
- Shows blockchain transaction progress
- Progress shows: "2 of 3 signatures"

## Code Examples

See implementation in:
- `/lib/polkadot/multisig.ts` - Core blockchain functions
- `/app/(dashboard)/dashboard/submissions/multisig-actions.ts` - Server actions
- `/components/milestone/milestone-voting-panel.tsx` - UI components

## Security Considerations

1. **Merged Workflow Risks:**
   - Members must understand approval = immediate payment
   - Less time for reversal if mistake detected
   
2. **Separated Workflow Benefits:**
   - Can approve milestone technically, hold payment if needed
   - Time window for dispute resolution
   - Explicit financial authorization step

## Migration Path

Existing committees can:
1. Start with `separated` workflow (safer default)
2. Test with small amounts
3. Switch to `merged` workflow once comfortable
4. Configure per grant program if needed (future enhancement)



