/**
 * Mapping between a signatory wallet address and an optional platform user
 * Users can self-link their wallet address to claim signatory ownership
 */
export interface SignatoryMapping {
  address: string // Wallet address (SS58 format)
  userId?: number // Optional link to platform user (self-service linking)
}

/**
 * Multisig configuration for committee wallet
 * Links the committee to an on-chain bounty and defines the multisig structure
 */
export interface MultisigConfig {
  // Chain identity - bounty is the source of truth
  network: 'polkadot' | 'paseo' // Which Polkadot network
  parentBountyId: number // Parent bounty ID on-chain

  // Discovered from chain (read-only, refreshed on validation)
  curatorProxyAddress: string // Proxy account that acts as curator for child bounties
  multisigAddress: string // The effective multisig address controlling the proxy
  bountyDescription?: string // Decoded bounty description from chain

  // Signatories with optional user links
  signatories: SignatoryMapping[] // Wallet addresses with optional user links
  threshold: number // Number of approvals required

  // Workflow configuration: How review approvals relate to blockchain execution
  approvalWorkflow: 'merged' | 'separated'
  // - 'merged': Review approval = blockchain signature (decision + execution in one step)
  // - 'separated': Review approval first, then separate blockchain signing (two-phase process)

  votingTimeoutBlocks: number // How long before vote expires
  automaticExecution: boolean // Auto-execute on threshold or manual trigger
}

export interface GroupSettings {
  votingThreshold: number
  requiredApprovalPercentage: number
  stages: string[]
  multisig?: MultisigConfig // Optional multisig configuration for committees
}

export type FocusAreas = string[]
