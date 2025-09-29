'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { useToast } from '@/lib/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface SubmitButtonProps {
  onSuccess?: () => void
  successMessage?: string
  redirectTo?: string
  children?: React.ReactNode
}

export function SubmitButton({
  onSuccess,
  successMessage = 'Success!',
  redirectTo,
  children,
}: SubmitButtonProps) {
  const { pending } = useFormStatus()
  const { toast } = useToast()
  const router = useRouter()

  const handleSuccess = () => {
    // Show success toast
    toast({
      title: 'Success!',
      description: successMessage,
      variant: 'success',
    })

    // Call custom success handler if provided
    if (onSuccess) {
      onSuccess()
    }

    // Redirect if specified
    if (redirectTo) {
      setTimeout(() => {
        router.push(redirectTo)
      }, 1000)
    }
  }

  return (
    <Button
      type="submit"
      disabled={pending}
      variant="outline"
      className="w-full rounded-full"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children || (
          <>
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )
      )}
    </Button>
  )
}
