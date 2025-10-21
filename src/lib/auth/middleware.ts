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
    data: TSchema extends {
      safeParse: (
        data: unknown
      ) => { success: true; data: infer TData } | { success: false }
    }
      ? TData
      : never
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

// ✅ NEW: For useActionState compatibility (non-authenticated)
type ValidatedActionStateFunction<TInput, TState extends ActionState> = (
  data: TInput
) => Promise<TState>

export function validatedActionState<
  TSchema extends ZodLike,
  TState extends ActionState,
>(
  schema: TSchema,
  action: ValidatedActionStateFunction<
    TSchema extends {
      safeParse: (
        data: unknown
      ) => { success: true; data: infer TData } | { success: false }
    }
      ? TData
      : never,
    TState
  >
) {
  return async (prevState: TState, formData: FormData): Promise<TState> => {
    // Convert FormData to object
    const data = Object.fromEntries(formData.entries())

    // 🛡️ Validation
    const result = schema.safeParse(data)
    if (!result.success) {
      console.error('[validatedActionState]: Validation failed', result.error)
      return {
        ...prevState,
        error: result.error?.issues[0]?.message ?? 'Validation failed',
      } as TState
    }

    // ✅ Execute action with validated data
    try {
      return await action(
        result.data as TSchema extends {
          safeParse: (
            data: unknown
          ) => { success: true; data: infer TData } | { success: false }
        }
          ? TData
          : never
      )
    } catch (error) {
      console.error('[validatedActionState]: Action failed', error)
      return {
        ...prevState,
        error: error instanceof Error ? error.message : 'An error occurred',
      } as TState
    }
  }
}

// ✅ NEW: For useActionState compatibility (authenticated)
type ValidatedActionWithUserStateFunction<
  TInput,
  TState extends ActionState,
> = (data: TInput, user: User) => Promise<TState>

export function validatedActionWithUserState<
  TSchema extends ZodLike,
  TState extends ActionState,
>(
  schema: TSchema,
  action: ValidatedActionWithUserStateFunction<
    TSchema extends {
      safeParse: (
        data: unknown
      ) => { success: true; data: infer TData } | { success: false }
    }
      ? TData
      : never,
    TState
  >
) {
  return async (prevState: TState, formData: FormData): Promise<TState> => {
    // 🛡️ Authentication
    const user = await getUser()
    if (!user) {
      return {
        ...prevState,
        error: 'User is not authenticated',
      } as TState
    }

    // Convert FormData to object
    const data = Object.fromEntries(formData.entries())

    // 🛡️ Validation
    const result = schema.safeParse(data)
    if (!result.success) {
      console.error(
        '[validatedActionWithUserState]: Validation failed',
        result.error
      )
      return {
        ...prevState,
        error: result.error?.issues[0]?.message ?? 'Validation failed',
      } as TState
    }

    // ✅ Execute action with validated data and user
    try {
      return await action(
        result.data as TSchema extends {
          safeParse: (
            data: unknown
          ) => { success: true; data: infer TData } | { success: false }
        }
          ? TData
          : never,
        user
      )
    } catch (error) {
      console.error('[validatedActionWithUserState]: Action failed', error)
      return {
        ...prevState,
        error: error instanceof Error ? error.message : 'An error occurred',
      } as TState
    }
  }
}
