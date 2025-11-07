# Polkadot Multisig Implementation Guide

## 🎯 Objective

Complete the Polkadot multisig integration by implementing 6 stubbed functions in `src/lib/polkadot/multisig.ts` to enable real blockchain transactions for milestone-based grant payments on the Paseo testnet.

## 📊 Current Status

### ✅ Complete (Infrastructure Layer)
- **Database Schema**: `milestone_approvals` and `multisig_signatures` tables created
- **Server Actions**: All actions implemented in `src/app/(dashboard)/dashboard/submissions/multisig-actions.ts`
- **UI Components**: `MilestoneVotingPanel`, `MultisigConfigForm`, `PolkadotWalletSelector`, `SignatoryVoteList`
- **Polkadot Client**: `src/lib/polkadot/client.ts` configured with typed API
- **Chain Descriptors**: Generated for Paseo testnet in `.papi/descriptors/`
- **Type Safety**: All TypeScript types from `@polkadot-api/descriptors` available
- **Provider Context**: `PolkadotProvider` for wallet connection
- **Seed Data**: Infrastructure Committee configured with merged workflow

### ⏳ Pending (Implementation Layer)
- **Blockchain Functions**: 6 functions in `src/lib/polkadot/multisig.ts` are stubbed with `throw new Error`

## 🔧 Functions to Implement

### Location: `src/lib/polkadot/multisig.ts`

#### 1. `createTransferCall(beneficiaryAddress: string, amount: bigint): unknown`
**Current State**: Lines 49-64, throws error
**Purpose**: Create a simple balance transfer call for wrapping in multisig
**Implementation Requirements**:
- Use `getPaseoTypedApi()` from `./client`
- Call `api.tx.Balances.transfer_keep_alive({ dest, value })`
- `dest` should use SS58 address format (Substrate address type)
- `value` is amount in Planck (1 DOT = 10^10 Planck)
- Return the call object (not submitted)

**Example Pattern**:
```typescript
export function createTransferCall(beneficiaryAddress: string, amount: bigint) {
  const api = getPaseoTypedApi()
  return api.tx.Balances.transfer_keep_alive({
    dest: beneficiaryAddress, // Or { type: 'Id', value: beneficiaryAddress }
    value: amount,
  })
}
```

#### 2. `createBatchedPaymentCall(beneficiaryAddress: string, amount: bigint, milestoneId: number): unknown`
**Current State**: Lines 72-87, throws error
**Purpose**: Create atomic batch call combining transfer + on-chain remark for milestone tracking
**Implementation Requirements**:
- Use `createTransferCall()` to create the transfer
- Create a `System.remark()` call with milestone ID encoded (e.g., `milestone:${milestoneId}`)
- Use `Utility.batch_all()` to combine both calls atomically
- If any call fails, entire transaction reverts

**Example Pattern**:
```typescript
export function createBatchedPaymentCall(
  beneficiaryAddress: string,
  amount: bigint,
  milestoneId: number
) {
  const api = getPaseoTypedApi()
  
  const transferCall = createTransferCall(beneficiaryAddress, amount)
  const remarkCall = api.tx.System.remark({
    remark: Binary.fromText(`milestone:${milestoneId}`)
  })
  
  return api.tx.Utility.batch_all({
    calls: [transferCall, remarkCall]
  })
}
```

#### 3. `initiateMultisigApproval(params): Promise<InitiateApprovalResult>`
**Current State**: Lines 124-204, throws error
**Purpose**: First signatory publishes the multisig call and casts the first vote
**Implementation Requirements**:
- Create the payment call using `createBatchedPaymentCall()` or `createTransferCall()` based on `useBatch` param
- Encode the call to get `callData` (hex string)
- Hash the call to get `callHash`
- Calculate `maxWeight` for the call execution
- Build `Multisig.as_multi()` extrinsic with:
  - `threshold`
  - `otherSignatories` (sorted, excluding initiator)
  - `maybeTimepoint: null` (first call)
  - `call: callData`
  - `maxWeight`
- Sign and submit using `signer.signSubmitAndWatch()`
- Listen for events: `Multisig.NewMultisig` and `Multisig.MultisigApproval`
- Extract `timepoint` from events (block height + extrinsic index)
- Return `{ callHash, callData, timepoint, txHash, blockNumber }`

**Key Considerations**:
- First call uses `as_multi()` which publishes AND votes
- Must use `getOtherSignatories()` helper to exclude initiator and sort
- Transaction hash and block number needed for database record
- Error handling for failed transactions

#### 4. `approveMultisigCall(params): Promise<ApproveMultisigResult>`
**Current State**: Lines 214-258, throws error
**Purpose**: Intermediate signatories approve with call hash only (lighter transaction)
**Implementation Requirements**:
- Use `Multisig.approve_as_multi()` extrinsic with:
  - `threshold`
  - `otherSignatories` (sorted, excluding current approver)
  - `maybeTimepoint: timepoint` (from initial transaction)
  - `callHash` (not full call data)
  - `maxWeight`
- Sign and submit
- Listen for `Multisig.MultisigApproval` event
- Check if threshold is met (event indicates approval count)
- Return `{ txHash, blockNumber, thresholdMet }`

**Key Considerations**:
- Requires valid `timepoint` from first transaction
- Uses only call hash (cheaper than full call data)
- Must track if this is the final approval before execution threshold

#### 5. `finalizeMultisigCall(params): Promise<FinalizeMultisigResult>`
**Current State**: Lines 268-299, throws error
**Purpose**: Last signatory executes the multisig transaction with full call data
**Implementation Requirements**:
- Similar to `initiateMultisigApproval()` but with existing timepoint
- Use `Multisig.as_multi()` with:
  - `threshold`
  - `otherSignatories`
  - `maybeTimepoint: timepoint` (from initial transaction)
  - `call: callData` (MUST provide full call data again)
  - `maxWeight`
- Sign and submit
- Listen for `Multisig.MultisigExecuted` event (indicates successful execution)
- Parse event for execution result
- Return `{ txHash, blockNumber, executionSuccess, executionError? }`

**Key Considerations**:
- Must provide full `callData` again (not just hash)
- This is when the actual payment executes on-chain
- Check `MultisigExecuted` event for success/failure
- Handle execution failures gracefully

#### 6. `queryPendingMultisigs(multisigAddress: string): Promise<PendingMultisig[]>`
**Current State**: Lines 301-308, throws error
**Purpose**: Query on-chain state to find pending multisig transactions
**Implementation Requirements**:
- Query storage `Multisig.Multisigs(multisigAddress, callHash)`
- Iterate through known call hashes or query all
- Parse stored multisig state:
  - `when: Timepoint`
  - `deposit: bigint`
  - `depositor: string`
  - `approvals: string[]` (addresses that have approved)
- Return array of pending multisigs with their details

**Key Considerations**:
- This allows UI to show pending approvals from blockchain
- Useful for recovery if database is out of sync
- May need to query multiple storage keys

## 🔗 Integration Points

### Server Actions Call These Functions
**Location**: `src/app/(dashboard)/dashboard/submissions/multisig-actions.ts`

1. **`initiateMilestoneApprovalAction`** (lines ~50-150):
   - Fetches milestone, submission, committee data
   - Validates user is committee member
   - Calls `initiateMultisigApproval()` 
   - Stores result in `milestone_approvals` and `multisig_signatures` tables
   - Revalidates UI paths

2. **`approveMilestoneApprovalAction`** (lines ~160-240):
   - Gets existing approval from DB
   - Validates user hasn't voted
   - Calls `approveMultisigCall()`
   - Records signature in `multisig_signatures`
   - Checks if threshold met

3. **`finalizeMilestoneApprovalAction`** (lines ~250-340):
   - Gets approval with all votes
   - Validates threshold met
   - Calls `finalizeMultisigCall()`
   - Updates milestone to 'completed'
   - Creates payout record in `payouts` table
   - Records final signature

### UI Components Trigger Server Actions
**Location**: `src/components/milestone/milestone-voting-panel.tsx`

- Displays current approval status
- Shows list of signatories and their vote status
- Provides "Sign Transaction" button for committee members
- Handles wallet connection via `usePolkadot()` hook
- Calls appropriate server action based on approval state

### Database Schema References
**Location**: `src/lib/db/schema/milestone-approvals.ts`

```typescript
export const milestoneApprovals = pgTable('milestone_approvals', {
  id: serial('id').primaryKey(),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  groupId: integer('group_id').references(() => groups.id),
  initiatorId: integer('initiator_id').references(() => users.id),
  multisigCallHash: varchar('multisig_call_hash', { length: 128 }),
  multisigCallData: text('multisig_call_data'), // Hex-encoded
  timepoint: jsonb('timepoint').$type<Timepoint>(), // { height, index }
  status: approvalStatusEnum('status'), // pending, threshold_met, executed
  executedAt: timestamp('executed_at'),
  executionTxHash: varchar('execution_tx_hash', { length: 128 }),
  executionBlockNumber: integer('execution_block_number'),
})

export const multisigSignatures = pgTable('multisig_signatures', {
  id: serial('id').primaryKey(),
  approvalId: integer('approval_id').references(() => milestoneApprovals.id),
  reviewId: integer('review_id').references(() => reviews.id), // For merged workflow
  userId: integer('user_id').references(() => users.id),
  signatoryAddress: varchar('signatory_address', { length: 64 }),
  signatureType: signatureEnum('signature_type'), // 'signed' | 'rejected'
  txHash: varchar('tx_hash', { length: 128 }),
  signedAt: timestamp('signed_at'),
  isInitiator: boolean('is_initiator'),
  isFinalApproval: boolean('is_final_approval'),
})
```

## 📚 Polkadot-API Reference

### Available Types from Generated Descriptors
```typescript
import { getPaseoTypedApi } from './client'
const api = getPaseoTypedApi()

// Available pallets (examples):
api.tx.Balances.transfer_keep_alive(...)
api.tx.Balances.transfer_all(...)
api.tx.Multisig.as_multi(...)
api.tx.Multisig.approve_as_multi(...)
api.tx.Multisig.cancel_as_multi(...)
api.tx.System.remark(...)
api.tx.Utility.batch(...)
api.tx.Utility.batch_all(...)

// Query storage:
api.query.Multisig.Multisigs(address, callHash)
api.query.System.Account(address)

// Constants:
api.constants.Multisig.DepositBase()
api.constants.Multisig.DepositFactor()
```

### Event Listening Pattern
```typescript
const finalized = await tx.signSubmitAndWatch(signer)
  .pipe(/* filter/map operators */)
  .toPromise()

// Or with subscription:
tx.signSubmitAndWatch(signer).subscribe({
  next: (event) => {
    if (event.type === 'finalized') {
      // Extract events from block
      const multisigEvents = event.events.filter(
        e => e.type === 'Multisig' && e.value.type === 'MultisigExecuted'
      )
    }
  },
  error: (err) => console.error(err),
})
```

## 🧪 Testing Strategy

### 1. Unit Tests (Optional but Recommended)
- Test `sortSignatories()` and `getOtherSignatories()` helpers
- Mock Polkadot API to test call construction
- Verify call data encoding/hashing

### 2. Integration Tests on Paseo Testnet
```bash
# Setup
1. Create 2 test accounts in Polkadot.js extension
2. Fund both with testnet tokens from faucet
3. Create multisig address: https://polkadot.js.org/apps/#/accounts
4. Fund the multisig address
5. Update .env with addresses:
   MULTISIG_ADDRESS=5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
   SIGNATORY_1_ADDRESS=5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
   SIGNATORY_2_ADDRESS=5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y

# Test Flow
1. pnpm db:reset && pnpm db:seed
2. Login as reviewer1@test.com (password: reviewer123)
3. Navigate to Infrastructure Committee submissions
4. Approve a milestone to trigger multisig workflow
5. Connect Polkadot wallet (ensure it's on Paseo network)
6. Click "Sign Transaction" in MilestoneVotingPanel
7. Verify first signature recorded in UI
8. Login as reviewer2@test.com
9. Approve same milestone
10. Verify threshold met and transaction executed
11. Check Paseo block explorer for transaction
12. Verify payout recorded in database
```

### 3. Error Cases to Handle
- Insufficient balance in multisig wallet
- Invalid call data or hash
- Timepoint mismatch
- Threshold not met
- Duplicate approvals
- Transaction timeout
- Network connection failures
- Wallet rejection

## 🔒 Security Considerations

1. **Call Hash Verification**: Always verify call hash matches expected payment
2. **Signatory Validation**: Ensure signer is in configured signatories list
3. **Amount Validation**: Verify payment amount matches milestone amount
4. **Beneficiary Validation**: Confirm beneficiary address is submission owner's wallet
5. **Replay Protection**: Timepoint ensures each multisig is unique
6. **Atomic Execution**: batch_all ensures all-or-nothing execution

## 🎨 Code Style Requirements

- Use TypeScript strict mode (already enabled)
- Follow existing error handling patterns with try/catch
- Add detailed console.log statements: `console.log('[functionName]: action', { params })`
- Use logger.error for errors: `logger.error(error, 'context message')`
- No `any` types - use `unknown` and type guards
- Prefer async/await over promises
- Add JSDoc comments for public functions

## 📝 Implementation Checklist

- [ ] Import `getPaseoTypedApi()` instead of `getPolkadotApi()`
- [ ] Implement `createTransferCall()`
- [ ] Implement `createBatchedPaymentCall()`
- [ ] Implement `initiateMultisigApproval()` with event parsing
- [ ] Implement `approveMultisigCall()`
- [ ] Implement `finalizeMultisigCall()` with execution checking
- [ ] Implement `queryPendingMultisigs()`
- [ ] Test on Paseo testnet with real multisig wallet
- [ ] Handle all error cases gracefully
- [ ] Add comprehensive logging
- [ ] Update POLKADOT_INTEGRATION.md with implementation notes
- [ ] Run `pnpm typecheck` and `pnpm lint`
- [ ] Test merged workflow (decision + execution combined)
- [ ] Test separated workflow (approval then payment)
- [ ] Verify database records match on-chain state
- [ ] Document gas costs and deposit requirements

## 🌐 External Resources

- **Polkadot-API Docs**: https://papi.how
- **Multisig Pallet Reference**: https://wiki.polkadot.network/docs/learn-account-multisig
- **Paseo Testnet Explorer**: https://paseo.subscan.io
- **Paseo Faucet**: https://faucet.polkadot.io/paseo
- **Polkadot.js Apps (Paseo)**: https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.paseo.io#/explorer
- **Generated Type Definitions**: `.papi/descriptors/dist/index.d.ts`

## 💡 Tips

1. **Start Simple**: Implement `createTransferCall()` first and test it in isolation
2. **Use Block Explorer**: Monitor Paseo.subscan.io to see actual transactions
3. **Check Events**: Multisig events contain crucial information (timepoint, approvals)
4. **Test Incrementally**: Test each function before moving to the next
5. **Wallet Setup**: Ensure wallet is connected to Paseo network, not mainnet
6. **Gas Estimation**: First multisig transaction requires deposit (~20 PAS tokens)
7. **Timepoint Precision**: Exact block height and index are critical for subsequent calls
8. **Error Messages**: Polkadot errors can be cryptic - check both JS console and block explorer

## 🚨 Common Pitfalls to Avoid

❌ **Wrong Network**: Ensure wallet and API both use Paseo testnet
❌ **Unsorted Signatories**: Must sort addresses before passing to multisig calls
❌ **Missing Call Data**: Final execution requires full call data, not just hash
❌ **Wrong Timepoint**: Must use exact timepoint from first transaction
❌ **Insufficient Deposit**: First signer needs extra tokens for multisig deposit
❌ **Threshold Confusion**: Threshold is number of approvals needed (e.g., 2 out of 3)
❌ **Type Mismatches**: Use proper types from generated descriptors, avoid casting

---

## 🎯 Success Criteria

Implementation is complete when:
1. ✅ All 6 functions implemented without throwing errors
2. ✅ TypeScript compiles without errors (`pnpm typecheck`)
3. ✅ ESLint passes without errors (`pnpm lint`)
4. ✅ Can initiate multisig approval on Paseo testnet
5. ✅ Can approve with intermediate signatories
6. ✅ Can finalize and execute payment transaction
7. ✅ Transaction appears on Paseo block explorer
8. ✅ Database records match on-chain state
9. ✅ Both merged and separated workflows function correctly
10. ✅ UI displays real-time approval progress from blockchain

