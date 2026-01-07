'use client'

import { useActionState, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Wallet, Link2, Unlink, CheckCircle, Info } from 'lucide-react'
import {
  updateAccountState,
  linkWalletToAccount,
  unlinkWallet,
  type AccountFormState,
} from '@/app/(login)/actions'
import type { User } from '@/lib/db/schema'
import useSWR, { mutate } from 'swr'
import { Suspense } from 'react'
import { fetcher } from '@/lib/utils'
import { useAccount } from '@luno-kit/react'
import { useToast } from '@/lib/hooks/use-toast'

interface AccountFormProps {
  state: AccountFormState
  nameValue?: string
  emailValue?: string
}

function AccountForm({
  state,
  nameValue = '',
  emailValue = '',
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your name"
          defaultValue={(state.name ?? nameValue) || ''}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={emailValue || ''}
          disabled
          className="bg-muted cursor-not-allowed"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Email addresses cannot be changed
        </p>
      </div>
    </>
  )
}

function AccountFormWithData({ state }: { state: AccountFormState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher)
  return (
    <AccountForm
      state={state}
      nameValue={(user?.name ?? '') || ''}
      emailValue={(user?.email ?? '') || ''}
    />
  )
}

function WalletLinkCard() {
  const { data: user } = useSWR<User>('/api/user', fetcher)
  const { address } = useAccount()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const linkedWallet = user?.walletAddress

  const handleLinkWallet = () => {
    if (!address) return

    setError(null)
    startTransition(async () => {
      const result = await linkWalletToAccount({ walletAddress: address })

      if ('error' in result && result.error) {
        setError(result.error)
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        await mutate('/api/user')
        toast({
          title: 'Wallet linked',
          description: 'Your wallet has been linked to your account.',
        })
      }
    })
  }

  const handleUnlinkWallet = () => {
    setError(null)
    startTransition(async () => {
      const result = await unlinkWallet({})

      if ('error' in result && result.error) {
        setError(result.error)
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        await mutate('/api/user')
        toast({
          title: 'Wallet unlinked',
          description: 'Your wallet has been unlinked from your account.',
        })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Linked Wallet
        </CardTitle>
        <CardDescription>
          Link your Polkadot wallet to claim signatory roles in committees.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {linkedWallet ? (
          // Wallet is already linked
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Wallet Linked</p>
                  <code className="text-muted-foreground text-xs">
                    {linkedWallet.slice(0, 10)}...{linkedWallet.slice(-8)}
                  </code>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlinkWallet}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Unlink className="mr-2 h-4 w-4" />
                    Unlink
                  </>
                )}
              </Button>
            </div>

            {/* Show if connected wallet is different from linked wallet */}
            {address && address !== linkedWallet && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
                <Info className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Different wallet connected
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Your connected wallet ({address.slice(0, 6)}...
                    {address.slice(-4)}) is different from your linked wallet.
                    Unlink first to link the new wallet.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : address ? (
          // Wallet connected but not linked
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Wallet className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Connected Wallet</p>
                  <code className="text-muted-foreground text-xs">
                    {address.slice(0, 10)}...{address.slice(-8)}
                  </code>
                </div>
              </div>
              <Badge variant="outline">Not linked</Badge>
            </div>

            <Button
              onClick={handleLinkWallet}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Link this wallet to my account
                </>
              )}
            </Button>
          </div>
        ) : (
          // No wallet connected
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Wallet className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
            <p className="text-muted-foreground mb-2 text-sm">
              No wallet connected
            </p>
            <p className="text-muted-foreground mb-4 text-xs">
              Connect your Polkadot wallet using the button in the header to
              link it to your account.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>
    </Card>
  )
}

export default function GeneralPage() {
  const [state, formAction, isPending] = useActionState(
    updateAccountState,
    {} as AccountFormState
  )

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="mb-6 text-lg font-medium text-gray-900 lg:text-2xl">
        General Settings
      </h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={formAction}>
              <Suspense fallback={<AccountForm state={state} />}>
                <AccountFormWithData state={state} />
              </Suspense>
              {state.error && (
                <p className="text-sm text-red-500">{state.error}</p>
              )}
              {state.success && (
                <p className="text-sm text-green-500">
                  {typeof state.success === 'string'
                    ? state.success
                    : (state.message ?? 'Account updated successfully.')}
                </p>
              )}
              <Button
                type="submit"
                className="bg-orange-500 text-white hover:bg-orange-600"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <WalletLinkCard />
      </div>
    </section>
  )
}
