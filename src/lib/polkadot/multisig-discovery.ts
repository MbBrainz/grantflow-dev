/**
 * Multisig Discovery Utilities
 *
 * Given a bounty ID, discovers the multisig structure:
 * 1. Bounty → Curator (may be a Pure Proxy or direct Multisig)
 * 2. If Pure Proxy → find controlling Multisig
 * 3. Signatories cannot be derived on-chain, must be provided
 *
 * Two possible structures:
 * A) Signatories → Multisig → Pure Proxy (Curator) → Bounty
 * B) Signatories → Multisig (Curator) → Bounty (no proxy)
 */

import type { LegacyClient } from 'dedot'
import { encodeAddress, decodeAddress } from 'dedot/utils'

// SS58 prefix for Polkadot/Asset Hub (addresses start with 1)
const POLKADOT_SS58_PREFIX = 0

/**
 * Result from discovering multisig structure
 */
export interface MultisigStructure {
  bountyId: number
  bountyStatus: string
  bountyDescription?: string // Decoded from hex
  curator: {
    address: string
    raw: string
  }
  // If curator is a pure proxy controlled by a multisig
  controllingMultisig?: {
    address: string
    raw: string
    proxyType: string
  }
  // Whether curator is directly a multisig (no proxy in between)
  curatorIsMultisig: boolean
  // The effective multisig address (either controlling multisig or curator itself)
  effectiveMultisig: string
}

/**
 * Convert any address/AccountId32 to Polkadot format (prefix 0)
 */
export function toPolkadotAddress(
  address: string | { raw: Uint8Array | string } | { address: () => string }
): string {
  try {
    if (typeof address === 'object' && 'raw' in address) {
      const raw =
        typeof address.raw === 'string'
          ? hexToUint8Array(address.raw)
          : address.raw
      return encodeAddress(raw, POLKADOT_SS58_PREFIX)
    }
    if (typeof address === 'object' && 'address' in address) {
      const genericAddress = address.address()
      const decoded = decodeAddress(genericAddress)
      return encodeAddress(decoded, POLKADOT_SS58_PREFIX)
    }
    const decoded = decodeAddress(address)
    return encodeAddress(decoded, POLKADOT_SS58_PREFIX)
  } catch (e) {
    console.error('[toPolkadotAddress] Failed to convert:', address, e)
    return String(address)
  }
}

/**
 * Convert hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * Decode hex-encoded string (0x prefixed) to UTF-8 string
 */
function decodeHexString(hex: string | Uint8Array | undefined): string | undefined {
  if (!hex) return undefined
  try {
    const bytes = typeof hex === 'string' ? hexToUint8Array(hex) : hex
    return new TextDecoder().decode(bytes)
  } catch (e) {
    console.error('[decodeHexString] Failed to decode:', e)
    return undefined
  }
}

/**
 * Get raw hex from AccountId32 or address
 */
function getRawHex(accountId: { raw: Uint8Array | string } | string): string {
  if (typeof accountId === 'object' && 'raw' in accountId) {
    if (typeof accountId.raw === 'string') {
      return accountId.raw
    }
    return (
      `0x${ 
      Array.from(accountId.raw)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`
    )
  }
  // Convert address to raw
  const decoded = decodeAddress(accountId)
  return (
    `0x${ 
    Array.from(decoded)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`
  )
}

/**
 * Discover multisig structure from a bounty ID
 *
 * @param client - The LegacyClient connected to Asset Hub
 * @param bountyId - The bounty ID to query
 * @returns MultisigStructure or null if bounty not found
 */
export async function discoverMultisigStructure(
  client: LegacyClient,
  bountyId: number
): Promise<MultisigStructure | null> {
  console.log('[discoverMultisigStructure] Querying bounty', bountyId)

  // Step 1: Get bounty info and description
  const [bounty, descriptionRaw] = await Promise.all([
    client.query.bounties.bounties(bountyId),
    client.query.bounties.bountyDescriptions(bountyId),
  ])

  if (!bounty) {
    console.log('[discoverMultisigStructure] Bounty not found')
    return null
  }

  // Decode the hex-encoded description
  const bountyDescription = decodeHexString(descriptionRaw as string | Uint8Array | undefined)
  console.log('[discoverMultisigStructure] Description:', bountyDescription)

  // Extract curator from status
  // Status is a union type - curator exists on Active, CuratorProposed, PendingPayout, ApprovedWithCurator
  const status = bounty.status as { type: string; value?: { curator?: unknown } }
  const curatorAccountId = status?.value?.curator

  if (!curatorAccountId) {
    console.log('[discoverMultisigStructure] No curator in bounty status')
    return null
  }

  const curatorAddress = toPolkadotAddress(
    curatorAccountId as string | { raw: Uint8Array | string }
  )
  const curatorRaw = getRawHex(
    curatorAccountId as { raw: Uint8Array | string } | string
  )

  console.log('[discoverMultisigStructure] Curator:', curatorAddress)

  // Step 2: Check if curator is a proxy controlled by another account
  const proxiesResult = await client.query.proxy.proxies(curatorAddress)
  const proxies = Array.isArray(proxiesResult) ? proxiesResult[0] : []

  let controllingMultisig: MultisigStructure['controllingMultisig'] = undefined
  let curatorIsMultisig = true // Assume curator is multisig unless we find a controlling account

  if (Array.isArray(proxies) && proxies.length > 0) {
    // Curator is a proxy with a delegate (controlling account)
    const delegate = proxies[0]
    const delegateAddress = toPolkadotAddress(delegate.delegate)
    const delegateRaw = getRawHex(delegate.delegate)
    // proxyType can be a string enum or an object with type property
    const proxyTypeValue = delegate.proxyType as string | { type: string }
    const proxyType =
      typeof proxyTypeValue === 'object' && 'type' in proxyTypeValue
        ? proxyTypeValue.type
        : String(proxyTypeValue)

    console.log(
      '[discoverMultisigStructure] Curator is controlled by:',
      delegateAddress
    )

    controllingMultisig = {
      address: delegateAddress,
      raw: delegateRaw,
      proxyType,
    }
    curatorIsMultisig = false // Curator is a pure proxy, not the multisig
  }

  // Effective multisig is either the controlling account or the curator itself
  const effectiveMultisig = controllingMultisig?.address ?? curatorAddress

  return {
    bountyId,
    bountyStatus: status?.type ?? 'Unknown',
    bountyDescription,
    curator: {
      address: curatorAddress,
      raw: curatorRaw,
    },
    controllingMultisig,
    curatorIsMultisig,
    effectiveMultisig,
  }
}

/**
 * Check if an address has pending multisig calls
 * (which would reveal some signatories)
 */
export async function getPendingMultisigCalls(
  client: LegacyClient,
  multisigAddress: string
): Promise<
  {
    callHash: string
    approvals: string[]
    depositor: string
    when: { height: number; index: number }
  }[]
> {
  console.log('[getPendingMultisigCalls] Querying for:', multisigAddress)

  try {
    // Use type assertion - entries() works at runtime but TypeScript doesn't recognize it
    const multisigQuery = client.query.multisig.multisigs;
    const entries = await multisigQuery.pagedEntries(multisigAddress)

    if (!entries || entries.length === 0) {
      console.log("entries", entries)
      return []
    }

    return entries.map(([key, value]: [unknown[], unknown]) => {
      const entryValue = value as {
        approvals?: unknown[]
        depositor?: unknown
        when?: { height?: number; index?: number }
      }
      const callHash = key[1] // Second part of the double map key
      const approvals = (entryValue?.approvals ?? []).map((a: unknown) =>
        toPolkadotAddress(a as string | { raw: Uint8Array | string })
      )
      const depositor = entryValue?.depositor
        ? toPolkadotAddress(
            entryValue.depositor as string | { raw: Uint8Array | string }
          )
        : ''
      const when = entryValue?.when ?? { height: 0, index: 0 }

      return {
        callHash: String(callHash),
        approvals,
        depositor,
        when: {
          height: Number(when.height ?? 0),
          index: Number(when.index ?? 0),
        },
      }
    })
  } catch (e) {
    console.error('[getPendingMultisigCalls] Error:', e)
    return []
  }
}
