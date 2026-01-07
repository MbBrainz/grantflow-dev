'use client'

import { CircleIcon, Home, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { signOut } from '@/app/(login)/actions'
import { ClientLunoKitProvider } from '@/components/providers/lunokit-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PolkadotChainSelector } from '@/components/wallet/polkadot-chain-selector'
import { PolkadotWalletSelector } from '@/components/wallet/polkadot-wallet-selector'
import type { User } from '@/lib/db/schema'
import { fetcher } from '@/lib/utils'

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: user } = useSWR<User>('/api/user', fetcher<User>)
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    await mutate('/api/user').catch(err => {
      console.error('[UserMenu]: Error mutating user', err)
    })
    router.push('/')
  }

  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Pricing
        </Link>
        <Button asChild className="rounded-full">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </>
    )
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="size-9 cursor-pointer">
          <AvatarImage
            src={user.avatarUrl ?? undefined}
            alt={user.name ?? ''}
          />
          <AvatarFallback>
            {(user.name ?? user.email ?? 'U')
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <CircleIcon className="h-6 w-6 text-orange-500" />
          <span className="ml-2 text-xl font-semibold text-gray-900">
            GRANTFLOW
          </span>
        </Link>
        <div className="flex items-center space-x-4"></div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <PolkadotChainSelector />
          <PolkadotWalletSelector />
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLunoKitProvider>
      <section className="flex min-h-screen flex-col">
        <Header />
        {children}
      </section>
    </ClientLunoKitProvider>
  )
}
