import { clsx, type ClassValue } from 'clsx'
import type { FetcherResponse } from 'swr/_internal'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Typed fetcher function for SWR
 * Properly types the response from fetch().json()
 *
 * Usage with type inference:
 *   const { data } = useSWR<User>('/api/user', (url) => fetcher<User>(url))
 *
 * Or with type assertion (simpler):
 *   const { data } = useSWR<User>('/api/user', fetcher as (url: string) => Promise<User>)
 */
export async function fetcher<T extends FetcherResponse<unknown>>(
  url: string
): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`)
  }
  return res.json() as T
}
