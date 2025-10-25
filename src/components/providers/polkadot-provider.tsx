'use client'

/**
 * Polkadot Wallet Provider
 *
 * Manages connection to Polkadot wallet extensions (Talisman, Polkadot.js, SubWallet, etc.)
 * Provides wallet context to the application for signing transactions
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { PolkadotSigner } from 'polkadot-api'

// Extension types
export type WalletExtension = 'polkadot-js' | 'talisman' | 'subwallet' | 'nova'

export interface InjectedAccount {
  address: string
  name?: string
  source: WalletExtension
}

export interface InjectedExtension {
  name: WalletExtension
  version: string
  accounts: InjectedAccount[]
}

interface PolkadotContextValue {
  // Wallet connection state
  isConnecting: boolean
  isConnected: boolean
  error: string | null

  // Available extensions
  availableExtensions: InjectedExtension[]

  // Selected account
  selectedAccount: InjectedAccount | null
  selectedSigner: PolkadotSigner | null

  // Actions
  connectWallet: (extensionName: WalletExtension) => Promise<void>
  selectAccount: (account: InjectedAccount) => Promise<void>
  disconnectWallet: () => void
}

const PolkadotContext = createContext<PolkadotContextValue | null>(null)

export function usePolkadot() {
  const context = useContext(PolkadotContext)
  if (!context) {
    throw new Error('usePolkadot must be used within PolkadotProvider')
  }
  return context
}

interface PolkadotProviderProps {
  children: ReactNode
}

/**
 * Check if extension is installed
 * Extensions inject themselves into window.injectedWeb3
 *
 * @note External wallet extensions inject themselves into window with untyped APIs
 * We suppress TypeScript safety warnings for these external integrations
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/prefer-nullish-coalescing */
function getInjectedExtensions(): InjectedExtension[] {
  if (typeof window === 'undefined') return []

  const injected = (window as any).injectedWeb3
  if (!injected) return []

  const extensions: InjectedExtension[] = []

  // Check for common extensions
  const extensionNames: WalletExtension[] = [
    'polkadot-js',
    'talisman',
    'subwallet',
    'nova',
  ]

  for (const name of extensionNames) {
    if (injected[name]) {
      extensions.push({
        name,
        version: injected[name].version || 'unknown',
        accounts: [],
      })
    }
  }

  return extensions
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/prefer-nullish-coalescing */

/**
 * Get accounts from an extension
 *
 * @note External wallet extensions have untyped APIs - suppressing safety warnings
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/prefer-optional-chain */
async function getAccountsFromExtension(
  extensionName: WalletExtension
): Promise<InjectedAccount[]> {
  if (typeof window === 'undefined') return []

  const injected = (window as any).injectedWeb3
  if (!injected || !injected[extensionName]) {
    throw new Error(`Extension ${extensionName} not found`)
  }

  try {
    const extension = await injected[extensionName].enable('GrantFlow')

    if (!extension || !extension.accounts) {
      throw new Error('Failed to enable extension')
    }

    const accounts = await extension.accounts.get()

    return accounts.map((account: any) => ({
      address: account.address,
      name: account.name,
      source: extensionName,
    }))
  } catch (error) {
    console.error(
      `[polkadot-provider]: Failed to get accounts from ${extensionName}`,
      error
    )
    throw error
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/prefer-optional-chain */

export function PolkadotProvider({ children }: PolkadotProviderProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableExtensions, setAvailableExtensions] = useState<
    InjectedExtension[]
  >([])
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccount | null>(null)
  const [selectedSigner, setSelectedSigner] = useState<PolkadotSigner | null>(
    null
  )

  // Detect available extensions on mount
  useEffect(() => {
    const detectExtensions = () => {
      const extensions = getInjectedExtensions()
      console.log('[polkadot-provider]: Detected extensions', {
        count: extensions.length,
        names: extensions.map(e => e.name),
      })
      setAvailableExtensions(extensions)
    }

    // Check immediately
    detectExtensions()

    // Also check after a short delay (extensions might load async)
    const timer = setTimeout(detectExtensions, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Restore previous connection from localStorage
  useEffect(() => {
    const restore = async () => {
      const saved = localStorage.getItem('polkadot-wallet')
      if (!saved) return

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const {
          extensionName,
          accountAddress,
        }: { extensionName: WalletExtension; accountAddress: string } =
          JSON.parse(saved)
        const accounts = await getAccountsFromExtension(extensionName)
        const account = accounts.find(a => a.address === accountAddress)

        if (account) {
          const signer = await createSignerForAccount(account)
          setSelectedAccount(account)
          setSelectedSigner(signer)
          setIsConnected(true)
          console.log('[polkadot-provider]: Restored connection', {
            extension: extensionName,
            address: accountAddress,
          })
        }
      } catch (error) {
        console.error(
          '[polkadot-provider]: Failed to restore connection',
          error
        )
        localStorage.removeItem('polkadot-wallet')
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    restore()
  }, [])

  const connectWallet = useCallback(async (extensionName: WalletExtension) => {
    setIsConnecting(true)
    setError(null)

    try {
      console.log('[polkadot-provider]: Connecting to', extensionName)

      const accounts = await getAccountsFromExtension(extensionName)

      if (accounts.length === 0) {
        throw new Error('No accounts found in extension')
      }

      // Update available extensions with accounts
      setAvailableExtensions(prev =>
        prev.map(ext =>
          ext.name === extensionName ? { ...ext, accounts } : ext
        )
      )

      // Auto-select first account
      const firstAccount = accounts[0]
      const signer = await createSignerForAccount(firstAccount)

      setSelectedAccount(firstAccount)
      setSelectedSigner(signer)
      setIsConnected(true)

      // Save to localStorage
      localStorage.setItem(
        'polkadot-wallet',
        JSON.stringify({
          extensionName,
          accountAddress: firstAccount.address,
        })
      )

      console.log('[polkadot-provider]: Connected successfully', {
        extension: extensionName,
        accountCount: accounts.length,
        selectedAddress: firstAccount.address,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(message)
      console.error('[polkadot-provider]: Connection failed', err)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const selectAccount = useCallback(async (account: InjectedAccount) => {
    try {
      console.log('[polkadot-provider]: Selecting account', account.address)

      const signer = await createSignerForAccount(account)
      setSelectedAccount(account)
      setSelectedSigner(signer)

      // Update localStorage
      localStorage.setItem(
        'polkadot-wallet',
        JSON.stringify({
          extensionName: account.source,
          accountAddress: account.address,
        })
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to select account'
      setError(message)
      console.error('[polkadot-provider]: Failed to select account', err)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    console.log('[polkadot-provider]: Disconnecting wallet')
    setSelectedAccount(null)
    setSelectedSigner(null)
    setIsConnected(false)
    setError(null)
    localStorage.removeItem('polkadot-wallet')
  }, [])

  const value: PolkadotContextValue = {
    isConnecting,
    isConnected,
    error,
    availableExtensions,
    selectedAccount,
    selectedSigner,
    connectWallet,
    selectAccount,
    disconnectWallet,
  }

  return (
    <PolkadotContext.Provider value={value}>
      {children}
    </PolkadotContext.Provider>
  )
}

/**
 * Create a Polkadot signer for an account
 *
 * @note External wallet extensions have untyped APIs - suppressing safety warnings
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/prefer-optional-chain */
async function createSignerForAccount(
  account: InjectedAccount
): Promise<PolkadotSigner> {
  if (typeof window === 'undefined') {
    throw new Error('Cannot create signer on server side')
  }

  const injected = (window as any).injectedWeb3
  if (!injected || !injected[account.source]) {
    throw new Error(`Extension ${account.source} not available`)
  }

  const extension = await injected[account.source].enable('GrantFlow')

  if (!extension || !extension.signer) {
    throw new Error('Failed to get signer from extension')
  }

  // The extension's signer should be compatible with polkadot-api
  // We just need to ensure it has the right interface
  const signer = extension.signer

  // Add the required methods if they don't exist
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (!signer.signTx) {
    signer.signTx = async (callData: Uint8Array, signedExtensions: Record<string, {
      identifier: string;
      value: Uint8Array;
      additionalSigned: Uint8Array;
    }>, metadata: Uint8Array, atBlockNumber: number, _hasher?: (data: Uint8Array) => Uint8Array) => {
      console.log('[polkadot-provider]: Signing transaction via signTx', {
        address: account.address,
        callDataLength: callData.length,
        atBlockNumber,
      })

      try {
        // Use the extension's signer to sign the transaction
        const signature = await extension.signer.signRaw({
          address: account.address,
          data: Array.from(callData).map(byte => byte.toString(16).padStart(2, '0')).join(''),
        })

        if (!signature || !signature.signature) {
          throw new Error('No signature returned from extension')
        }

        // Convert hex signature to Uint8Array
        const signatureHex = String(signature.signature).replace('0x', '')
        const signatureBytes = new Uint8Array(signatureHex.length / 2)
        for (let i = 0; i < signatureHex.length; i += 2) {
          signatureBytes[i / 2] = parseInt(signatureHex.substr(i, 2), 16)
        }

        console.log('[polkadot-provider]: Transaction signed via signTx', {
          address: account.address,
          signatureLength: signatureBytes.length,
        })

        return signatureBytes
      } catch (error) {
        console.error('[polkadot-provider]: Transaction signing failed', error)
        throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (!signer.signBytes) {
    signer.signBytes = async (bytes: Uint8Array) => {
      console.log('[polkadot-provider]: Signing bytes', {
        address: account.address,
        bytesLength: bytes.length,
      })

      try {
        // Use the extension's signer to sign the bytes
        const signature = await extension.signer.signRaw({
          address: account.address,
          data: Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join(''),
        })

        if (!signature || !signature.signature) {
          throw new Error('No signature returned from extension')
        }

        // Convert hex signature to Uint8Array
        const signatureHex = String(signature.signature).replace('0x', '')
        const signatureBytes = new Uint8Array(signatureHex.length / 2)
        for (let i = 0; i < signatureHex.length; i += 2) {
          signatureBytes[i / 2] = parseInt(signatureHex.substr(i, 2), 16)
        }

        console.log('[polkadot-provider]: Bytes signed', {
          address: account.address,
          signatureLength: signatureBytes.length,
        })

        return signatureBytes
      } catch (error) {
        console.error('[polkadot-provider]: Bytes signing failed', error)
        throw new Error(`Failed to sign bytes: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  // Ensure publicKey exists
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (!signer.publicKey) {
    signer.publicKey = new Uint8Array(32) // Placeholder
  }

  return signer as PolkadotSigner
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/prefer-optional-chain */
