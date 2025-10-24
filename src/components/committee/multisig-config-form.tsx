/**
 * Multisig Configuration Form Component
 *
 * Allows committee admins to configure multisig settings for on-chain payments.
 * Includes:
 * - Multisig address
 * - Threshold (number of required approvals)
 * - Signatories (committee member wallet addresses)
 * - Approval pattern (combined vs separated approval/payment)
 * - Network selection (Polkadot, Kusama, Paseo)
 */

'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react'
import type { MultisigConfig } from '@/lib/db/schema/jsonTypes/GroupSettings'

interface MultisigConfigFormProps {
  initialConfig?: MultisigConfig
  onSave: (config: MultisigConfig) => Promise<void>
  isLoading?: boolean
}

export function MultisigConfigForm({
  initialConfig,
  onSave,
  isLoading = false,
}: MultisigConfigFormProps) {
  const [config, setConfig] = useState<MultisigConfig>(
    initialConfig ?? {
      multisigAddress: '',
      signatories: [],
      threshold: 2,
      approvalWorkflow: 'merged',
      requireAllSignatories: false,
      votingTimeoutBlocks: 50400, // ~7 days on Polkadot (6s blocks)
      automaticExecution: true,
      network: 'paseo',
    }
  )

  const [newSignatory, setNewSignatory] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleAddSignatory = () => {
    if (!newSignatory.trim()) return

    // Basic validation for Substrate address format
    const substrateAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/
    if (!substrateAddressRegex.exec(newSignatory)) {
      alert('Invalid Substrate address format')
      return
    }

    if (config.signatories.includes(newSignatory)) {
      alert('This address is already in the signatories list')
      return
    }

    setConfig({
      ...config,
      signatories: [...config.signatories, newSignatory],
    })
    setNewSignatory('')
  }

  const handleRemoveSignatory = (address: string) => {
    setConfig({
      ...config,
      signatories: config.signatories.filter(s => s !== address),
      // Adjust threshold if it's now higher than signatory count
      threshold: Math.min(config.threshold, config.signatories.length - 1),
    })
  }

  const handleSave = async () => {
    // Validation
    if (!config.multisigAddress) {
      alert('Please enter a multisig address')
      return
    }

    if (config.signatories.length < 2) {
      alert('At least 2 signatories are required for a multisig')
      return
    }

    if (config.threshold < 2) {
      alert('Threshold must be at least 2')
      return
    }

    if (config.threshold > config.signatories.length) {
      alert('Threshold cannot exceed the number of signatories')
      return
    }

    setIsSaving(true)
    try {
      await onSave(config)
    } catch (error: unknown) {
      console.error('[multisig-config-form]: Failed to save', error)
      alert('Failed to save multisig configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const isValid =
    config.multisigAddress &&
    config.signatories.length >= 2 &&
    config.threshold >= 2 &&
    config.threshold <= config.signatories.length

  return (
    <div className="space-y-6">
      {/* Multisig Address */}
      <div className="space-y-2">
        <Label htmlFor="multisigAddress">Multisig Address</Label>
        <Input
          id="multisigAddress"
          placeholder="Enter the on-chain multisig address"
          value={config.multisigAddress}
          onChange={e =>
            setConfig({ ...config, multisigAddress: e.target.value })
          }
        />
        <p className="text-muted-foreground text-xs">
          The Substrate address of your committee&apos;s multisig account
        </p>
      </div>

      {/* Network Selection */}
      <div className="space-y-2">
        <Label>Network</Label>
        <RadioGroup
          value={config.network}
          onValueChange={(value: 'polkadot' | 'kusama' | 'paseo') =>
            setConfig({ ...config, network: value })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="paseo" id="paseo" />
            <Label htmlFor="paseo">Paseo Testnet (Development)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="polkadot" id="polkadot" />
            <Label htmlFor="polkadot">Polkadot (Mainnet)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="kusama" id="kusama" />
            <Label htmlFor="kusama">Kusama (Canary Network)</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Signatories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signatories</CardTitle>
          <CardDescription>
            Committee member wallet addresses authorized to approve payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add signatory */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter wallet address"
              value={newSignatory}
              onChange={e => setNewSignatory(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSignatory()}
            />
            <Button
              type="button"
              onClick={handleAddSignatory}
              disabled={!newSignatory.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Signatory list */}
          {config.signatories.length > 0 ? (
            <div className="space-y-2">
              {config.signatories.map((address, index) => (
                <div
                  key={address}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <code className="text-xs">
                      {address.slice(0, 8)}...{address.slice(-6)}
                    </code>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSignatory(address)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
              No signatories added yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threshold */}
      <div className="space-y-2">
        <Label htmlFor="threshold">
          Approval Threshold ({config.threshold} of {config.signatories.length})
        </Label>
        <Input
          id="threshold"
          type="number"
          min={2}
          max={config.signatories.length}
          value={config.threshold}
          onChange={e =>
            setConfig({
              ...config,
              threshold: Math.max(
                2,
                Math.min(
                  parseInt(e.target.value) || 2,
                  config.signatories.length
                )
              ),
            })
          }
        />
        <p className="text-muted-foreground text-xs">
          Number of approvals required to execute a payment
        </p>
      </div>

      {/* Approval Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval Workflow</CardTitle>
          <CardDescription>
            How review approvals relate to blockchain execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={config.approvalWorkflow}
            onValueChange={(value: 'merged' | 'separated') =>
              setConfig({ ...config, approvalWorkflow: value })
            }
          >
            <div className="space-y-4">
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="merged" id="merged" className="mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="merged" className="cursor-pointer">
                    Merged (Recommended)
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Review approval directly triggers blockchain signature.
                    Decision and execution happen in one step - more efficient.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem
                  value="separated"
                  id="separated"
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="separated" className="cursor-pointer">
                    Separated
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Review approval first, then separate blockchain signing
                    step. Two-phase process gives more control but requires more
                    transactions.
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Validation warning */}
      {!isValid && (
        <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-900">
              Configuration incomplete
            </p>
            <p className="mt-1 text-xs text-orange-800">
              Please provide multisig address and at least 2 signatories with a
              threshold of at least 2.
            </p>
          </div>
        </div>
      )}

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={!isValid || isSaving || isLoading}
        className="w-full"
        size="lg"
      >
        {(isSaving || isLoading) && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Save Multisig Configuration
      </Button>
    </div>
  )
}
