'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@/lib/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface AsyncButtonProps {
  onClick?: () => void | Promise<void>
  /** For use in form actions: when true, shows loading state */
  pendingExternal?: boolean
  /** When true, triggers success feedback (toast + redirect) */
  succeeded?: boolean
  successTitle?: string
  successMessage?: string
  redirectTo?: string
  /** Button content when idle */
  children?: React.ReactNode
  /** Optional content while loading */
  loadingContent?: React.ReactNode
  /** Variant and className passthrough */
  variant?: React.ComponentProps<typeof Button>['variant']
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function AsyncButton({
  onClick,
  pendingExternal,
  succeeded,
  successTitle = 'Success!',
  successMessage,
  redirectTo,
  children,
  loadingContent,
  variant = 'default',
  className,
  disabled,
  type = 'button',
}: AsyncButtonProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [pendingInternal, setPendingInternal] = useState(false)
  const hasHandledSuccessRef = useRef(false)

  const pending = useMemo(
    () => Boolean(pendingExternal ?? pendingInternal),
    [pendingExternal, pendingInternal]
  )

  const handleClick = useCallback(async () => {
    if (!onClick) return
    try {
      setPendingInternal(true)
      await onClick()
    } finally {
      setPendingInternal(false)
    }
  }, [onClick])

  const handleSuccess = useCallback(() => {
    if (hasHandledSuccessRef.current) return
    hasHandledSuccessRef.current = true

    toast({
      title: successTitle,
      description: successMessage,
      variant: 'success',
    })

    if (redirectTo) {
      setTimeout(() => {
        router.push(redirectTo)
      }, 1000)
    }
  }, [redirectTo, router, successMessage, successTitle, toast])

  useEffect(() => {
    if (succeeded) {
      handleSuccess()
    }
  }, [succeeded, handleSuccess])

  return (
    <Button
      type={type}
      onClick={onClick ? handleClick : undefined}
      disabled={disabled ?? pending}
      variant={variant}
      className={className}
    >
      {pending
        ? (loadingContent ?? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ))
        : children}
    </Button>
  )
}

export default AsyncButton
