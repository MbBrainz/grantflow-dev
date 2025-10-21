import type { User } from '@/lib/db/schema'
import { getUser } from '@/lib/db/queries'

export interface ActionState {
  error?: string
  success?: boolean
  message?: string
  [key: string]: unknown
}

interface ZodLike {
  safeParse: (data: unknown) => {
    success: boolean
    data?: unknown
    error?: { issues: { message: string }[] }
  }
}

// ✅ NEW: Non-authenticated actions accept plain objects
type ValidatedActionFunction<TInput, TOutput extends ActionState> = (
  data: TInput
) => Promise<TOutput>

export function validatedAction<
  TSchema extends ZodLike,
  TOutput extends ActionState,
>(
  schema: TSchema,
  action: ValidatedActionFunction<
    TSchema extends {
      safeParse: (
        data: unknown
      ) => { success: true; data: infer TData } | { success: false }
    }
      ? TData
      : never,
    TOutput
  >
) {
  return async (
    data: Record<string, unknown>
  ): Promise<TOutput | { error: string }> => {
    // 🛡️ Validation
    const result = schema.safeParse(data)
    if (!result.success) {
      console.error('[validatedAction]: Validation failed', result.error)
      return { error: result.error?.issues[0]?.message ?? 'Validation failed' }
    }

    // ✅ Execute action with validated data
    return action(
      result.data as TSchema extends {
        safeParse: (
          data: unknown
        ) => { success: true; data: infer TData } | { success: false }
      }
        ? TData
        : never
    )
  }
}

// ✅ NEW: Authenticated actions accept plain objects
type ValidatedActionWithUserFunction<TInput, TOutput extends ActionState> = (
  data: TInput,
  user: User
) => Promise<TOutput>

export function validatedActionWithUser<
  TSchema extends ZodLike,
  TOutput extends ActionState,
>(
  schema: TSchema,
  action: ValidatedActionWithUserFunction<
    TSchema extends {
      safeParse: (
        data: unknown
      ) => { success: true; data: infer TData } | { success: false }
    }
      ? TData
      : never,
    TOutput
  >
) {
  return async (
    data: Record<string, unknown>
  ): Promise<TOutput | { error: string }> => {
    // 🛡️ Authentication
    const user = await getUser()
    if (!user) {
      throw new Error('User is not authenticated')
    }

    // 🛡️ Validation
    const result = schema.safeParse(data)
    if (!result.success) {
      console.error(
        '[validatedActionWithUser]: Validation failed',
        result.error
      )
      return { error: result.error?.issues[0]?.message ?? 'Validation failed' }
    }

    // ✅ Execute action with validated data and user
    return action(
      result.data as TSchema extends {
        safeParse: (
          data: unknown
        ) => { success: true; data: infer TData } | { success: false }
      }
        ? TData
        : never,
      user
    )
  }
}
