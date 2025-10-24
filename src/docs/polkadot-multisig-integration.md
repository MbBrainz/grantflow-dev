# Polkadot Multi-Sig Integration Documentation for Milestone-Based Grant Management

This comprehensive guide provides all necessary documentation to integrate Polkadot multi-signature functionality for managing **milestone-based grant approvals and payouts**. The focus is on connecting to existing multisig accounts, verifying committee member signatures, and implementing atomic approval workflows where the **first approval transaction publishes the multisig call and votes directly**, with optional settings for either **combined approval-and-payout** or **separate approval-then-payout** patterns based on committee preferences.

## Executive Summary

Your Next.js application with `polkadot-api: ^1.15.0` enables sophisticated milestone-based grant workflows where committee members vote on milestone completion while simultaneously initiating on-chain payouts. The integration centers on **three key patterns**: (1) **Atomic approval-execution** where milestone approval and payout happen together using `utility.batchAll`, (2) **Flexible committee settings** allowing either combined or separated voting and payment flows, and (3) **First-signatory-votes pattern** where the initiating transaction includes the first approval vote automatically. This approach eliminates coordination overhead by publishing the multisig transaction and first vote in a single extrinsic, with subsequent signatories approving using `approveAsMulti` until threshold is met.[1][2][3][4][5][6]

## Layer 1: Milestone-Based Grant Architecture

### Grant Lifecycle with Milestones

A milestone-based grant system structures payments around verifiable achievements:[7][8]

**Grant Structure**:
- Total grant amount divided across milestones
- Each milestone has deliverables and payment percentage
- Milestone completion triggers committee review
- Approval initiates on-chain payout for that milestone

**Database Schema**:

```typescript
interface Grant {
  id: string;
  committeeId: string;
  proposerAddress: string;
  beneficiaryAddress: string;
  title: string;
  description: string;
  totalAmount: string; // BigInt as string
  status: 'active' | 'completed' | 'cancelled';
  milestones: Milestone[];
  createdAt: Date;
}

interface Milestone {
  id: string;
  grantId: string;
  orderIndex: number; // 1, 2, 3, etc.
  title: string;
  description: string;
  deliverables: string[];
  payoutAmount: string; // BigInt as string
  payoutPercentage: number; // 0-100
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'paid';
  submittedAt: Date | null;
  reviewStartedAt: Date | null;
  approvedAt: Date | null;
  paidAt: Date | null;
  paymentTxHash: string | null;
}

interface MilestoneApproval {
  id: string;
  milestoneId: string;
  multisigCallHash: string;
  multisigCallData: string; // Hex-encoded
  timepoint: { height: number; index: number } | null;
  status: 'pending' | 'threshold_met' | 'executed' | 'cancelled';
  initiatorAddress: string;
  createdAt: Date;
  executedAt: Date | null;
  blockNumber: number | null;
}

interface SignatoryVote {
  id: string;
  approvalId: string;
  signatoryAddress: string;
  vote: 'approve' | 'reject';
  txHash: string;
  votedAt: Date;
  isInitiator: boolean;
  isFinalApproval: boolean;
}
```

### Committee Configuration

**Committee Settings for Approval Patterns**:

```typescript
interface GrantCommittee {
  id: string;
  name: string;
  multisigAddress: string;
  threshold: number;
  signatories: string[];
  
  // Approval Pattern Configuration
  approvalPattern: 'combined' | 'separated';
  
  // Combined: Approval automatically triggers payout when threshold met
  // Separated: Approval first, then separate explicit payout transaction
  
  // Additional settings
  requireAllSignatories: boolean; // If true, all must vote (not just threshold)
  votingTimeoutBlocks: number; // How long before vote expires
  automaticPayout: boolean; // Auto-execute payment on threshold
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Payment Workflow Patterns

**Pattern 1: Combined Approval-and-Payout (Atomic)**

The milestone approval transaction contains the payment call. When threshold is met, payment executes automatically:[9][10]

```
Milestone Submitted → Committee Member 1 initiates multisig with payout call
→ Committee Members 2..N approve
→ Last approval triggers execution → Payment sent automatically
```

**Pattern 2: Separated Approval-then-Payout**

Approval is separate from payment execution. After approval, explicit payout transaction is initiated:[11][7]

```
Milestone Submitted → Committee votes on approval (simple yes/no)
→ Threshold met → Milestone marked approved
→ Separate payout transaction initiated → Payment multisig approval cycle
```

## Layer 2: Atomic Transaction Patterns with Utility Pallet

### Understanding Utility Batching

Substrate's utility pallet provides batch transaction capabilities essential for atomic operations:[9][1]

**Three Batch Types**:[9]

1. **`utility.batch()`**: Executes sequentially, stops on error (not atomic)
2. **`utility.batchAll()`**: Atomic execution - all succeed or all rollback
3. **`utility.forceBatch()`**: Executes all, ignores errors (not atomic)

**Comparison**:[9]

| Function | Stops on Error | Atomic | Use Case |
|----------|---------------|--------|----------|
| `batch` | Yes | No | Sequential operations where partial success is acceptable |
| `batchAll` | Yes | Yes | **Critical operations requiring all-or-nothing** |
| `forceBatch` | No | No | Best-effort operations where failures are acceptable |

### Using batchAll for Milestone Approvals

For milestone-based grants, **`batchAll` ensures vote and payment are atomic**:[10][1][9]

```typescript
import { paseoApi } from '@/lib/polkadot/client';
import { MultiAddress } from '@polkadot-api/descriptors';

// Create the payment transfer
const paymentCall = paseoApi.tx.Balances.transfer_keep_alive({
  dest: MultiAddress.Id(beneficiaryAddress),
  value: milestonePayoutAmount,
});

// Create state update (optional: record milestone completion on-chain)
const remarkCall = paseoApi.tx.System.remark({
  remark: `Milestone ${milestoneId} approved and paid`,
});

// Batch them atomically
const batchedCall = paseoApi.tx.Utility.batch_all({
  calls: [paymentCall, remarkCall],
});

// Now wrap in multisig
const multisigTx = paseoApi.tx.Multisig.as_multi({
  threshold,
  other_signatories: sortedOtherSignatories,
  maybe_timepoint: null, // null for first approval
  call: batchedCall.decodedCall,
  max_weight: {
    ref_time: 2000000000n, // Higher for batch
    proof_size: 500000n,
  },
});
```

**Key Benefits**:
- **Atomicity**: Payment only succeeds if all batch calls succeed
- **Data integrity**: On-chain record and payment confirmed together
- **Gas efficiency**: Single transaction vs multiple

### Batch Limits and Considerations

**Maximum Batch Size**:[1]

```typescript
// Query the limit
const batchLimit = await paseoApi.constants.Utility.batched_calls_limit();
console.log(`Max batched calls: ${batchLimit}`); // Typically ~10,922
```

**Best Practices**:
- Keep batches small (2-5 calls) for milestone payments
- Estimate total weight before submission
- Use `batchAll` for financial operations requiring atomicity
- Test batch size on testnet before production use

## Layer 3: First-Signatory-Votes Pattern

### Understanding asMulti Behavior

The `asMulti` extrinsic serves dual purposes:[3][4][12]

**For First Signatory** (with `maybeTimepoint: null`):
1. **Publishes** the multisig call on-chain
2. **Automatically counts** as first approval
3. **Locks deposit** from initiator (~20 tokens)
4. **Returns timepoint** for subsequent approvers

**For Final Signatory** (with timepoint and full call data):
1. **Provides final approval** 
2. **Executes the call** if threshold is met
3. **Releases deposit** back to initiator
4. **Emits events** for successful execution

**Key Insight**: The first signatory doesn't need a separate "approve" transaction - `asMulti` publishes AND votes in one action.[12][3]

### Implementation: First Approval with Vote

```typescript
import { blake2AsHex } from '@polkadot/util-crypto';
import { sortAddresses } from '@polkadot/util-crypto';

interface InitiateApprovalResult {
  txHash: string;
  callHash: string;
  callData: string;
  timepoint: { height: number; index: number };
  approvalId: string;
}

export async function initiateMillestoneApproval(
  milestoneId: string,
  beneficiaryAddress: string,
  payoutAmount: bigint,
  multisigAddress: string,
  signatories: string[],
  threshold: number,
  initiatorSigner: PolkadotSigner,
  initiatorAddress: string
): Promise<InitiateApprovalResult> {
  
  // 1. Create the payout call (or batch)
  const payoutCall = paseoApi.tx.Balances.transfer_keep_alive({
    dest: MultiAddress.Id(beneficiaryAddress),
    value: payoutAmount,
  });

  // 2. Get call data and hash
  const callData = await payoutCall.getEncodedData();
  const callHash = blake2AsHex(callData);

  // 3. Get sorted other signatories
  const otherSignatories = signatories
    .filter(addr => addr !== initiatorAddress)
    .sort((a, b) => sortAddresses([a, b], 0).indexOf(a) - sortAddresses([a, b], 0).indexOf(b));

  // 4. Create multisig transaction (publishes + first vote)
  const multisigTx = paseoApi.tx.Multisig.as_multi({
    threshold,
    other_signatories: otherSignatories,
    maybe_timepoint: null, // Null = first approval
    call: payoutCall.decodedCall,
    max_weight: {
      ref_time: 1000000000n,
      proof_size: 300000n,
    },
  });

  // 5. Sign and submit with observable for timepoint extraction
  return new Promise((resolve, reject) => {
    multisigTx.signSubmitAndWatch(initiatorSigner).subscribe({
      next: async (event) => {
        if (event.type === 'finalized') {
          if (event.ok) {
            const timepoint = {
              height: event.block.number,
              index: event.txIndex,
            };

            // 6. Store in database
            const approval = await createMilestoneApproval({
              milestoneId,
              callHash,
              callData: Buffer.from(callData).toString('hex'),
              timepoint,
              initiatorAddress,
              status: 'pending',
            });

            // 7. Record initiator's vote
            await createSignatoryVote({
              approvalId: approval.id,
              signatoryAddress: initiatorAddress,
              vote: 'approve',
              txHash: event.txHash,
              isInitiator: true,
              isFinalApproval: false,
            });

            resolve({
              txHash: event.txHash,
              callHash,
              callData: Buffer.from(callData).toString('hex'),
              timepoint,
              approvalId: approval.id,
            });
          } else {
            reject(new Error('Transaction failed'));
          }
        }
      },
      error: reject,
    });
  });
}
```

**What Happens**:
1. First signatory calls `asMulti` with full call data
2. Transaction is published on-chain
3. First approval is automatically recorded
4. Deposit is locked from initiator
5. Timepoint is created for tracking
6. Database records approval with initiator's vote

### Subsequent Approvals

**Intermediate Signatories** (not the last one) use `approveAsMulti`:[2][3]

```typescript
export async function approveMillestoneApproval(
  approvalId: string,
  callHash: string,
  timepoint: { height: number; index: number },
  multisigAddress: string,
  signatories: string[],
  threshold: number,
  signerAccount: PolkadotSigner,
  signerAddress: string
): Promise<string> {
  
  // Get sorted other signatories
  const otherSignatories = signatories
    .filter(addr => addr !== signerAddress)
    .sort();

  // Create approval transaction (only needs hash)
  const approvalTx = paseoApi.tx.Multisig.approve_as_multi({
    threshold,
    other_signatories: otherSignatories,
    maybe_timepoint: timepoint, // Required after first approval
    call_hash: callHash,
    max_weight: {
      ref_time: 1000000000n,
      proof_size: 300000n,
    },
  });

  // Sign and submit
  const txHash = await approvalTx.signAndSubmit(signerAccount);

  // Record vote in database
  await createSignatoryVote({
    approvalId,
    signatoryAddress: signerAddress,
    vote: 'approve',
    txHash,
    isInitiator: false,
    isFinalApproval: false,
  });

  return txHash;
}
```

### Final Approval and Execution

**Last Required Signatory** must provide full call data to execute:[4][2][3]

```typescript
export async function finalizeMillestoneApproval(
  approvalId: string,
  callData: string, // Hex-encoded from database
  timepoint: { height: number; index: number },
  beneficiaryAddress: string,
  payoutAmount: bigint,
  multisigAddress: string,
  signatories: string[],
  threshold: number,
  signerAccount: PolkadotSigner,
  signerAddress: string
): Promise<{ txHash: string; blockNumber: number }> {
  
  const otherSignatories = signatories
    .filter(addr => addr !== signerAddress)
    .sort();

  // Reconstruct the original call
  const payoutCall = paseoApi.tx.Balances.transfer_keep_alive({
    dest: MultiAddress.Id(beneficiaryAddress),
    value: payoutAmount,
  });

  // Create final multisig transaction
  const finalTx = paseoApi.tx.Multisig.as_multi({
    threshold,
    other_signatories: otherSignatories,
    maybe_timepoint: timepoint, // Provide timepoint
    call: payoutCall.decodedCall, // Full call data required
    max_weight: {
      ref_time: 1000000000n,
      proof_size: 300000n,
    },
  });

  // Sign and watch for execution
  return new Promise((resolve, reject) => {
    finalTx.signSubmitAndWatch(signerAccount).subscribe({
      next: async (event) => {
        if (event.type === 'finalized') {
          if (event.ok) {
            // Record final vote
            await createSignatoryVote({
              approvalId,
              signatoryAddress: signerAddress,
              vote: 'approve',
              txHash: event.txHash,
              isInitiator: false,
              isFinalApproval: true,
            });

            // Update approval status
            await updateMilestoneApproval(approvalId, {
              status: 'executed',
              executedAt: new Date(),
              blockNumber: event.block.number,
            });

            // Update milestone status
            await updateMilestoneStatus(milestoneId, 'paid', {
              paymentTxHash: event.txHash,
              paidAt: new Date(),
            });

            resolve({
              txHash: event.txHash,
              blockNumber: event.block.number,
            });
          } else {
            reject(new Error('Final execution failed'));
          }
        }
      },
      error: reject,
    });
  });
}
```

## Layer 4: Committee Preference Settings

### Flexible Approval Patterns

Different committees have different governance needs. Support both patterns in your system:

**Configuration Component**:

```typescript
interface CommitteePreferences {
  // Approval pattern
  approvalPattern: 'combined' | 'separated';
  
  // If 'combined': Milestone approval includes payment
  // If 'separated': Milestone approval is vote only, payment separate
  
  // Voting requirements
  requireAllSignatories: boolean; // vs just threshold
  votingPeriodBlocks: number; // Time limit for voting
  
  // Execution settings
  automaticExecution: boolean; // Auto-execute on threshold or manual trigger
  paymentDelay: number; // Blocks to wait after approval before payment
  
  // Notification settings
  notifyOnInitiation: boolean;
  notifyOnEachVote: boolean;
  notifyOnThresholdMet: boolean;
  notifyOnExecution: boolean;
}
```

### Pattern 1: Combined Approval-Payment

**Use Case**: Fast-moving grants, high-trust committees, milestone-based releases

**Implementation**:

```typescript
async function initiateMillestoneWithCombinedPayment(
  milestone: Milestone,
  committee: GrantCommittee,
  initiatorSigner: PolkadotSigner,
  initiatorAddress: string
) {
  // Verify committee preference
  if (committee.approvalPattern !== 'combined') {
    throw new Error('Committee requires separated approval pattern');
  }

  // Create payment call
  const paymentCall = paseoApi.tx.Balances.transfer_keep_alive({
    dest: MultiAddress.Id(milestone.beneficiaryAddress),
    value: BigInt(milestone.payoutAmount),
  });

  // Optional: Add on-chain record
  const remarkCall = paseoApi.tx.System.remark({
    remark: `Grant ${milestone.grantId} - Milestone ${milestone.orderIndex} payment`,
  });

  // Batch atomically
  const batchedCall = paseoApi.tx.Utility.batch_all({
    calls: [paymentCall, remarkCall],
  });

  // Initiate multisig with first vote
  const result = await initiateMillestoneApproval(
    milestone.id,
    milestone.beneficiaryAddress,
    BigInt(milestone.payoutAmount),
    committee.multisigAddress,
    committee.signatories,
    committee.threshold,
    initiatorSigner,
    initiatorAddress
  );

  return result;
}
```

**Workflow**:
1. Committee member initiates → publishes call + first vote
2. Other members approve (n-2 approvals)
3. Last member approves → **payment executes automatically**
4. Milestone marked as paid in database

### Pattern 2: Separated Approval-Payment

**Use Case**: High-value grants, regulated environments, separate financial approval

**Implementation**:

```typescript
// Step 1: Vote on milestone approval (no payment)
async function initiateMillestoneApprovalOnly(
  milestone: Milestone,
  committee: GrantCommittee,
  initiatorSigner: PolkadotSigner,
  initiatorAddress: string
) {
  // Verify committee preference
  if (committee.approvalPattern !== 'separated') {
    throw new Error('Committee requires combined approval pattern');
  }

  // Create a simple remark for approval voting
  const approvalCall = paseoApi.tx.System.remark({
    remark: JSON.stringify({
      type: 'milestone_approval',
      grantId: milestone.grantId,
      milestoneId: milestone.id,
      milestoneIndex: milestone.orderIndex,
      vote: 'approve',
    }),
  });

  // Initiate multisig
  const result = await initiateMillestoneApproval(
    milestone.id,
    milestone.beneficiaryAddress,
    0n, // No payment in approval phase
    committee.multisigAddress,
    committee.signatories,
    committee.threshold,
    initiatorSigner,
    initiatorAddress
  );

  // Mark milestone as under approval
  await updateMilestoneStatus(milestone.id, 'under_review');

  return result;
}

// Step 2: After approval threshold met, initiate payment separately
async function initiateMillestonePayment(
  milestone: Milestone,
  committee: GrantCommittee,
  initiatorSigner: PolkadotSigner,
  initiatorAddress: string
) {
  // Verify milestone is approved
  if (milestone.status !== 'approved') {
    throw new Error('Milestone not yet approved');
  }

  // Create payment call
  const paymentCall = paseoApi.tx.Balances.transfer_keep_alive({
    dest: MultiAddress.Id(milestone.beneficiaryAddress),
    value: BigInt(milestone.payoutAmount),
  });

  // Initiate new multisig cycle for payment
  const result = await initiateMillestoneApproval(
    milestone.id,
    milestone.beneficiaryAddress,
    BigInt(milestone.payoutAmount),
    committee.multisigAddress,
    committee.signatories,
    committee.threshold,
    initiatorSigner,
    initiatorAddress
  );

  return result;
}
```

**Workflow**:
1. Committee member initiates approval vote (on-chain remark)
2. Members vote using `approveAsMulti`
3. Threshold met → milestone marked as **approved** (not paid)
4. Separate transaction initiated for payment
5. Payment follows same multisig approval cycle
6. Final approval executes payment

### Dynamic Pattern Selection

**UI Component for Pattern Selection**:

```typescript
'use client';

import { useState } from 'react';

interface ApprovalPatternSelectorProps {
  committee: GrantCommittee;
  milestone: Milestone;
  onInitiate: (pattern: 'combined' | 'separated') => Promise<void>;
}

export function ApprovalPatternSelector({
  committee,
  milestone,
  onInitiate,
}: ApprovalPatternSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(committee.approvalPattern);

  const handleInitiate = async () => {
    setLoading(true);
    try {
      await onInitiate(selectedPattern);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3>Milestone Approval Pattern</h3>
        <p>Committee Default: {committee.approvalPattern}</p>
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="combined"
            checked={selectedPattern === 'combined'}
            onChange={(e) => setSelectedPattern(e.target.value as 'combined')}
          />
          <div>
            <strong>Combined Approval & Payment</strong>
            <p className="text-sm">
              Milestone approval automatically triggers payment when threshold is met.
              Faster execution, atomic transaction.
            </p>
          </div>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="separated"
            checked={selectedPattern === 'separated'}
            onChange={(e) => setSelectedPattern(e.target.value as 'separated')}
          />
          <div>
            <strong>Separated Approval then Payment</strong>
            <p className="text-sm">
              Milestone approval is recorded first. Payment requires separate
              multisig approval cycle. More control, explicit payment authorization.
            </p>
          </div>
        </label>
      </div>

      {selectedPattern !== committee.approvalPattern && (
        <div className="bg-yellow-50 p-3 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ Warning: You've selected a pattern different from committee default.
            This may require committee consensus.
          </p>
        </div>
      )}

      <button
        onClick={handleInitiate}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Initiating...' : 'Initiate Milestone Approval'}
      </button>

      <div className="text-xs text-gray-600 space-y-1">
        <p>Multisig: {committee.multisigAddress}</p>
        <p>Threshold: {committee.threshold} of {committee.signatories.length}</p>
        <p>Payout Amount: {milestone.payoutAmount} PAS</p>
      </div>
    </div>
  );
}
```

## Layer 5: Complete Integration Example

### React Hook for Milestone Approvals

```typescript
// hooks/useMillestoneApprovals.ts
import { useState, useCallback, useEffect } from 'react';
import { usePolkadot } from '@/providers/PolkadotProvider';
import { useWalletExtension } from './useWalletExtension';

export function useMillestoneApprovals(
  committeeId: string,
  milestoneId: string
) {
  const { api } = usePolkadot();
  const { selectedAccount } = useWalletExtension();
  const [loading, setLoading] = useState(false);
  const [approval, setApproval] = useState<MilestoneApproval | null>(null);
  const [votes, setVotes] = useState<SignatoryVote[]>([]);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(false);

  // Fetch current approval state
  useEffect(() => {
    async function fetchApproval() {
      const response = await fetch(`/api/milestones/${milestoneId}/approvals`);
      const data = await response.json();
      
      if (data.approval) {
        setApproval(data.approval);
        setVotes(data.votes);
        
        // Check if user has voted
        const userVote = data.votes.find(
          (v: SignatoryVote) => v.signatoryAddress === selectedAccount?.address
        );
        setUserHasVoted(!!userVote);
        
        // Check if it's user's turn (threshold not met and user hasn't voted)
        const votesCount = data.votes.length;
        const committee = data.committee;
        setIsUserTurn(
          !userVote && 
          votesCount < committee.threshold &&
          committee.signatories.includes(selectedAccount?.address)
        );
      }
    }

    if (selectedAccount) {
      fetchApproval();
    }
  }, [milestoneId, selectedAccount]);

  // Initiate approval with first vote
  const initiateApproval = useCallback(async (
    milestone: Milestone,
    committee: GrantCommittee,
    pattern: 'combined' | 'separated'
  ) => {
    if (!selectedAccount) throw new Error('No wallet connected');
    
    setLoading(true);
    try {
      let result;
      
      if (pattern === 'combined') {
        result = await initiateMillestoneWithCombinedPayment(
          milestone,
          committee,
          selectedAccount.polkadotSigner,
          selectedAccount.address
        );
      } else {
        result = await initiateMillestoneApprovalOnly(
          milestone,
          committee,
          selectedAccount.polkadotSigner,
          selectedAccount.address
        );
      }

      setApproval(result.approval);
      return result;
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  // Cast approval vote
  const castVote = useCallback(async (
    approvalData: MilestoneApproval,
    committee: GrantCommittee
  ) => {
    if (!selectedAccount) throw new Error('No wallet connected');
    if (userHasVoted) throw new Error('Already voted');
    
    setLoading(true);
    try {
      const currentVotes = votes.length;
      const isLastVote = currentVotes + 1 === committee.threshold;

      let txHash: string;

      if (isLastVote) {
        // Final approval - executes transaction
        const result = await finalizeMillestoneApproval(
          approvalData.id,
          approvalData.multisigCallData,
          approvalData.timepoint!,
          milestone.beneficiaryAddress,
          BigInt(milestone.payoutAmount),
          committee.multisigAddress,
          committee.signatories,
          committee.threshold,
          selectedAccount.polkadotSigner,
          selectedAccount.address
        );
        txHash = result.txHash;
      } else {
        // Intermediate approval
        txHash = await approveMillestoneApproval(
          approvalData.id,
          approvalData.multisigCallHash,
          approvalData.timepoint!,
          committee.multisigAddress,
          committee.signatories,
          committee.threshold,
          selectedAccount.polkadotSigner,
          selectedAccount.address
        );
      }

      setUserHasVoted(true);
      return txHash;
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, votes, userHasVoted, milestone]);

  const votesNeeded = approval && votes 
    ? committee.threshold - votes.length 
    : 0;

  const progressPercentage = approval && votes
    ? (votes.length / committee.threshold) * 100
    : 0;

  return {
    approval,
    votes,
    userHasVoted,
    isUserTurn,
    votesNeeded,
    progressPercentage,
    initiateApproval,
    castVote,
    loading,
  };
}
```

### UI Component for Milestone Voting

```typescript
'use client';

import { useMillestoneApprovals } from '@/hooks/useMillestoneApprovals';

interface MilestoneVotingPanelProps {
  milestone: Milestone;
  committee: GrantCommittee;
}

export function MilestoneVotingPanel({
  milestone,
  committee,
}: MilestoneVotingPanelProps) {
  const {
    approval,
    votes,
    userHasVoted,
    isUserTurn,
    votesNeeded,
    progressPercentage,
    initiateApproval,
    castVote,
    loading,
  } = useMillestoneApprovals(committee.id, milestone.id);

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          Milestone {milestone.orderIndex}: {milestone.title}
        </h3>
        <p className="text-sm text-gray-600">{milestone.description}</p>
        <p className="text-lg font-bold mt-2">
          Payout: {milestone.payoutAmount} PAS ({milestone.payoutPercentage}%)
        </p>
      </div>

      {/* Voting Status */}
      {approval ? (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Approval Progress</span>
              <span>{votes.length} / {committee.threshold} votes</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Vote List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Committee Votes:</h4>
            {committee.signatories.map((signatory) => {
              const vote = votes.find(v => v.signatoryAddress === signatory);
              return (
                <div key={signatory} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs">
                    {signatory.slice(0, 8)}...{signatory.slice(-6)}
                  </span>
                  {vote ? (
                    <span className="text-green-600 flex items-center">
                      ✓ Voted
                      {vote.isInitiator && ' (Initiator)'}
                      {vote.isFinalApproval && ' (Executed)'}
                    </span>
                  ) : (
                    <span className="text-gray-400">Pending</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* User Action */}
          {isUserTurn && !userHasVoted && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="font-semibold mb-2">Your vote is needed!</p>
              <p className="text-sm mb-3">
                {votesNeeded} more vote{votesNeeded !== 1 ? 's' : ''} needed to reach threshold.
              </p>
              <button
                onClick={() => castVote(approval, committee)}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Signing...' : votesNeeded === 1 ? 'Cast Final Vote & Execute' : 'Cast Approval Vote'}
              </button>
            </div>
          )}

          {userHasVoted && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-700">✓ You have voted on this milestone</p>
            </div>
          )}

          {approval.status === 'executed' && (
            <div className="bg-green-100 border border-green-300 rounded p-4">
              <p className="font-semibold text-green-800">
                ✓ Milestone Approved & Payment Executed
              </p>
              <a
                href={`https://paseo.subscan.io/extrinsic/${milestone.paymentTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm underline"
              >
                View transaction on explorer →
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-600">Milestone ready for approval voting</p>
          <ApprovalPatternSelector
            committee={committee}
            milestone={milestone}
            onInitiate={(pattern) => initiateApproval(milestone, committee, pattern)}
          />
        </div>
      )}

      {/* Approval Pattern Info */}
      <div className="text-xs text-gray-500 border-t pt-3">
        <p>Committee Pattern: <strong>{committee.approvalPattern}</strong></p>
        {committee.approvalPattern === 'combined' && (
          <p className="text-blue-600">
            ℹ️ Payment executes automatically when threshold is reached
          </p>
        )}
        {committee.approvalPattern === 'separated' && (
          <p className="text-orange-600">
            ℹ️ Separate payment approval required after milestone approval
          </p>
        )}
      </div>
    </div>
  );
}
```

## Layer 6: Advanced Features

### Milestone Dependencies and Sequential Payouts

```typescript
interface Milestone {
  // ... existing fields
  dependsOnMilestoneId: string | null; // Must be completed first
  allowParallelApproval: boolean; // Can vote before dependencies complete
}

// Check if milestone can be initiated
function canInitiateMilestone(milestone: Milestone, allMilestones: Milestone[]): boolean {
  if (!milestone.dependsOnMilestoneId) return true;
  
  const dependency = allMilestones.find(m => m.id === milestone.dependsOnMilestoneId);
  return dependency?.status === 'paid';
}

// Enforce sequential payouts with validation
async function initiateWithDependencyCheck(
  milestone: Milestone,
  grant: Grant,
  committee: GrantCommittee
) {
  const canInitiate = canInitiateMilestone(milestone, grant.milestones);
  
  if (!canInitiate) {
    throw new Error('Previous milestone must be completed first');
  }

  // Proceed with initiation
  return initiateMillestoneApproval(/* ... */);
}
```

### Batch Milestone Approvals

For multiple milestones approved simultaneously:

```typescript
async function batchApproveMilestones(
  milestones: Milestone[],
  beneficiaryAddress: string,
  committee: GrantCommittee
) {
  // Create payment calls for each milestone
  const paymentCalls = milestones.map(m =>
    paseoApi.tx.Balances.transfer_keep_alive({
      dest: MultiAddress.Id(beneficiaryAddress),
      value: BigInt(m.payoutAmount),
    })
  );

  // Batch all payments atomically
  const batchedPayments = paseoApi.tx.Utility.batch_all({
    calls: paymentCalls,
  });

  // Wrap in multisig
  const multisigTx = paseoApi.tx.Multisig.as_multi({
    threshold: committee.threshold,
    other_signatories: getOtherSignatories(committee, initiatorAddress),
    maybe_timepoint: null,
    call: batchedPayments.decodedCall,
    max_weight: {
      ref_time: 5000000000n, // Higher for batch
      proof_size: 1000000n,
    },
  });

  return multisigTx.signAndSubmit(signer);
}
```

### Querying Pending Approvals

```typescript
async function getPendingMilestoneApprovals(
  multisigAddress: string,
  committee: GrantCommittee
): Promise<PendingApproval[]> {
  // Query on-chain multisig storage
  const entries = await paseoApi.query.Multisig.Multisigs.getEntries(multisigAddress);

  const pending: PendingApproval[] = [];

  for (const [key, value] of entries) {
    if (value) {
      const callHash = key.args[1].toHex();
      
      // Match with database approvals
      const approval = await getApprovalByCallHash(callHash);
      
      if (approval) {
        pending.push({
          approval,
          onChainData: {
            depositor: value.depositor,
            when: value.when,
            approvals: value.approvals,
            deposit: value.deposit,
          },
        });
      }
    }
  }

  return pending;
}
```

## Layer 7: Reference Documentation

### Core Resources
- **Polkadot-API Documentation**: https://papi.how[13]
- **Multisig Guide**: https://wiki.polkadot.com/learn/learn-guides-accounts-multisig/[3]
- **Multisig Pallet**: https://docs.moonbeam.network/builders/substrate/interfaces/account/multisig/[2]
- **Utility Pallet Batching**: https://wiki.polkadot.com/learn/learn-transactions/[9]

### Transaction Patterns
- **Batch Transactions**: https://docs.moonbeam.network/builders/substrate/interfaces/utility/utility/[1]
- **Transaction Construction**: https://wiki.polkadot.com/learn/learn-transaction-construction/[14]
- **Polkadot.js Transactions**: https://polkadot.js.org/docs/api/cookbook/tx/[15]

### Milestone-Based Systems
- **Multi-Asset Treasury**: https://forum.polkadot.network/t/multi-asset-treasury-and-milestone-based-spends/6780[7]
- **Treasury Guardian Tool**: https://polkadot.subsquare.io/polkassembly/posts/3337[8]
- **OpenGov Treasury**: https://wiki.polkadot.com/learn/learn-polkadot-opengov-treasury/[16]

### Client Tools
- **Polkasafe SDK**: https://github.com/polkasafe/polkasafe-sdk[17]
- **Multisig Apps Overview**: https://wiki.polkadot.com/general/multisig-apps/[18]

This comprehensive guide provides everything needed to implement milestone-based grant management with atomic approval-and-payout workflows, where the first signatory's transaction publishes the multisig call and includes their vote automatically, with flexible committee settings for combined or separated approval patterns.

---

## References

[1] https://docs.moonbeam.network/builders/substrate/interfaces/utility/utility/
[2] https://docs.moonbeam.network/builders/substrate/interfaces/account/multisig/
[3] https://wiki.polkadot.com/learn/learn-guides-accounts-multisig/
[4] https://support.polkadot.network/support/solutions/articles/65000181826-how-to-create-and-use-a-multisig-account
[5] https://www.npmjs.com/package/polkadot-api/v/1.16.2
[6] https://docs.polkadot.com/develop/toolkit/api-libraries/papi/
[7] https://forum.polkadot.network/t/multi-asset-treasury-and-milestone-based-spends/6780
[8] https://polkadot.subsquare.io/polkassembly/posts/3337
[9] https://wiki.polkadot.com/learn/learn-transactions/
[10] https://avaprotocol.org/docs/polkadot/gov-user/governance-batching-proposals
[11] https://wiki.polkadot.com/learn/learn-guides-treasury/
[12] https://paritytech.github.io/txwrapper-core/functions/txwrapper_substrate_src_methods_multisig_asMulti.asMulti.html
[13] https://papi.how
[14] https://wiki.polkadot.com/learn/learn-transaction-construction/
[15] https://polkadot.js.org/docs/api/cookbook/tx/
[16] https://wiki.polkadot.com/learn/learn-polkadot-opengov-treasury/
[17] https://github.com/polkasafe/polkasafe-sdk
[18] https://wiki.polkadot.com/general/multisig-apps/

