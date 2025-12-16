// Multisig configuration for committee wallet
export interface MultisigConfig {
  multisigAddress: string
  signatories: string[] // Wallet addresses of committee members
  threshold: number // Number of approvals required

  // Workflow configuration: How review approvals relate to blockchain execution
  approvalWorkflow: 'merged' | 'separated'
  // - 'merged': Review approval = blockchain signature (decision + execution in one step)
  // - 'separated': Review approval first, then separate blockchain signing (two-phase process)

  requireAllSignatories: boolean // If true, all must vote (not just threshold)
  votingTimeoutBlocks: number // How long before vote expires
  automaticExecution: boolean // Auto-execute on threshold or manual trigger
  network: 'polkadot' | 'kusama' | 'paseo' // Which Polkadot network

  // Child Bounty configuration (required for on-chain payout indexing)
  // Payouts use childBounties pallet for proper on-chain indexing by Subscan/Subsquare
  parentBountyId: number // Parent bounty ID on-chain
  curatorProxyAddress: string // Proxy account that acts as curator for child bounties
}

export interface GroupSettings {
  votingThreshold: number
  requiredApprovalPercentage: number
  stages: string[]
  multisig?: MultisigConfig // Optional multisig configuration for committees
}

export type FocusAreas = string[]
