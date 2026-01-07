# Polkadot Multisig Integration

## Overview

GrantFlow integrates with Polkadot's on-chain multisig functionality to enable secure, transparent milestone-based grant payments. Committee members collectively approve and execute payments directly from a committee multisig wallet.

## Architecture

### Database Schema

#### `milestone_approvals` Table
Tracks the state of multisig approval processes for milestone payments.

```typescript
{
  id: number
  milestoneId: number          // Links to milestones table
  groupId: number              // Committee that owns this approval
  initiatorId: number          // User who initiated the multisig
  multisigCallHash: string     // On-chain call hash
  multisigCallData: string     // Hex-encoded call data
  timepoint: {                 // Block height & index when initiated
    height: number
    index: number
  }
  status: 'pending' | 'threshold_met' | 'executed' | 'cancelled'
  executionTxHash?: string     // Final execution transaction
  executionBlockNumber?: number
}
```

#### `multisig_signatures` Table
Records individual committee member signatures/votes.

```typescript
{
  id: number
  approvalId: number           // Links to milestone_approvals
  reviewId?: number            // Links to reviews (for merged workflow)
  userId?: number              // User if known
  signatoryAddress: string     // Wallet address
  signatureType: 'signed' | 'rejected'
  txHash: string               // On-chain transaction hash
  isInitiator: boolean         // First vote that published the call
  isFinalApproval: boolean     // Last vote that executed payment
}
```

### MultisigConfig

Committees configure multisig settings in `committee.settings.multisig`:

```typescript
interface MultisigConfig {
  multisigAddress: string                      // On-chain multisig account
  signatories: string[]                        // Committee member wallet addresses
  threshold: number                            // Required approvals (≥2)
  approvalWorkflow: 'merged' | 'separated'    // See workflow patterns below
  requireAllSignatories: boolean               // All must vote vs just threshold
  votingTimeoutBlocks: number                  // Blocks before expiry
  automaticExecution: boolean                  // Auto-execute on threshold
  network: 'polkadot' | 'kusama' | 'paseo'   // Which network
  
  // Child Bounty Configuration (required)
  parentBountyId: number                       // Parent bounty ID for child bounty payouts
  curatorProxyAddress: string                  // Curator account for child bounties
}
```

### Child Bounty Payout System

All milestone payouts use the `childBounties` pallet for proper on-chain indexing. Each payout creates a child bounty under the committee's parent bounty with a 5-call atomic bundle:

1. `addChildBounty` - Create child bounty with milestone amount
2. `proposeCurator` - Assign curator (proxy controlled by multisig)
3. `acceptCurator` - Curator accepts role
4. `awardChildBounty` - Award to grantee wallet address
5. `claimChildBounty` - Execute payout to grantee

The curator address can be automatically fetched from the chain using the "Fetch Curator" button in the configuration form.

## Workflow Patterns

### Merged Workflow (Recommended)
**Decision and execution happen together** - when a committee member approves a milestone review, it triggers an on-chain signature.

**Process:**
1. Committee members review milestone off-chain (vote approve/reject)
2. When member votes "approve", they're prompted to connect Polkadot wallet
3. Wallet signature is submitted on-chain via multisig
4. Once threshold is met, payment automatically executes
5. `multisig_signatures.reviewId` links on-chain signature to off-chain review

**Benefits:**
- One-step process for committee members
- Tighter coupling between decision and execution
- More efficient (fewer transactions)

### Separated Workflow
**Two-phase process** - approval decision happens first, then separate blockchain signing step.

**Process:**
1. Committee members review milestone off-chain
2. After milestone is approved by committee, multisig payment is initiated
3. Committee members then separately sign the multisig transaction
4. Once threshold is met, final signatory executes payment

**Benefits:**
- Separation of concerns (decision vs execution)
- More control over timing
- Can review all pending payments before signing

## Components

### UI Components

#### `MilestoneVotingPanel`
Location: `src/components/milestone/milestone-voting-panel.tsx`

Displays multisig voting interface for approved milestones. Shows:
- Current approval threshold progress
- List of signatories and their vote status
- Voting controls for committee members
- Execute payment button when threshold is met

**Usage:**
```tsx
<MilestoneVotingPanel
  _milestoneId={milestone.id}
  _submissionId={submission.id}
  _committeeId={committee.id}
  isCommitteeMember={true}
  _userWalletAddress={user.walletAddress}
/>
```

Integrated into `ReviewerSubmissionView` - shows when:
- Milestone status is 'approved'
- Committee has multisig configured
- User is a committee member

#### `MultisigConfigForm`
Location: `src/components/committee/multisig-config-form.tsx`

Admin interface for configuring committee multisig settings.

**Features:**
- Multisig address input
- Network selection (Polkadot/Kusama/Paseo)
- Signatory management (add/remove wallet addresses)
- Threshold configuration
- Approval workflow selection (merged/separated)
- **Child Bounty Configuration:**
  - Parent Bounty ID input
  - Curator address input with "Fetch from Chain" button
  - Auto-fetches curator from on-chain bounty status
  - Shows bounty status indicator (Active/Proposed/Not Found)

Integrated into committee management page at `/dashboard/committees/[id]/manage`.

#### `PolkadotWalletSelector`
Location: `src/components/wallet/polkadot-wallet-selector.tsx`

Dropdown in header for connecting Polkadot wallet extensions.

**Supported Wallets:**
- Polkadot.js Extension
- Talisman
- SubWallet
- Nova Wallet

#### `SignatoryVoteList`
Location: `src/components/milestone/signatory-vote-list.tsx`

Display component showing voting status for all signatories with transaction links to block explorer.

### Providers

#### `PolkadotProvider`
Location: `src/components/providers/polkadot-provider.tsx`

React context provider for Polkadot wallet connection.

**Provides:**
- `isConnecting`: boolean
- `isConnected`: boolean
- `error`: string | null
- `availableExtensions`: Array of detected wallet extensions
- `selectedAccount`: Currently selected account
- `selectedSigner`: Polkadot signer instance
- `connectWallet(extensionName)`: Connect to wallet
- `disconnectWallet()`: Disconnect wallet

Wraps the entire dashboard layout.

## Server Actions

Location: `src/app/(dashboard)/dashboard/submissions/multisig-actions.ts`

### `initiateMultisigApproval`
Starts the multisig approval process for a milestone payment.

**Input:**
```typescript
{
  milestoneId: number
  approvalWorkflow: 'merged' | 'separated'
  initiatorWalletAddress: string
  txHash: string              // On-chain transaction hash
  callHash: string            // Hash of the payment call
  callData: string            // Encoded call data
  timepoint: { height: number; index: number }
  reviewId?: number           // For merged workflow
}
```

### `castMultisigVote`
Records a committee member's signature/vote.

**Input:**
```typescript
{
  approvalId: number
  signatoryAddress: string
  signatureType: 'signed' | 'rejected'
  txHash: string
  reviewId?: number
}
```

### `finalizeMultisigApproval`
Records the final execution transaction and updates milestone status.

**Input:**
```typescript
{
  approvalId: number
  signatoryAddress: string
  executionTxHash: string
  executionBlockNumber: number
}
```

### `getMilestoneApprovalStatus`
Fetches current status of a milestone approval including all votes.

**Returns:**
```typescript
{
  status: 'none' | 'active' | 'completed'
  approval?: {
    id: number
    callHash: string
    timepoint: Timepoint
    // ...
  }
  votes?: {
    total: number
    approvals: number
    rejections: number
    threshold: number
    thresholdMet: boolean
  }
  signatories?: Array<{
    address: string
    signatureType?: 'signed' | 'rejected'
    txHash?: string
    // ...
  }>
}
```

## Polkadot Client

### Connection Setup
Location: `src/lib/polkadot/client.ts`

Creates WebSocket connection to Polkadot networks.

**Environment Variables:**
```bash
POLKADOT_WS_URL=wss://rpc.polkadot.io        # Polkadot mainnet
# POLKADOT_WS_URL=wss://kusama-rpc.polkadot.io   # Kusama
# POLKADOT_WS_URL=wss://paseo-rpc.dwellir.com     # Paseo testnet
```

### Multisig Utilities
Location: `src/lib/polkadot/multisig.ts`

Core functions for interacting with Polkadot multisig pallet.

**Key Functions:**
- `initiateMultisigApproval()`: First signatory publishes call and votes
- `approveMultisigCall()`: Intermediate signatories approve
- `approveOrExecuteMultisigCall()`: Smart approval that auto-executes when quorum is hit
- `willHitQuorum()`: Check if next approval will trigger execution
- `isQuorumMet()`: Check if quorum is already met

### Child Bounty Utilities
Location: `src/lib/polkadot/child-bounty.ts`

Functions for creating child bounty payouts with proper on-chain indexing.

**Key Functions:**
- `getNextChildBountyId()`: Query next available child bounty ID
- `getParentBounty()`: Query parent bounty info including curator address
- `getParentBountyCurator()`: Convenience function to get just the curator
- `createChildBountyBundle()`: Create 5-call atomic bundle for milestone payout
- `createPayoutCall()`: Main entry point for creating payout transactions
- `getChildBounty()`: Query existing child bounty by ID

**Dependencies:** The project uses `dedot` for blockchain interactions and `@luno-kit/react` for wallet connection. These are already installed and configured.

## Database Queries

Location: `src/lib/db/writes/milestone-approvals.ts`

- `createMilestoneApproval()`: Create new approval record
- `createMultisigSignature()`: Record a signature
- `getMilestoneApprovalWithVotes()`: Get approval with all votes
- `getActiveMilestoneApproval()`: Get pending approval for milestone
- `hasUserVoted()`: Check if user already voted
- `getApprovalVoteCount()`: Get approval/rejection counts
- `completeMilestoneApproval()`: Mark approval as executed

## Setup Guide

### For Committee Admins

1. **Create Multisig Wallet**
   - Use Polkadot.js Apps or Talisman to create an on-chain multisig
   - Add all committee member wallet addresses as signatories
   - Set threshold (number of required approvals)
   - Note the multisig address

2. **Set Up Parent Bounty**
   - Create a parent bounty on-chain using Polkadot.js Apps
   - Note the bounty ID after creation
   - Ensure the bounty is funded and has an active curator
   - The curator should be an account controlled by your multisig (proxy recommended)

3. **Configure in GrantFlow**
   - Navigate to `/dashboard/committees/[id]/manage`
   - Scroll to "Multisig Account" section
   - Enter multisig address
   - Add all signatory addresses (committee member wallets)
   - Set threshold
   - Choose approval workflow (merged recommended)
   - Select network (Polkadot/Kusama/Paseo)
   - **Child Bounty Configuration:**
     - Enter the Parent Bounty ID
     - Click "Fetch Curator" to auto-load curator address from chain
     - Or manually enter the curator proxy address
   - Save configuration

4. **Fund Multisig Wallet**
   - Transfer funds to the multisig address to cover grant payments
   - Ensure sufficient balance for transaction fees

### For Committee Members

1. **Install Wallet Extension**
   - Install Polkadot.js, Talisman, SubWallet, or Nova Wallet
   - Create/import account
   - Ensure your address is added to committee multisig

2. **Connect Wallet in GrantFlow**
   - Click "Connect Wallet" button in header
   - Select your wallet extension
   - Approve connection
   - Select account that's a multisig signatory

3. **Approve Milestone Payments**
   - Navigate to submission with approved milestone
   - Expand milestone details
   - See "Multisig Approval" section
   - Click "Approve Payment" (or "Initiate Approval" if first)
   - Sign transaction in wallet extension
   - Wait for confirmation
   - View status and other signatories' votes

## Testing on Testnet

### Using Paseo Testnet

1. Set network to 'paseo' in multisig config
2. Create multisig on Paseo network
3. Get test tokens from Paseo faucet
4. Test full workflow without real funds

### Test Checklist

- [ ] Committee admin can configure multisig
- [ ] Configuration is saved and displayed correctly
- [ ] Wallet selector detects installed extensions
- [ ] Can connect wallet and select account
- [ ] Milestone voting panel appears for approved milestones
- [ ] First signatory can initiate approval
- [ ] Subsequent signatories can approve
- [ ] Vote counts update in real-time
- [ ] Final signatory can execute payment
- [ ] Transaction links navigate to block explorer
- [ ] Milestone status updates to 'completed'
- [ ] Payout record is created

## Security Considerations

1. **Multisig Threshold**: Set threshold high enough to prevent single-point failure but low enough to not block payments
2. **Signatory Management**: Regularly audit signatory list, remove departing members
3. **Wallet Security**: Committee members must secure their wallet private keys
4. **Transaction Verification**: Always verify transaction details before signing
5. **Timeout Handling**: Monitor for expiring multisig calls
6. **Network Selection**: Ensure all committee members use same network
7. **Balance Monitoring**: Keep multisig wallet funded for payments + fees

## Troubleshooting

### "Wallet not detected"
- Ensure wallet extension is installed and enabled
- Refresh page after installing extension
- Check browser console for errors

### "Address not a signatory"
- Verify wallet address matches one in multisig config
- Ensure correct account selected in wallet
- Check multisig configuration in committee settings

### "Transaction failed"
- Check multisig wallet has sufficient balance
- Verify all transaction parameters are correct
- Ensure no conflicting pending multisig calls
- Check network connectivity

### "Threshold not met"
- View signatory vote list to see who hasn't voted
- Contact remaining committee members
- Check if voting timeout has expired

## Future Enhancements

- [ ] Automatic signatory detection from committee members
- [ ] Email notifications when votes are needed
- [ ] Bulk payment support for multiple milestones
- [ ] Payment scheduling/recurring payments
- [ ] Integration with treasury proposals
- [ ] Support for other Substrate chains
- [ ] Mobile wallet support
- [ ] Hardware wallet integration (Ledger, Trezor)
- [ ] Multisig transaction simulation
- [ ] Gas fee estimation
- [ ] Payment history and analytics

## Resources

- [Polkadot Multisig Documentation](https://wiki.polkadot.network/docs/learn-account-multisig)
- [Polkadot.js Apps](https://polkadot.js.org/apps/)
- [dedot Documentation](https://docs.dedot.dev/)
- [Substrate Multisig Pallet](https://paritytech.github.io/substrate/master/pallet_multisig/index.html)
- [Block Explorers](https://polkadot.subscan.io/)

## Support

For questions or issues with the Polkadot multisig integration, please:
1. Check this documentation
2. Review error messages in browser console
3. Test on testnet first
4. Open an issue on GitHub with reproduction steps



