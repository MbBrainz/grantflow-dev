/**
 * Test script to explore the multisig/proxy structure on Paseo Asset Hub
 * Uses the new multisig-discovery module
 */

import { DedotClient, WsProvider } from 'dedot'
import {
  discoverMultisigStructure,
  getPendingMultisigCalls,
} from '../src/lib/polkadot/multisig-discovery'

// Paseo Asset Hub RPC
const RPC_URL = 'wss://sys.ibp.network/asset-hub-paseo'

// Test with bounty 31
const BOUNTY_ID = 31

async function main() {
  console.log('='.repeat(60))
  console.log('Multisig Structure Discovery Test')
  console.log('='.repeat(60))
  console.log()

  // Connect to Paseo Asset Hub
  console.log('Connecting to', RPC_URL)
  const client = await DedotClient.new(new WsProvider(RPC_URL))
  console.log('Connected!')
  console.log()

  try {
    // Test the discovery function
    console.log('─'.repeat(60))
    console.log(`Testing discoverMultisigStructure(bountyId: ${BOUNTY_ID})`)
    console.log('─'.repeat(60))

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    const structure = await discoverMultisigStructure(client as any, BOUNTY_ID)

    if (!structure) {
      console.log('No structure found!')
      return
    }

    console.log()
    console.log('Discovered Structure:')
    console.log(JSON.stringify(structure, null, 2))

    console.log()
    console.log('Summary:')
    console.log('  Bounty ID:', structure.bountyId)
    console.log('  Bounty Status:', structure.bountyStatus)
    console.log('  Curator Address:', structure.curator.address)
    console.log('  Curator is Multisig:', structure.curatorIsMultisig)

    if (structure.controllingMultisig) {
      console.log(
        '  Controlling Multisig:',
        structure.controllingMultisig.address
      )
      console.log('  Proxy Type:', structure.controllingMultisig.proxyType)
    }

    console.log('  Effective Multisig:', structure.effectiveMultisig)

    // Check for pending multisig calls
    console.log()
    console.log('─'.repeat(60))
    console.log('Checking for pending multisig calls...')
    console.log('─'.repeat(60))

    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
    const pendingCalls = await getPendingMultisigCalls(
      client as any,
      structure.effectiveMultisig
    )
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

    if (pendingCalls.length > 0) {
      console.log('Found', pendingCalls.length, 'pending call(s):')
      for (const call of pendingCalls) {
        console.log('  Call Hash:', call.callHash)
        console.log('  Depositor:', call.depositor)
        console.log('  Approvals:', call.approvals)
        console.log('  When:', call.when)
      }
    } else {
      console.log('No pending multisig calls found')
    }

    // Test with bounty 32 as well
    console.log()
    console.log('─'.repeat(60))
    console.log('Testing with Bounty #32')
    console.log('─'.repeat(60))

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    const structure32 = await discoverMultisigStructure(client as any, 32)
    if (structure32) {
      console.log('Bounty 32 Curator:', structure32.curator.address)
      console.log(
        'Same curator as #31:',
        structure32.curator.address === structure.curator.address
      )
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.disconnect()
    console.log()
    console.log('Disconnected')
  }
}

main().catch(console.error)
