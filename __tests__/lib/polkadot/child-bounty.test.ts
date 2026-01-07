/**
 * Integration tests for the Child Bounty module
 *
 * Tests the Polkadot child bounty call creation for milestone payouts.
 * These tests mock the dedot LegacyClient to verify proper call construction.
 */

import type { LegacyClient } from 'dedot'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ChildBountyParams,
  createChildBountyBundle,
  createPayoutCall,
  getChildBounty,
  getNextChildBountyId,
  getParentBounty,
  getParentBountyCurator,
} from '@/lib/polkadot/child-bounty'

// Mock call object structure
const createMockCall = (name: string) => ({
  call: { type: name, data: {} },
  callHex: `0x${name.toLowerCase()}hex`,
  hash: `0x${name.toLowerCase()}hash`,
})

// Mock batch call with hash and callHex
const createMockBatchCall = (calls: unknown[]) => ({
  call: { type: 'batchAll', calls },
  callHex: '0xbatchallcallhex',
  hash: '0xbatchallcallhash',
})

// Test addresses
const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'

// Create a mock LegacyClient
function createMockClient(
  options: {
    childBountyCount?: number
    childBounty?: {
      value: bigint
      fee: bigint
      curatorDeposit: bigint
      status: unknown
    } | null
    parentBounty?: {
      value: bigint
      fee: bigint
      curatorDeposit: bigint
      bond: bigint
      status: {
        type: string
        value?: { curator?: string; updateDue?: number }
      }
    } | null
  } = {}
) {
  const {
    childBountyCount = 5,
    childBounty = null,
    parentBounty = null,
  } = options

  return {
    query: {
      childBounties: {
        childBountyCount: vi.fn().mockResolvedValue(BigInt(childBountyCount)),
        childBounties: vi.fn().mockResolvedValue(childBounty),
      },
      bounties: {
        bounties: vi.fn().mockResolvedValue(parentBounty),
      },
    },
    tx: {
      childBounties: {
        addChildBounty: vi
          .fn()
          .mockReturnValue(createMockCall('AddChildBounty')),
        proposeCurator: vi
          .fn()
          .mockReturnValue(createMockCall('ProposeCurator')),
        acceptCurator: vi.fn().mockReturnValue(createMockCall('AcceptCurator')),
        awardChildBounty: vi
          .fn()
          .mockReturnValue(createMockCall('AwardChildBounty')),
        claimChildBounty: vi
          .fn()
          .mockReturnValue(createMockCall('ClaimChildBounty')),
      },
      utility: {
        batchAll: vi
          .fn()
          .mockImplementation((calls: unknown[]) => createMockBatchCall(calls)),
      },
    },
  } as unknown as LegacyClient
}

describe('child-bounty module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getNextChildBountyId', () => {
    it('should return the next child bounty ID based on current count', async () => {
      const mockClient = createMockClient({ childBountyCount: 10 })

      const nextId = await getNextChildBountyId(mockClient)

      expect(nextId).toBe(10)
      expect(
        mockClient.query.childBounties.childBountyCount
      ).toHaveBeenCalledOnce()
    })

    it('should return 0 when no child bounties exist', async () => {
      const mockClient = createMockClient({ childBountyCount: 0 })

      const nextId = await getNextChildBountyId(mockClient)

      expect(nextId).toBe(0)
    })

    it('should throw an error when query fails', async () => {
      const mockClient = createMockClient()
      vi.mocked(
        mockClient.query.childBounties.childBountyCount
      ).mockRejectedValue(new Error('Network error'))

      await expect(getNextChildBountyId(mockClient)).rejects.toThrow(
        'Failed to get next child bounty ID: Network error'
      )
    })
  })

  describe('getChildBounty', () => {
    it('should return child bounty info when found', async () => {
      const mockBounty = {
        value: BigInt(1000000000000),
        fee: BigInt(100000000),
        curatorDeposit: BigInt(50000000),
        status: { type: 'Active' },
      }
      const mockClient = createMockClient({ childBounty: mockBounty })

      const result = await getChildBounty(mockClient, 1, 5)

      expect(result).toEqual({
        value: BigInt(1000000000000),
        fee: BigInt(100000000),
        curatorDeposit: BigInt(50000000),
        status: { type: 'Active' },
      })
      expect(mockClient.query.childBounties.childBounties).toHaveBeenCalledWith(
        [1, 5]
      )
    })

    it('should return null when child bounty not found', async () => {
      const mockClient = createMockClient({ childBounty: null })

      const result = await getChildBounty(mockClient, 1, 999)

      expect(result).toBeNull()
    })

    it('should return null when query fails', async () => {
      const mockClient = createMockClient()
      vi.mocked(mockClient.query.childBounties.childBounties).mockRejectedValue(
        new Error('Query failed')
      )

      const result = await getChildBounty(mockClient, 1, 5)

      expect(result).toBeNull()
    })
  })

  describe('getParentBounty', () => {
    it('should return parent bounty info with curator when Active', async () => {
      const mockParentBounty = {
        value: BigInt(10000000000000),
        fee: BigInt(500000000),
        curatorDeposit: BigInt(100000000),
        bond: BigInt(1000000000),
        status: {
          type: 'Active',
          value: { curator: ALICE, updateDue: 12345 },
        },
      }
      const mockClient = createMockClient({ parentBounty: mockParentBounty })

      const result = await getParentBounty(mockClient, 42)

      expect(result).not.toBeNull()
      expect(result?.value).toBe(BigInt(10000000000000))
      expect(result?.fee).toBe(BigInt(500000000))
      expect(result?.curatorDeposit).toBe(BigInt(100000000))
      expect(result?.bond).toBe(BigInt(1000000000))
      expect(result?.status.type).toBe('Active')
      expect(result?.status.curator).toBe(ALICE)
      expect(mockClient.query.bounties.bounties).toHaveBeenCalledWith(42)
    })

    it('should extract curator from CuratorProposed status', async () => {
      const mockParentBounty = {
        value: BigInt(5000000000000),
        fee: BigInt(0),
        curatorDeposit: BigInt(0),
        bond: BigInt(500000000),
        status: {
          type: 'CuratorProposed',
          value: { curator: ALICE },
        },
      }
      const mockClient = createMockClient({ parentBounty: mockParentBounty })

      const result = await getParentBounty(mockClient, 10)

      expect(result?.status.type).toBe('CuratorProposed')
      expect(result?.status.curator).toBe(ALICE)
    })

    it('should extract curator from PendingPayout status', async () => {
      const mockParentBounty = {
        value: BigInt(5000000000000),
        fee: BigInt(0),
        curatorDeposit: BigInt(0),
        bond: BigInt(500000000),
        status: {
          type: 'PendingPayout',
          value: { curator: ALICE, beneficiary: 'some_address', unlockAt: 999 },
        },
      }
      const mockClient = createMockClient({ parentBounty: mockParentBounty })

      const result = await getParentBounty(mockClient, 15)

      expect(result?.status.type).toBe('PendingPayout')
      expect(result?.status.curator).toBe(ALICE)
    })

    it('should return status without curator for Proposed bounty', async () => {
      const mockParentBounty = {
        value: BigInt(5000000000000),
        fee: BigInt(0),
        curatorDeposit: BigInt(0),
        bond: BigInt(500000000),
        status: {
          type: 'Proposed',
          value: {},
        },
      }
      const mockClient = createMockClient({ parentBounty: mockParentBounty })

      const result = await getParentBounty(mockClient, 5)

      expect(result?.status.type).toBe('Proposed')
      expect(result?.status.curator).toBeUndefined()
    })

    it('should return null when bounty not found', async () => {
      const mockClient = createMockClient({ parentBounty: null })

      const result = await getParentBounty(mockClient, 999)

      expect(result).toBeNull()
    })

    it('should return null when query fails', async () => {
      const mockClient = createMockClient()
      vi.mocked(mockClient.query.bounties.bounties).mockRejectedValue(
        new Error('Network error')
      )

      const result = await getParentBounty(mockClient, 42)

      expect(result).toBeNull()
    })
  })

  describe('getParentBountyCurator', () => {
    it('should return curator address from active bounty', async () => {
      const mockParentBounty = {
        value: BigInt(10000000000000),
        fee: BigInt(0),
        curatorDeposit: BigInt(0),
        bond: BigInt(0),
        status: {
          type: 'Active',
          value: { curator: ALICE },
        },
      }
      const mockClient = createMockClient({ parentBounty: mockParentBounty })

      const curator = await getParentBountyCurator(mockClient, 42)

      expect(curator).toBe(ALICE)
    })

    it('should return null when bounty has no curator', async () => {
      const mockParentBounty = {
        value: BigInt(5000000000000),
        fee: BigInt(0),
        curatorDeposit: BigInt(0),
        bond: BigInt(0),
        status: {
          type: 'Proposed',
          value: {},
        },
      }
      const mockClient = createMockClient({ parentBounty: mockParentBounty })

      const curator = await getParentBountyCurator(mockClient, 5)

      expect(curator).toBeNull()
    })

    it('should return null when bounty not found', async () => {
      const mockClient = createMockClient({ parentBounty: null })

      const curator = await getParentBountyCurator(mockClient, 999)

      expect(curator).toBeNull()
    })
  })

  describe('createChildBountyBundle', () => {
    const defaultParams: ChildBountyParams = {
      parentBountyId: 1,
      beneficiaryAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      amount: BigInt(1000000000000), // 1 DOT
      curatorAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      curatorFee: BigInt(0),
      description: 'Milestone 1: Project XYZ',
    }

    it('should create a child bounty bundle with all 5 calls', async () => {
      const mockClient = createMockClient({ childBountyCount: 10 })

      const result = await createChildBountyBundle(mockClient, defaultParams)

      expect(result.predictedChildBountyId).toBe(10)
      expect(result.callHex).toBe('0xbatchallcallhex')
      expect(result.callHash).toBe('0xbatchallcallhash')

      // Verify all 5 calls are created
      expect(result.calls.addChildBounty).toBeDefined()
      expect(result.calls.proposeCurator).toBeDefined()
      expect(result.calls.acceptCurator).toBeDefined()
      expect(result.calls.awardChildBounty).toBeDefined()
      expect(result.calls.claimChildBounty).toBeDefined()
    })

    it('should call addChildBounty with correct parameters', async () => {
      const mockClient = createMockClient({ childBountyCount: 5 })

      await createChildBountyBundle(mockClient, defaultParams)

      expect(mockClient.tx.childBounties.addChildBounty).toHaveBeenCalledWith(
        defaultParams.parentBountyId,
        defaultParams.amount,
        expect.any(Uint8Array) // Description bytes
      )
    })

    it('should call proposeCurator with predicted child bounty ID', async () => {
      const mockClient = createMockClient({ childBountyCount: 7 })

      await createChildBountyBundle(mockClient, defaultParams)

      expect(mockClient.tx.childBounties.proposeCurator).toHaveBeenCalledWith(
        defaultParams.parentBountyId,
        7, // Predicted child bounty ID
        defaultParams.curatorAddress,
        defaultParams.curatorFee
      )
    })

    it('should call acceptCurator with correct IDs', async () => {
      const mockClient = createMockClient({ childBountyCount: 3 })

      await createChildBountyBundle(mockClient, defaultParams)

      expect(mockClient.tx.childBounties.acceptCurator).toHaveBeenCalledWith(
        defaultParams.parentBountyId,
        3 // Predicted child bounty ID
      )
    })

    it('should call awardChildBounty with beneficiary address', async () => {
      const mockClient = createMockClient({ childBountyCount: 2 })

      await createChildBountyBundle(mockClient, defaultParams)

      expect(mockClient.tx.childBounties.awardChildBounty).toHaveBeenCalledWith(
        defaultParams.parentBountyId,
        2, // Predicted child bounty ID
        defaultParams.beneficiaryAddress
      )
    })

    it('should call claimChildBounty with correct IDs', async () => {
      const mockClient = createMockClient({ childBountyCount: 0 })

      await createChildBountyBundle(mockClient, defaultParams)

      expect(mockClient.tx.childBounties.claimChildBounty).toHaveBeenCalledWith(
        defaultParams.parentBountyId,
        0 // Predicted child bounty ID
      )
    })

    it('should bundle all calls using batchAll', async () => {
      const mockClient = createMockClient({ childBountyCount: 5 })

      await createChildBountyBundle(mockClient, defaultParams)

      expect(mockClient.tx.utility.batchAll).toHaveBeenCalledWith([
        expect.objectContaining({ type: 'AddChildBounty' }),
        expect.objectContaining({ type: 'ProposeCurator' }),
        expect.objectContaining({ type: 'AcceptCurator' }),
        expect.objectContaining({ type: 'AwardChildBounty' }),
        expect.objectContaining({ type: 'ClaimChildBounty' }),
      ])
    })

    it('should encode description as bytes', async () => {
      const mockClient = createMockClient({ childBountyCount: 5 })
      const customParams = {
        ...defaultParams,
        description: 'Test milestone description',
      }

      await createChildBountyBundle(mockClient, customParams)

      const addChildBountyCall = vi.mocked(
        mockClient.tx.childBounties.addChildBounty
      )
      const descriptionArg = addChildBountyCall.mock.calls[0][2]

      // Verify it's a Uint8Array with the correct content
      expect(descriptionArg).toBeInstanceOf(Uint8Array)
      expect(new TextDecoder().decode(descriptionArg as Uint8Array)).toBe(
        'Test milestone description'
      )
    })
  })

  describe('createPayoutCall', () => {
    const defaultParams = {
      beneficiaryAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      amount: BigInt(5000000000000), // 5 DOT
      milestoneId: 42,
      milestoneTitle: 'Complete Phase 1',
      parentBountyId: 3,
      curatorAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    }

    it('should create a payout call with child bounty workflow', async () => {
      const mockClient = createMockClient({ childBountyCount: 15 })

      const result = await createPayoutCall(mockClient, defaultParams)

      expect(result.callHex).toBeDefined()
      expect(result.callHash).toBeDefined()
      expect(result.call).toBeDefined()
      expect(result.predictedChildBountyId).toBe(15)
    })

    it('should use default curator fee of 0 when not provided', async () => {
      const mockClient = createMockClient({ childBountyCount: 5 })

      await createPayoutCall(mockClient, defaultParams)

      expect(mockClient.tx.childBounties.proposeCurator).toHaveBeenCalledWith(
        defaultParams.parentBountyId,
        5,
        defaultParams.curatorAddress,
        BigInt(0) // Default fee
      )
    })

    it('should use provided curator fee when specified', async () => {
      const mockClient = createMockClient({ childBountyCount: 5 })
      const paramsWithFee = {
        ...defaultParams,
        curatorFee: BigInt(100000000),
      }

      await createPayoutCall(mockClient, paramsWithFee)

      expect(mockClient.tx.childBounties.proposeCurator).toHaveBeenCalledWith(
        paramsWithFee.parentBountyId,
        5,
        paramsWithFee.curatorAddress,
        BigInt(100000000)
      )
    })

    it('should create description from milestone info', async () => {
      const mockClient = createMockClient({ childBountyCount: 5 })

      await createPayoutCall(mockClient, defaultParams)

      const addChildBountyCall = vi.mocked(
        mockClient.tx.childBounties.addChildBounty
      )
      const descriptionArg = addChildBountyCall.mock.calls[0][2]

      expect(new TextDecoder().decode(descriptionArg as Uint8Array)).toBe(
        'Milestone 42: Complete Phase 1'
      )
    })

    it('should return the batch call for wrapping in multisig', async () => {
      const mockClient = createMockClient({ childBountyCount: 8 })

      const result = await createPayoutCall(mockClient, defaultParams)

      // The batchAll should be called twice - once in createChildBountyBundle
      // and once in createPayoutCall for the final bundle
      expect(mockClient.tx.utility.batchAll).toHaveBeenCalled()
      expect(result.call).toBeDefined()
    })
  })
})
