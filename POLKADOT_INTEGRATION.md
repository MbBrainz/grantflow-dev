# Polkadot Multisig Integration - Implementation Summary

This document summarizes the Polkadot multisig integration for GrantFlow's milestone-based grant payments.

## 🚀 Setup Status

**✅ COMPLETE:**
- Polkadot-API package installed
- Chain descriptors generated for Paseo testnet
- TypeScript types available in `@polkadot-api/descriptors`
- Client configured to use typed API
- All typechecks passing

**⏳ NEXT STEPS:**
To enable actual blockchain transactions, you need to:
1. Implement the stubbed functions in `src/lib/polkadot/multisig.ts`
2. Test with a real Paseo testnet multisig wallet
3. Connect Polkadot wallet extension (Polkadot.js, Talisman, etc.)
4. Sign and submit transactions on-chain

**Current Status:** ✅ Infrastructure Ready | ⏳ Implementation Pending

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

## 🚀 What's Next

### ✅ Completed
- [x] `MilestoneVotingPanel` - Show approval progress, signature status
- [x] `PolkadotWalletSelector` - Connect Polkadot wallet extensions (in header)
- [x] `MultisigConfigForm` - Configure multisig settings in committee management
- [x] `SignatoryVoteList` - Visual progress of multisig approvals
- [x] `PolkadotProvider` - React context for wallet management
- [x] Integration with reviewer submission view (shows voting panel for approved milestones)
- [x] Database schema and server actions complete
- [x] Workflow pattern support (merged/separated)
- [x] Committee management UI for multisig configuration

### ⏳ Priority 1: Enable Blockchain Transactions
- [x] Install `polkadot-api` package (includes ws-provider and `papi` CLI)
- [x] Generate chain descriptors using `npx papi add paseo -n paseo` and `npx papi`
- [x] Update `src/lib/polkadot/client.ts` to import generated descriptors
- [x] Add `.papi` to `.gitignore` and ESLint ignore list
- [ ] Implement stubbed functions in `src/lib/polkadot/multisig.ts`:
  - `createTransferCall()`
  - `createBatchedPaymentCall()`
  - `initiateMultisigApproval()`
  - `approveMultisigCall()`
  - `finalizeMultisigCall()`
  - `queryPendingMultisigs()`
- [ ] Test actual blockchain transactions on Paseo testnet

### Priority 2: Testing & Validation
- [ ] Create test multisig wallet on Paseo with 2 signatories
- [ ] Test merged workflow end-to-end with real wallet signatures
- [ ] Test separated workflow end-to-end
- [ ] Validate transaction cost calculations
- [ ] Error handling for failed transactions
- [ ] Edge cases: expired approvals, rejected signatures, insufficient balance

### Priority 3: Advanced Features
- [ ] Query pending multisigs from blockchain (`queryPendingMultisigs`)
- [ ] Cancel/replace pending approvals
- [ ] Batch multiple milestone payments
- [ ] Historical signature analytics
- [ ] Gas estimation before transaction
- [ ] Notification system for signature requests

## 📦 Dependencies & Setup

### Step 1: Install Polkadot-API

The `polkadot-api` package includes everything you need: runtime client, ws-provider, and the `papi` CLI tool for code generation.

```bash
pnpm add polkadot-api
```

### Step 2: Add Chain and Generate Descriptors

The `papi` CLI tool (included in `polkadot-api`) generates TypeScript types from chain metadata.

**Add to `package.json` scripts:**
```json
{
  "scripts": {
    "polkadot:add-paseo": "papi add paseo -n paseo",
    "polkadot:add-dot": "papi add dot -n polkadot",
    "polkadot:add-ksm": "papi add ksm -n kusama",
    "polkadot:generate": "papi"
  }
}
```

**Or use npx directly:**
```bash
# Add chain and generate descriptors for Paseo testnet
npx papi add paseo -n paseo
npx papi

# For Polkadot mainnet
npx papi add dot -n polkadot
npx papi

# For Kusama
npx papi add ksm -n kusama
npx papi
```

This will:
1. Create a `polkadot-api.json` config file in your project root
2. Generate type descriptors in `@polkadot-api/descriptors` folder
3. Provide type-safe access to all chain operations

**What gets generated:**
- Storage queries (e.g., `Balances.Account`)
- Transactions (e.g., `Balances.transfer`)
- Events and errors
- Runtime constants

### Step 3: Using Generated Descriptors in Code

Once descriptors are generated, update `/src/lib/polkadot/client.ts`:

```typescript
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/web'
import { paseo } from '@polkadot-api/descriptors' // Generated descriptor

const NETWORK_ENDPOINTS = {
  polkadot: 'wss://rpc.polkadot.io',
  kusama: 'wss://kusama-rpc.polkadot.io',
  paseo: process.env.POLKADOT_WS_URL || 'wss://rpc.rococo-paseo.land',
}

let clientInstance: ReturnType<typeof createClient> | null = null

export function getPolkadotClient(network: 'paseo' = 'paseo') {
  if (clientInstance) return clientInstance
  
  const wsProvider = getWsProvider(NETWORK_ENDPOINTS[network])
  clientInstance = createClient(wsProvider)
  
  return clientInstance
}

// Get typed API with full type safety
export const paseoApi = getPolkadotClient().getTypedApi(paseo)
```

**Environment Variables:**
```bash
# Optional: Override default WebSocket URL
POLKADOT_WS_URL=wss://rpc.rococo-paseo.land
```

Then in `/src/lib/polkadot/multisig.ts`, you can use the typed API:

```typescript
import { paseoApi } from './client'

// Type-safe multisig operations
const multisigCall = paseoApi.tx.Multisig.as_multi({
  threshold: 2,
  otherSignatories: sortedSignatories,
  maybeTimepoint: null,
  call: transferCall,
  maxWeight: { refTime: 1000000000n, proofSize: 64000n }
})

// Sign and submit
await multisigCall.signSubmitAndWatch(signer)
```

**Resources:**
- [Polkadot-API Codegen Docs](https://papi.how/codegen)
- [TypedAPI Usage](https://papi.how/typed)
- [Multisig Pallet Reference](https://wiki.polkadot.network/docs/learn-account-multisig)

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

## 📝 Summary

**✅ Complete:**
- Database schema (milestone_approvals, multisig_signatures tables)
- Server actions (initiate, vote, finalize)
- React components (MilestoneVotingPanel, MultisigConfigForm, WalletSelector)
- Polkadot Provider context
- UI integration in reviewer submission view
- Committee management configuration
- Both workflow patterns (merged/separated) supported
- Seed data with multisig-enabled committee
- ✨ **Polkadot-API installed and configured**
- ✨ **Chain descriptors generated for Paseo testnet**
- ✨ **TypeScript types available via `@polkadot-api/descriptors`**

**⏳ Pending:**
- Implement stubbed blockchain functions in `src/lib/polkadot/multisig.ts`
- Test on Paseo testnet with real multisig wallet
- Connect wallet extension and submit actual on-chain transactions

**Next Step:** Implement the 6 stubbed functions in `multisig.ts` using the typed `getPaseoTypedApi()` from `client.ts`

---

## 🛠️ Implementation Guide: Enabling Blockchain Transactions

### Step-by-Step Instructions

**1. Install Polkadot-API**
```bash
cd /Users/mauritsbos/code/grantflow/grantflow-dev
pnpm add polkadot-api
```

**2. Add Chain and Generate Descriptors**
```bash
# Add Paseo testnet chain
npx papi add paseo -n paseo

# Generate TypeScript types
npx papi

# This creates:
# - polkadot-api.json (config file)
# - @polkadot-api/descriptors folder with generated types
```

**3. Update `src/lib/polkadot/client.ts`**
```typescript
import { createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/web'
import { paseo } from '@polkadot-api/descriptors'

const NETWORK_ENDPOINTS = {
  polkadot: 'wss://rpc.polkadot.io',
  kusama: 'wss://kusama-rpc.polkadot.io',
  paseo: process.env.POLKADOT_WS_URL || 'wss://rpc.rococo-paseo.land',
}

let clientInstance: ReturnType<typeof createClient> | null = null
let currentNetwork: 'polkadot' | 'kusama' | 'paseo' = 'paseo'

export function getPolkadotClient(network: 'polkadot' | 'kusama' | 'paseo' = 'paseo') {
  if (clientInstance && currentNetwork === network) {
    return clientInstance
  }

  if (clientInstance) {
    clientInstance.destroy()
  }

  const provider = getWsProvider(NETWORK_ENDPOINTS[network])
  clientInstance = createClient(provider)
  currentNetwork = network

  return clientInstance
}

// Export typed API for Paseo
export const paseoApi = getPolkadotClient('paseo').getTypedApi(paseo)
```

**4. Implement Stubbed Functions in `src/lib/polkadot/multisig.ts`**

Replace the throw statements with actual implementations:

```typescript
export function createTransferCall(beneficiaryAddress: string, amount: bigint) {
  return paseoApi.tx.Balances.transfer_keep_alive({
    dest: { type: 'Id', value: beneficiaryAddress },
    value: amount,
  })
}

export function createBatchedPaymentCall(/* params */) {
  const transferCall = createTransferCall(beneficiaryAddress, payoutAmount)
  const remarkCall = paseoApi.tx.System.remark({
    remark: Binary.fromText(`milestone:${milestoneId}`)
  })
  
  return paseoApi.tx.Utility.batch_all({
    calls: [transferCall, remarkCall]
  })
}

// Continue implementing other functions...
```

**5. Test Database Setup**
```bash
# Reset and seed database with multisig configuration
pnpm db:reset
pnpm db:seed
```

**6. Test Locally**
- Login as `reviewer1@test.com` (password: `reviewer123`)
- Navigate to Infrastructure Committee
- View an approved milestone
- Connect Polkadot wallet (ensure you have Paseo testnet tokens)
- Sign the multisig transaction

**7. Monitor Transactions**
- View on Paseo block explorer: https://paseo.subscan.io/
- Check multisig status on-chain



