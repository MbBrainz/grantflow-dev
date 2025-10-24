# Polkadot Multi-Sig Integration - Quick Start Guide

This guide helps you test and use the newly integrated Polkadot multi-sig functionality for milestone-based grant payments.

## ✅ What's Been Integrated

### 1. Database Schema (Ready to Push)
- `multisigApprovals` table - tracks approval workflows
- `signatoryVotes` table - records individual committee votes
- Extended `groups` table with multisig configuration fields

### 2. UI Components (Fully Integrated)
- **Reviewer Submission View** - Shows multisig voting panel for approved milestones
- **Committee Management** - Multisig configuration interface (replaces "Coming Soon")
- **Milestone Voting Panel** - Complete voting workflow UI

### 3. API & Backend (Ready to Use)
- Approval initiation endpoints
- Vote casting endpoints
- Payment execution endpoints
- Database queries and writes

## 🚀 Getting Started

### Step 1: Push Database Schema

Run this command to create the new tables:

```bash
pnpm db:push
```

This will add:
- `multisig_approvals` table
- `signatory_votes` table
- New columns to `groups` table (multisigAddress, multisigThreshold, etc.)

### Step 2: Configure a Committee with Multisig

1. **Navigate** to Committee Management:
   ```
   /dashboard/committees/[id]/manage
   ```

2. **Scroll** to the "Multisig Account" section (previously "Coming Soon")

3. **Click** "Configure Multisig"

4. **Enter Configuration**:
   - **Multisig Address** (optional): Your committee's multisig address
     - Example: `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
   
   - **Add Signatories**: Add committee member wallet addresses
     - Click the "+" button or press Enter
     - Each address is validated (must be valid SS58 format)
     - Example addresses (testnet):
       ```
       5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
       5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
       5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y
       ```
   
   - **Approval Threshold**: Number of required signatures
     - Example: 2 of 3 signatories
   
   - **Approval Pattern**: Choose workflow type
     - **Combined**: Approval automatically triggers payment (recommended)
     - **Separated**: Approval first, then separate payment vote

5. **Click** "Save Configuration"

### Step 3: Test Milestone Approval Workflow

#### A. Submit a Milestone for Review

1. Grantee submits milestone with deliverables
2. Navigate to submission detail page
3. Milestone shows as "in-review"

#### B. Committee Reviews Milestone

1. **Reviewers vote** on milestone quality using existing review dialog
2. When threshold is met (e.g., 2 of 3 approvals), milestone is approved
3. **Multisig voting panel appears** automatically for approved milestones

#### C. Multisig Payment Voting

1. **First Committee Member** (Initiator):
   - Sees "Initiate Approval" button
   - Selects approval pattern (or uses default)
   - Clicks "Initiate Approval & Cast First Vote"
   - Transaction is published + first vote recorded

2. **Intermediate Committee Members**:
   - See "Your vote is needed!" notification
   - Click "Cast Approval Vote"
   - Vote is recorded on-chain

3. **Final Committee Member**:
   - Sees "Cast Final Vote & Execute Payment"
   - Clicks button
   - **Payment executes automatically** ✨
   - Milestone marked as "paid"

### Step 4: Verify Results

After final vote:
- ✅ Milestone status changed to "completed"
- ✅ Payment transaction hash recorded
- ✅ Block explorer link available
- ✅ All votes visible in signatory status list

## 📋 Testing Checklist

Use this checklist to test the complete workflow:

### Database Setup
- [ ] Run `pnpm db:push`
- [ ] Verify new tables created
- [ ] Check `groups` table has new multisig columns

### Committee Configuration
- [ ] Navigate to committee management page
- [ ] See multisig configuration section (not "Coming Soon")
- [ ] Click "Configure Multisig"
- [ ] Add test signatory addresses (3+)
- [ ] Set threshold (e.g., 2 of 3)
- [ ] Choose approval pattern (combined recommended)
- [ ] Save configuration
- [ ] Verify configuration displays correctly

### Milestone Review & Approval
- [ ] Create or find submission with milestones
- [ ] Submit milestone for review
- [ ] Log in as reviewer #1
- [ ] Review and approve milestone (old workflow)
- [ ] Log in as reviewer #2
- [ ] Review and approve milestone
- [ ] Verify milestone shows as "approved"

### Multisig Payment Voting
- [ ] Navigate to submission detail as reviewer
- [ ] Expand approved milestone
- [ ] See **MilestoneVotingPanel** component
- [ ] Log in as signatory #1
- [ ] Click "Initiate Approval"
- [ ] Verify first vote recorded
- [ ] See progress bar (1/2 votes)
- [ ] Log in as signatory #2
- [ ] See "Your vote is needed!" notification
- [ ] Click "Cast Final Vote & Execute"
- [ ] Verify payment executed
- [ ] Check milestone status = "completed"
- [ ] Verify transaction hash displayed
- [ ] Click block explorer link (simulated for now)

## 🔧 Current Limitations & Next Steps

### Currently Working
✅ Complete UI integrated
✅ Database schema ready
✅ API endpoints functional
✅ Vote tracking and progress
✅ Simulated transactions (random hashes)

### Needs Real Blockchain Integration
❌ Actual wallet connection (browser extension)
❌ Real transaction signing
❌ Live blockchain submission
❌ Actual payment execution

### To Enable Real Transactions

1. **Add Wallet Connection**:
   ```bash
   pnpm add @polkadot/extension-dapp
   ```

2. **Create Wallet Provider**:
   - Detect browser extensions
   - Enable account selection
   - Provide signer to components

3. **Replace Simulated Transactions**:
   - In `src/lib/polkadot/multisig.ts`
   - Change simulated hashes to real `.signAndSubmit()`
   - Use `.signSubmitAndWatch()` for timepoint extraction

4. **Add User Wallet Address**:
   - Extend `users` table with `walletAddress` column
   - Allow users to connect/disconnect wallet
   - Display connected wallet in navbar

## 🎯 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Committee Admin                                              │
│ └─> Configure Multisig (manage page)                        │
│     └─> Add signatories + threshold + pattern               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Grantee                                                      │
│ └─> Submit Milestone Deliverables                           │
│     └─> Milestone status: "in-review"                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Committee Reviewers                                          │
│ └─> Review Milestone Quality (existing workflow)            │
│     └─> Vote: Approve/Reject                                │
│         └─> Threshold met → Milestone "approved"            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 🆕 Multisig Payment Voting Panel Appears                    │
│ (Only shown if committee has multisig configured)            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Signatory #1 (First Voter)                                  │
│ └─> Click "Initiate Approval"                               │
│     └─> Publishes multisig call + first vote                │
│         └─> Progress: 1/N votes                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Signatories #2..N-1 (Intermediate Voters)                   │
│ └─> Click "Cast Approval Vote"                              │
│     └─> Approve multisig call                               │
│         └─> Progress: 2/N, 3/N... votes                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Signatory #N (Final Voter)                                  │
│ └─> Click "Cast Final Vote & Execute"                       │
│     └─> Executes payment transaction                        │
│         └─> ✅ Payment sent to grantee                      │
│         └─> ✅ Milestone marked "completed"                 │
│         └─> ✅ Transaction hash recorded                    │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Example Configuration

### Test Committee Multisig Config

```javascript
{
  "multisigAddress": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "multisigThreshold": 2,
  "multisigSignatories": [
    "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
    "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y"
  ],
  "multisigApprovalPattern": "combined"
}
```

### Environment Variables

Add to `.env.local`:

```bash
# Polkadot Network (testnet by default)
NEXT_PUBLIC_POLKADOT_NETWORK=paseo

# For production:
# NEXT_PUBLIC_POLKADOT_NETWORK=polkadot
```

## 🐛 Troubleshooting

### "Committee multisig not configured" Error
- **Solution**: Configure multisig in committee management page first

### Voting panel not showing
- **Check**: Milestone must be "approved" (reviews completed)
- **Check**: Committee must have `multisigAddress` configured
- **Check**: Milestone status !== "completed"

### Cannot add signatory
- **Check**: Address format is valid SS58 (47-48 chars, starts with 1-5)
- **Check**: Address not already in list

### Threshold validation error
- **Solution**: Threshold must be ≤ number of signatories

## 📚 Related Documentation

- **Full Integration Guide**: `POLKADOT_IMPLEMENTATION_STATUS.md`
- **Comprehensive Documentation**: `src/docs/polkadot-multisig-integration.md`
- **Project Plan**: `plan.md` (Phase 4, item #6)

## 🎉 Success Criteria

You'll know the integration is working when:
1. ✅ Database tables created successfully
2. ✅ Committee management shows multisig configuration UI
3. ✅ Can save multisig configuration
4. ✅ Multisig voting panel appears for approved milestones
5. ✅ Can initiate approval (first vote)
6. ✅ Can cast intermediate votes
7. ✅ Can execute final payment
8. ✅ Milestone marked as completed with transaction hash

## 🔜 Production Readiness

Before going live with real blockchain transactions:

1. **Security Audit**: Review multisig logic and vote validation
2. **Wallet Integration**: Add real wallet connection
3. **Transaction Testing**: Test on Paseo testnet with real funds
4. **Error Handling**: Improve transaction failure recovery
5. **Gas Estimation**: Show users estimated costs
6. **User Documentation**: Add help tooltips and guides
7. **Monitoring**: Track transaction success rates

## 💡 Tips

- Start with **Paseo testnet** (free test tokens)
- Use **combined pattern** for simpler workflow
- Set **threshold = 2** for testing (faster)
- **3 signatories** is a good starting point
- Test with **multiple browser profiles** for different signatories

## 🤝 Support

For issues or questions:
1. Check `POLKADOT_IMPLEMENTATION_STATUS.md` for detailed status
2. Review `src/docs/polkadot-multisig-integration.md` for technical details
3. Check console logs for errors (prefixed with function names)

---

**Ready to test?** Start with Step 1: Push the database schema! 🚀

