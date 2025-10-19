/**
 * Shared validation helpers for Zod schemas
 * These utilities help reduce duplication across server actions
 */

import { z } from 'zod'

/**
 * Creates a Zod transform that parses a JSON string into a typed array
 * Useful for handling JSON arrays in FormData
 *
 * @param fieldName - Name of the field (used in error messages)
 * @param minLength - Minimum required array length (default: 0)
 * @returns Zod transform that validates and parses JSON arrays
 *
 * @example
 * const schema = z.object({
 *   tags: jsonArrayTransform<string>('tags', 1),
 *   ids: jsonArrayTransform<number>('ids'),
 * })
 */
export const jsonArrayTransform = <T>(fieldName: string, minLength = 0) =>
  z.string().transform((str, ctx) => {
    try {
      const parsed: unknown = JSON.parse(str)

      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldName} must be an array`,
        })
        return z.NEVER
      }

      if (minLength > 0 && parsed.length < minLength) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldName} must have at least ${minLength} item${minLength > 1 ? 's' : ''}`,
        })
        return z.NEVER
      }

      return parsed as T[]
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid JSON for ${fieldName}`,
      })
      return z.NEVER
    }
  })

/**
 * Formats a Zod validation error into a user-friendly message
 * Returns the first error with its path if available
 *
 * @param error - ZodError from failed validation
 * @returns Formatted error message string
 *
 * @example
 * const result = schema.safeParse(data)
 * if (!result.success) {
 *   return { error: formatZodError(result.error) }
 * }
 */
export function formatZodError(error: z.ZodError): string {
  const firstError = error.issues[0]
  const errorPath = firstError.path.join('.')
  return errorPath ? `${errorPath}: ${firstError.message}` : firstError.message
}

/**
 * Creates a Zod transform that parses a JSON string into a typed object
 * Useful for handling JSON objects in FormData
 *
 * @param fieldName - Name of the field (used in error messages)
 * @returns Zod transform that validates and parses JSON objects
 *
 * @example
 * const schema = z.object({
 *   metadata: jsonObjectTransform<{ key: string }>('metadata'),
 * })
 */
export const jsonObjectTransform = <T extends Record<string, unknown>>(
  fieldName: string
) =>
  z.string().transform((str, ctx) => {
    try {
      const parsed: unknown = JSON.parse(str)

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldName} must be an object`,
        })
        return z.NEVER
      }

      return parsed as T
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid JSON for ${fieldName}`,
      })
      return z.NEVER
    }
  })
