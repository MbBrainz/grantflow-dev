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

type ValidatedActionFunction<TInput, TOutput extends ActionState> = (
  data: TInput,
  formData: FormData
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
    _prevState: ActionState,
    formData: FormData
  ): Promise<TOutput | { error: string }> => {
    const result = schema.safeParse(Object.fromEntries(formData))
    if (!result.success) {
      return { error: result.error?.issues[0]?.message ?? 'Validation failed' }
    }

    return action(
      result.data as TSchema extends {
        safeParse: (
          data: unknown
        ) => { success: true; data: infer TData } | { success: false }
      }
        ? TData
        : never,
      formData
    )
  }
}

type ValidatedActionWithUserFunction<TInput, TOutput extends ActionState> = (
  data: TInput,
  formData: FormData,
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
    _prevState: ActionState,
    formData: FormData
  ): Promise<TOutput | { error: string }> => {
    const user = await getUser()
    if (!user) {
      throw new Error('User is not authenticated')
    }

    const result = schema.safeParse(Object.fromEntries(formData))
    if (!result.success) {
      return { error: result.error?.issues[0]?.message ?? 'Validation failed' }
    }

    return action(
      result.data as TSchema extends {
        safeParse: (
          data: unknown
        ) => { success: true; data: infer TData } | { success: false }
      }
        ? TData
        : never,
      formData,
      user
    )
  }
}

// Legacy function for backwards compatibility - now just returns user
export function withTeam<T>(
  action: (formData: FormData, user: User | null) => Promise<T>
) {
  return async (formData: FormData) => {
    const user = await getUser()
    return action(formData, user)
  }
}
