/**
 * Shared validation utilities for grant submissions
 * Used by both client and server to ensure consistent validation
 */

/**
 * GitHub repository URL validation regex
 * Matches: https://github.com/username/repo or http://github.com/username/repo
 * Allows optional www. prefix and optional path segments
 */
export const GITHUB_URL_REGEX =
  /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+(\/.*)?$/i

/**
 * Validates a GitHub repository URL
 * @param url - The URL to validate
 * @returns true if valid GitHub repo URL, false otherwise
 */
export function isValidGitHubUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return true // Empty is allowed (optional field)
  }
  return GITHUB_URL_REGEX.test(url.trim())
}

/**
 * Validates that milestone amounts sum to total amount
 * @param totalAmount - The total funding amount
 * @param milestoneAmounts - Array of milestone amounts
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateMilestoneAmounts(
  totalAmount: string | number,
  milestoneAmounts: (string | number)[]
): { isValid: boolean; error?: string; milestonesTotal?: number } {
  const total =
    typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount

  if (isNaN(total) || total <= 0) {
    return {
      isValid: false,
      error: 'Total amount must be a positive number',
    }
  }

  const milestonesTotal: number = milestoneAmounts.reduce(
    (sum: number, amount) => {
      const parsedAmount: number =
        typeof amount === 'string' ? parseFloat(amount) : amount
      return sum + (isNaN(parsedAmount) ? 0 : parsedAmount)
    },
    0
  )

  // Allow for floating point precision errors
  const difference: number = Math.abs(milestonesTotal - total)

  if (difference > 0.01) {
    return {
      isValid: false,
      error: `The sum of milestone amounts ($${milestonesTotal.toFixed(2)}) must equal the total funding amount ($${total.toFixed(2)})`,
      milestonesTotal,
    }
  }

  return { isValid: true, milestonesTotal }
}

/**
 * Sanitizes a string by trimming whitespace
 * @param value - The string to sanitize
 * @returns Trimmed string
 */
export function sanitizeString(value: string): string {
  return value.trim()
}

/**
 * Converts a multiline requirements string to an array
 * Splits by newlines and filters empty lines
 * @param requirements - The requirements string
 * @returns Array of requirement strings
 */
export function parseRequirements(requirements: string): string[] {
  return requirements
    .split('\n')
    .map(r => r.trim())
    .filter(r => r.length > 0)
}
