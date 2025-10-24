/**
 * Signatory Vote List Component
 *
 * Displays a list of committee member signatories and their voting status
 * for a multisig approval. Shows:
 * - Signatory address and name
 * - Vote status (pending, approved, rejected)
 * - Transaction hash link to block explorer
 * - Whether they were the initiator
 */

'use client'

import { CheckCircle, XCircle, Clock, ExternalLink, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface SignatoryVote {
  address: string
  signatureType?: 'signed' | 'rejected' | null
  txHash?: string | null
  signedAt?: Date | null
  isInitiator?: boolean
  isFinalApproval?: boolean
  user?: {
    id: number
    name: string | null
    email: string | null
  } | null
}

interface SignatoryVoteListProps {
  signatories: SignatoryVote[]
  network?: 'polkadot' | 'kusama' | 'paseo'
  className?: string
}

export function SignatoryVoteList({
  signatories,
  network = 'paseo',
  className,
}: SignatoryVoteListProps) {
  const getBlockExplorerUrl = (txHash: string) => {
    const baseUrls = {
      polkadot: 'https://polkadot.subscan.io',
      kusama: 'https://kusama.subscan.io',
      paseo: 'https://paseo.subscan.io',
    }
    return `${baseUrls[network]}/extrinsic/${txHash}`
  }

  const getStatusIcon = (signatory: SignatoryVote) => {
    if (signatory.signatureType === 'signed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    if (signatory.signatureType === 'rejected') {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
    return <Clock className="text-muted-foreground h-4 w-4" />
  }

  const getStatusBadge = (signatory: SignatoryVote) => {
    if (signatory.signatureType === 'signed') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Approved
        </Badge>
      )
    }
    if (signatory.signatureType === 'rejected') {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          Rejected
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Pending
      </Badge>
    )
  }

  if (signatories.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed p-8 text-center',
          className
        )}
      >
        <p className="text-muted-foreground text-sm">
          No signatories have voted yet
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {signatories.map(signatory => (
        <div
          key={signatory.address}
          className={cn(
            'flex items-center justify-between rounded-lg border p-4 transition-colors',
            signatory.signatureType === 'signed' &&
              'border-green-200 bg-green-50/50',
            signatory.signatureType === 'rejected' &&
              'border-red-200 bg-red-50/50'
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Status icon */}
            <div className="flex-shrink-0">{getStatusIcon(signatory)}</div>

            {/* Signatory info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">
                  {signatory.user?.name ?? 'Committee Member'}
                </p>
                {signatory.isInitiator && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Initiator
                  </Badge>
                )}
                {signatory.isFinalApproval && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Executor
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-muted-foreground text-xs">
                  {signatory.address.slice(0, 8)}...
                  {signatory.address.slice(-6)}
                </code>
                {signatory.signedAt && (
                  <span className="text-muted-foreground text-xs">
                    • {new Date(signatory.signedAt).toLocaleDateString()} at{' '}
                    {new Date(signatory.signedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* Status badge */}
            <div className="flex-shrink-0">{getStatusBadge(signatory)}</div>
          </div>

          {/* Transaction link */}
          {signatory.txHash && (
            <a
              href={getBlockExplorerUrl(signatory.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 flex flex-shrink-0 items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              View Tx
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
