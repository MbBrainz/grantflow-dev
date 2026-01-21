# Grantflow TestNet Testing Tutorial

## Overview

This tutorial guides you through testing the Grantflow bounty management features on the **Paseo Asset Hub TestNet**.

### Test Environment Setup

- **Network:** Paseo Asset Hub TestNet
- **Bounty:** #32
- **Committee:** Fast Grants (testnet version)
- **Multisig Configuration:** 2-of-3 threshold

### What You'll Test

| Feature | Initial State | Your Action |
|---------|--------------|-------------|
| Milestone Review #1 | In review, 1/2 signatures | Sign to complete approval |
| Milestone Review #2 | In review, 0/2 signatures | Initiate approval process |
| Grant Submissions | 1-2 pending submissions | Approve or decline |

---

## Prerequisites

Before starting the test, you must import the test wallet into your Polkadot-compatible wallet extension (e.g., Talisman, SubWallet, or Polkadot.js).

### Import Test Wallet

**Seed Phrase:**
```
media spice upset obvious slush advice derive know staff like hold extra
```

**Derivation Path:** `//2`

> **Warning:** This is Test Wallet 3. Make sure you use derivation path `//2` to derive the correct account.

---

## Testing Steps

### Step 1: Create Account & Find Bounty

1. Navigate to Grantflow on TestNet
2. Create a new account (the UI will guide you through this process)
3. Search for and locate **Bounty #32**

### Step 2: Connect Wallet

1. Click "Connect Wallet" 
2. Select your wallet extension
3. Choose the account you imported with the seed phrase above (derivation path `//2`)
4. Approve the connection request

### Step 3: Claim Committee Membership

1. After connecting, select the **Fast Grants** committee
2. The system will detect that you own the third wallet address (not yet linked)
3. Verify ownership and claim the wallet
4. You will automatically become a member of the Fast Grants committee (linked to Bounty #32)

### Step 4: Review Milestones

#### Milestone with Existing Approval
1. Navigate to the milestone that shows "1/2 signatures"
2. Review the milestone details
3. Sign to add your approval (this completes the 2/2 threshold)
4. Verify the milestone is now fully approved

#### Milestone with No Approvals
1. Find the milestone showing "0/2 signatures"  
2. Review the milestone submission
3. Sign to initiate the approval process
4. Verify your signature is recorded (now shows 1/2)

### Step 5: Review Grant Submissions

1. Navigate to pending submissions
2. Review each submission's details
3. Choose to **Approve** or **Decline** each submission
4. Confirm your decision with a wallet signature

---

## Expected Results

After completing all steps, you should have:

- [ ] Successfully imported wallet with correct derivation path
- [ ] Connected wallet to Grantflow
- [ ] Claimed committee membership for Fast Grants
- [ ] Completed approval on milestone with 1 existing signature
- [ ] Initiated approval on milestone with 0 signatures
- [ ] Processed pending grant submissions

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Account already exists" error | Ensure you're using derivation path `//2`, not `//1` or default |
| Wallet not recognized as committee member | Verify the correct seed phrase and derivation path |
| Cannot sign transactions | Check you're connected to Paseo Asset Hub network |