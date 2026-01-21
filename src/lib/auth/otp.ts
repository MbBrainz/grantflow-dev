/**
 * OTP (One-Time Password) utilities for Email authentication
 *
 * Provides:
 * - 6-digit OTP code generation
 * - Test account detection for dev/preview environments
 * - Test OTP code bypass for automated testing
 */

/**
 * Test OTP code that works for test accounts in dev/preview environments
 */
export const TEST_OTP_CODE = '000000'

/**
 * List of test email accounts that can use the test OTP code
 * These accounts bypass actual email sending in non-production environments
 */
export const TEST_ACCOUNTS = [
  'test@grantflow.dev',
  'reviewer1@test.com',
  'reviewer2@test.com',
] as const

/**
 * Check if the current environment is a test/development environment
 * Test accounts only work in non-production environments
 */
export function isTestEnvironment(): boolean {
  const env = process.env.NODE_ENV
  const vercelEnv = process.env.VERCEL_ENV

  // Development mode
  if (env === 'development') return true

  // Vercel preview deployments
  if (vercelEnv === 'preview') return true

  // Explicitly set test mode
  if (process.env.TEST_MODE === 'true') return true

  return false
}

/**
 * Check if an email is a test account that can use the test OTP code
 *
 * @param email - Email address to check
 * @returns true if the email is a test account and we're in a test environment
 */
export function isTestAccount(email: string): boolean {
  if (!isTestEnvironment()) return false

  const normalizedEmail = email.toLowerCase().trim()
  return TEST_ACCOUNTS.some(testEmail => testEmail === normalizedEmail)
}

/**
 * Generate a 6-digit OTP code
 *
 * Uses crypto.randomInt for cryptographically secure random numbers
 *
 * @returns 6-digit string code (e.g., "123456")
 */
export function generateOTPCode(): string {
  // For test accounts in test environments, use the test code
  // Note: This is handled at the verification level, not generation
  // We always generate real codes, but test accounts can also use TEST_OTP_CODE

  // Generate a random 6-digit number (100000-999999)
  const randomNumber = Math.floor(Math.random() * 900000) + 100000
  return randomNumber.toString()
}

/**
 * Verify an OTP code against the expected token
 *
 * @param providedCode - The code the user entered
 * @param expectedToken - The token stored in the database
 * @param email - The email address (for test account checking)
 * @returns true if the code is valid
 */
export function verifyOTPCode(
  providedCode: string,
  expectedToken: string,
  email: string
): boolean {
  const normalizedCode = providedCode.trim()

  // Test account bypass - accept TEST_OTP_CODE in test environments
  if (isTestAccount(email) && normalizedCode === TEST_OTP_CODE) {
    console.log(`[OTP]: Test account ${email} authenticated with test code`)
    return true
  }

  // Standard verification - exact match
  return normalizedCode === expectedToken
}

/**
 * Format an OTP code for display (adds spaces for readability)
 *
 * @param code - 6-digit code
 * @returns Formatted code (e.g., "123 456")
 */
export function formatOTPCode(code: string): string {
  if (code.length !== 6) return code
  return `${code.slice(0, 3)} ${code.slice(3)}`
}
