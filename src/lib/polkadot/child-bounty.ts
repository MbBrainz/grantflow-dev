/**
 * Polkadot Child Bounty utilities for milestone-based grant approvals
 *
 * This module provides functions for creating child bounty call bundles
 * that enable proper on-chain indexing by Subscan/Subsquare.
 *
 * The child bounty lifecycle consists of 5 calls bundled together:
 * 1. addChildBounty - Creates the child bounty and allocates funds
 * 2. proposeCurator - Parent curator proposes a curator for the child bounty
 * 3. acceptCurator - The proposed curator accepts the role
 * 4. awardChildBounty - Awards the bounty to the beneficiary
 * 5. claimChildBounty - Pays out the funds to the beneficiary
 *
 * Note: Using dedot for Polkadot API interactions
 */

import type { LegacyClient } from 'dedot'
import type { AccountId32 } from 'dedot/codecs'

/**
 * Parameters for creating a child bounty bundle
 */
export interface ChildBountyParams {
  parentBountyId: number
  beneficiaryAddress: string
  amount: bigint
  curatorAddress: string // The curator (usually a proxy controlled by the multisig)
  curatorFee: bigint // Fee for the curator (usually 0 for self-managed)
  description: string // On-chain description (e.g., "Milestone 1: Project XYZ")
}

/**
 * Result from creating a child bounty bundle
 */
export interface ChildBountyBundleResult {
  callHex: string
  callHash: string
  predictedChildBountyId: number
  calls: {
    addChildBounty: unknown
    proposeCurator: unknown
    acceptCurator: unknown
    awardChildBounty: unknown
    claimChildBounty: unknown
  }
}

/**
 * Query the next available child bounty ID
 *
 * Child bounty IDs are assigned sequentially by the chain.
 * We query the current count to predict the next ID.
 *
 * Note: There's a race condition risk if another child bounty
 * is created between our query and transaction execution.
 *
 * @param client - The LegacyClient instance from useApi()
 * @returns The next child bounty ID that will be assigned
 */
export async function getNextChildBountyId(
  client: LegacyClient
): Promise<number> {
  console.log('[getNextChildBountyId]: Querying child bounty count')

  try {
    const count = await client.query.childBounties.childBountyCount()
    const nextId = Number(count)

    console.log('[getNextChildBountyId]: Next child bounty ID will be', {
      currentCount: nextId,
      nextId,
    })

    return nextId
  } catch (error) {
    console.error(
      '[getNextChildBountyId]: Failed to query child bounty count',
      error
    )
    throw new Error(
      `Failed to get next child bounty ID: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Parent bounty info returned from chain query
 */
export interface ParentBountyInfo {
  value: bigint
  fee: bigint
  curatorDeposit: bigint
  bond: bigint
  status: {
    type: string
    curator?: AccountId32
  }
  description?: string
}

/**
 * Query a parent bounty by ID to get its curator
 *
 * The curator is stored in the bounty's status when the bounty is Active.
 * This is used to auto-populate the curator proxy address in the UI.
 *
 * @param client - The LegacyClient instance from useApi()
 * @param bountyId - The parent bounty ID
 * @returns Parent bounty info with curator, or null if not found
 */
export async function getParentBounty(
  client: LegacyClient,
  bountyId: number
): Promise<ParentBountyInfo | null> {
  console.log('[getParentBounty]: Querying parent bounty', { bountyId })



  try {
    // Query the bounties storage
    const bounty = await client.query.bounties.bounties(bountyId)
    const bountyDescriptions = await client.query.bounties.bountyDescriptions(bountyId)
    // description is hex encoded starting with 0x
    const description = Buffer.from(bountyDescriptions?.slice(2) ?? '', 'hex').toString('utf-8')

    if (!bounty) {
      console.log('[getParentBounty]: Bounty not found', { bountyId })
      return null
    }

    // Extract curator from status if bounty is Active
    // The status is typically: { type: 'Active', value: { curator, updateDue } }

    const status = bounty.status
    let curator: AccountId32 | undefined

    if (status?.type === 'Active' && status?.value?.curator) {
      curator = status.value.curator
    } else if (status?.type === 'CuratorProposed' && status?.value?.curator) {
      curator = status.value.curator
    } else if (status?.type === 'PendingPayout' && status?.value?.curator) {
      curator = status.value.curator
    } else if (status?.type === 'ApprovedWithCurator' && status?.value?.curator) {
      curator = status.value.curator
    }

    console.log('[getParentBounty]: Found bounty', {
      bountyId,
      statusType: status?.type,
      curator,
      value: bounty.value?.toString(),
      description,
    })

    return {
      value: BigInt(bounty.value ?? 0),
      fee: BigInt(bounty.fee ?? 0),
      curatorDeposit: BigInt(bounty.curatorDeposit ?? 0),
      bond: BigInt(bounty.bond ?? 0),
      status: {
        type: status?.type ?? 'Unknown',
        curator,
      },
      description,
    }
  } catch (error) {
    console.error('[getParentBounty]: Failed to query bounty', error)
    return null
  }
}

/**
 * Get the curator address for a parent bounty
 *
 * Convenience function that extracts just the curator address from a parent bounty.
 *
 * @param client - The LegacyClient instance from useApi()
 * @param bountyId - The parent bounty ID
 * @returns The curator address or null if not found/not active
 */
export async function getParentBountyCurator(
  client: LegacyClient,
  bountyId: number
): Promise<AccountId32 | null> {
  const bounty = await getParentBounty(client, bountyId)
  return bounty?.status.curator ?? null
}

/**
 * Query an existing child bounty by ID
 *
 * @param client - The LegacyClient instance from useApi()
 * @param parentBountyId - The parent bounty ID
 * @param childBountyId - The child bounty ID to query
 * @returns Child bounty info or null if not found
 */
export async function getChildBounty(
  client: LegacyClient,
  parentBountyId: number,
  childBountyId: number
): Promise<{
  value: bigint
  fee: bigint
  curatorDeposit: bigint
  status: unknown
} | null> {
  console.log('[getChildBounty]: Querying child bounty', {
    parentBountyId,
    childBountyId,
  })

  try {
    // childBounties storage requires a tuple key [parentBountyId, childBountyId]
    const childBounty = await client.query.childBounties.childBounties([
      parentBountyId,
      childBountyId,
    ])

    if (!childBounty) {
      return null
    }

    return {
      value: BigInt(childBounty.value),
      fee: BigInt(childBounty.fee),
      curatorDeposit: BigInt(childBounty.curatorDeposit),
      status: childBounty.status,
    }
  } catch (error) {
    console.error('[getChildBounty]: Failed to query child bounty', error)
    return null
  }
}

/**
 * Create a child bounty call bundle for milestone payout
 *
 * This creates all 5 calls needed to:
 * 1. Create the child bounty
 * 2. Assign and accept curator
 * 3. Award and claim the bounty
 *
 * The calls are bundled using utility.batchAll for atomic execution.
 *
 * @param client - The LegacyClient instance from useApi()
 * @param params - Child bounty parameters
 * @returns Bundle result with call data and predicted child bounty ID
 */
export async function createChildBountyBundle(
  client: LegacyClient,
  params: ChildBountyParams
): Promise<ChildBountyBundleResult> {
  console.log('[createChildBountyBundle]: Creating child bounty bundle', {
    parentBountyId: params.parentBountyId,
    beneficiaryAddress: params.beneficiaryAddress,
    amount: params.amount.toString(),
    curatorAddress: params.curatorAddress,
    curatorFee: params.curatorFee.toString(),
    description: params.description,
  })

  // Get the next child bounty ID
  const predictedChildBountyId = await getNextChildBountyId(client)

  // Convert description to bytes
  const descriptionBytes = new TextEncoder().encode(params.description)

  // 1. addChildBounty - Creates the child bounty
  const addChildBountyCall = client.tx.childBounties.addChildBounty(
    params.parentBountyId,
    params.amount,
    descriptionBytes
  )

  // 2. proposeCurator - Parent curator proposes the curator
  const proposeCuratorCall = client.tx.childBounties.proposeCurator(
    params.parentBountyId,
    predictedChildBountyId,
    params.curatorAddress,
    params.curatorFee
  )

  // 3. acceptCurator - Curator accepts the role
  const acceptCuratorCall = client.tx.childBounties.acceptCurator(
    params.parentBountyId,
    predictedChildBountyId
  )

  // 4. awardChildBounty - Award to beneficiary
  const awardChildBountyCall = client.tx.childBounties.awardChildBounty(
    params.parentBountyId,
    predictedChildBountyId,
    params.beneficiaryAddress
  )

  // 5. claimChildBounty - Claim the bounty (permissionless after award)
  const claimChildBountyCall = client.tx.childBounties.claimChildBounty(
    params.parentBountyId,
    predictedChildBountyId
  )

  // Bundle all calls atomically
  const batchCall = client.tx.utility.batchAll([
    addChildBountyCall.call,
    proposeCuratorCall.call,
    acceptCuratorCall.call,
    awardChildBountyCall.call,
    claimChildBountyCall.call,
  ])

  console.log('[createChildBountyBundle]: Bundle created', {
    predictedChildBountyId,
    callHash: batchCall.hash,
  })

  return {
    callHex: batchCall.callHex,
    callHash: batchCall.hash,
    predictedChildBountyId,
    calls: {
      addChildBounty: addChildBountyCall.call,
      proposeCurator: proposeCuratorCall.call,
      acceptCurator: acceptCuratorCall.call,
      awardChildBounty: awardChildBountyCall.call,
      claimChildBounty: claimChildBountyCall.call,
    },
  }
}

/**
 * Create the child bounty payout call bundle
 *
 * This is the main entry point for creating milestone payout calls.
 * Uses the childBounties pallet for proper on-chain indexing.
 *
 * @param client - The LegacyClient instance from useApi()
 * @param params - Payout parameters (all required)
 * @returns Call bundle result with predicted child bounty ID
 */
export async function createPayoutCall(
  client: LegacyClient,
  params: {
    beneficiaryAddress: string
    amount: bigint
    milestoneId: number
    milestoneTitle: string
    parentBountyId: number
    curatorAddress: string
    curatorFee?: bigint
  }
): Promise<{
  callHex: string
  callHash: string
  call: unknown
  predictedChildBountyId: number
}> {
  console.log('[createPayoutCall]: Creating child bounty payout call', {
    milestoneId: params.milestoneId,
    amount: params.amount.toString(),
    parentBountyId: params.parentBountyId,
  })

  // Create child bounty bundle
  const bundleResult = await createChildBountyBundle(client, {
    parentBountyId: params.parentBountyId,
    beneficiaryAddress: params.beneficiaryAddress,
    amount: params.amount,
    curatorAddress: params.curatorAddress,
    curatorFee: params.curatorFee ?? BigInt(0),
    description: `Milestone ${params.milestoneId}: ${params.milestoneTitle}`,
  })

  // Create the batch call for the full bundle
  // The calls from createChildBountyBundle are typed as unknown due to dedot's generic types
  // We cast to any to satisfy the batchAll type requirements
  const calls = [
    bundleResult.calls.addChildBounty,
    bundleResult.calls.proposeCurator,
    bundleResult.calls.acceptCurator,
    bundleResult.calls.awardChildBounty,
    bundleResult.calls.claimChildBounty,
  ]
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  const batchCall = client.tx.utility.batchAll(calls as any)

  return {
    callHex: bundleResult.callHex,
    callHash: bundleResult.callHash,
    call: batchCall.call,
    predictedChildBountyId: bundleResult.predictedChildBountyId,
  }
}
