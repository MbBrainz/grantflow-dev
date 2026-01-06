/**
 * Test script to verify multisig address computation
 *
 * Run with: npx tsx scripts/test-multisig-address.ts
 */

import {
  computeMultisigAddress,
  validateMultisigConfig,
  isSignatory,
  getSignatoryIndex,
  normalizeToPolkadot,
} from '../src/lib/polkadot/multisig-address'

// Known test data from Paseo Asset Hub bounty #31
// The multisig controlling the curator pure proxy
const KNOWN_MULTISIG = '16UkJk6ZuA6CdmT9YiyjnpNpgRUVh9fMGtkfmi8HCFSe6aqM'

// Real addresses from Paseo for testing
// You need to replace these with the actual signatories for the known multisig
// Use addresses that have valid SS58 checksums
const TEST_SIGNATORIES = [
  '15jgfpfSvcEF7FXd77LZ8eBh4MVeSfK5DbWJ6mQsonwvi7ZY', // Curator (Pure Proxy) from bounty 31
  '16UkJk6ZuA6CdmT9YiyjnpNpgRUVh9fMGtkfmi8HCFSe6aqM', // Multisig controlling the curator
]

function main() {
  console.log('='.repeat(60))
  console.log('Multisig Address Computation Test')
  console.log('='.repeat(60))
  console.log()

  // Test 1: Basic computation
  console.log('Test 1: Compute multisig address from signatories')
  console.log('-'.repeat(60))
  try {
    const computed = computeMultisigAddress(TEST_SIGNATORIES, 2)
    console.log('Signatories:', TEST_SIGNATORIES.length)
    console.log('Threshold: 2')
    console.log('Computed multisig:', computed)
    console.log()
  } catch (e) {
    console.error('Error:', e)
  }

  // Test 2: Validation against known multisig
  console.log('Test 2: Validate against known multisig')
  console.log('-'.repeat(60))
  const validation = validateMultisigConfig(KNOWN_MULTISIG, TEST_SIGNATORIES, 2)
  console.log('Expected multisig:', validation.expectedAddress)
  console.log('Computed multisig:', validation.computedAddress)
  console.log('Valid:', validation.valid)
  if (validation.error) {
    console.log('Error:', validation.error)
  }
  console.log()

  // Test 3: Check signatory membership
  console.log('Test 3: Check signatory membership')
  console.log('-'.repeat(60))
  const testWallet = TEST_SIGNATORIES[0]
  const isSig = isSignatory(testWallet, TEST_SIGNATORIES)
  const sigIndex = getSignatoryIndex(testWallet, TEST_SIGNATORIES)
  console.log('Test wallet:', `${testWallet.slice(0, 12)}...`)
  console.log('Is signatory:', isSig)
  console.log('Signatory index:', sigIndex)
  console.log()

  // Test 4: Address normalization
  console.log('Test 4: Address normalization')
  console.log('-'.repeat(60))
  const normalized = normalizeToPolkadot(KNOWN_MULTISIG)
  console.log('Original:', KNOWN_MULTISIG)
  console.log('Normalized:', normalized)
  console.log('Same:', KNOWN_MULTISIG === normalized)
  console.log()

  // Test 5: Different thresholds produce different addresses
  console.log('Test 5: Different thresholds produce different addresses')
  console.log('-'.repeat(60))
  try {
    const addr2of3 = computeMultisigAddress(TEST_SIGNATORIES, 2)
    const addr3of3 = computeMultisigAddress(TEST_SIGNATORIES, 3)
    console.log('2/3 multisig:', addr2of3)
    console.log('3/3 multisig:', addr3of3)
    console.log('Different:', addr2of3 !== addr3of3)
  } catch (e) {
    console.error('Error:', e)
  }

  console.log()
  console.log('='.repeat(60))
  console.log('Tests complete!')
  console.log()
  console.log(
    'NOTE: To fully validate, you need to provide the actual signatories'
  )
  console.log('for the known multisig address:', KNOWN_MULTISIG)
}

main()
