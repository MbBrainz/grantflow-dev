/**
 * Price Feed for USD to Token Conversion
 *
 * This module handles conversion between USD (used for milestone amounts in the database)
 * and native tokens (PAS for Paseo testnet, DOT for Polkadot mainnet).
 *
 * The conversion happens at payout time when a milestone is approved:
 * - Milestones are defined and stored in USD
 * - When paying out, the USD amount is converted to tokens using the current price
 * - This protects grantees from token price volatility during project execution
 *
 * Currently uses a mock price feed with 1:1 ratio for testing.
 * In production, this should integrate with:
 * - Chainlink oracles
 * - CoinGecko API
 * - Subscan price data
 * - On-chain price feeds
 */

import type { NetworkType } from './address'

/**
 * Token price information
 */
export interface TokenPrice {
  /** Token symbol (e.g., 'PAS', 'DOT', 'KSM') */
  symbol: string
  /** Price in USD */
  priceUsd: number
  /** Timestamp when price was fetched */
  timestamp: Date
  /** Source of the price data */
  source: 'mock' | 'coingecko' | 'chainlink' | 'subscan'
}

/**
 * Conversion result from USD to tokens
 */
export interface ConversionResult {
  /** Amount in USD (input) */
  amountUsd: number
  /** Amount in tokens (output) */
  amountTokens: number
  /** Amount in smallest unit (planck) */
  amountPlanck: bigint
  /** Price used for conversion */
  price: TokenPrice
  /** Token decimals used */
  decimals: number
}

/**
 * Mock prices for testing (1 USD = 1 token)
 * In production, replace with actual price feeds
 */
const MOCK_PRICES: Record<string, number> = {
  PAS: 1.0, // Paseo testnet token - 1:1 with USD for testing
  DOT: 1.0, // Polkadot - would be ~$7-10 in production
  KSM: 1.0, // Kusama - would be ~$25-30 in production
}

/**
 * Token decimals for each network
 */
const TOKEN_DECIMALS: Record<string, number> = {
  PAS: 10, // Paseo uses same decimals as Polkadot
  DOT: 10, // Polkadot: 1 DOT = 10^10 planck
  KSM: 12, // Kusama: 1 KSM = 10^12 planck
}

/**
 * Get the token symbol for a network
 */
export function getTokenSymbol(network: NetworkType): string {
  switch (network) {
    case 'polkadot':
      return 'DOT'
    case 'kusama':
      return 'KSM'
    case 'paseo':
    default:
      return 'PAS'
  }
}

/**
 * Get the token decimals for a network
 */
export function getTokenDecimals(network: NetworkType): number {
  const symbol = getTokenSymbol(network)
  return TOKEN_DECIMALS[symbol] ?? 10
}

/**
 * Get the current token price
 *
 * Currently returns mock prices for testing.
 * TODO: Integrate with real price feeds for production
 *
 * @param network - The network to get price for
 * @returns Token price information
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function getTokenPrice(network: NetworkType): Promise<TokenPrice> {
  const symbol = getTokenSymbol(network)
  const priceUsd = MOCK_PRICES[symbol] ?? 1.0

  console.log('[getTokenPrice]: Using mock price', {
    network,
    symbol,
    priceUsd,
  })

  return {
    symbol,
    priceUsd,
    timestamp: new Date(),
    source: 'mock',
  }
}

/**
 * Convert USD amount to tokens
 *
 * This is the main conversion function used at payout time.
 * Milestones are stored in USD, and this converts to the native token amount.
 *
 * @param amountUsd - Amount in USD (e.g., 25 for $25)
 * @param network - Target network for the token
 * @returns Conversion result with token amount
 *
 * @example
 * // Convert $25 milestone to PAS tokens
 * const result = await convertUsdToTokens(25, 'paseo')
 * // result.amountTokens = 25 (with 1:1 mock price)
 * // result.amountPlanck = 250000000000n (25 * 10^10)
 */
export async function convertUsdToTokens(
  amountUsd: number,
  network: NetworkType
): Promise<ConversionResult> {
  const price = await getTokenPrice(network)
  const decimals = getTokenDecimals(network)

  // Convert USD to tokens: tokens = usd / pricePerToken
  const amountTokens = amountUsd / price.priceUsd

  // Convert to planck (smallest unit)
  // amountPlanck = amountTokens * 10^decimals
  const amountPlanck = BigInt(Math.floor(amountTokens * 10 ** decimals))

  console.log('[convertUsdToTokens]: Conversion result', {
    amountUsd,
    amountTokens,
    amountPlanck: amountPlanck.toString(),
    priceUsd: price.priceUsd,
    network,
  })

  return {
    amountUsd,
    amountTokens,
    amountPlanck,
    price,
    decimals,
  }
}

/**
 * Convert tokens to USD amount
 *
 * Useful for displaying token balances in USD equivalent.
 *
 * @param amountPlanck - Amount in smallest unit (planck)
 * @param network - Network the tokens are on
 * @returns USD equivalent
 */
export async function convertTokensToUsd(
  amountPlanck: bigint,
  network: NetworkType
): Promise<{ amountUsd: number; amountTokens: number; price: TokenPrice }> {
  const price = await getTokenPrice(network)
  const decimals = getTokenDecimals(network)

  // Convert planck to tokens
  const amountTokens = Number(amountPlanck) / 10 ** decimals

  // Convert tokens to USD
  const amountUsd = amountTokens * price.priceUsd

  return {
    amountUsd,
    amountTokens,
    price,
  }
}

/**
 * Format a token amount for display
 *
 * @param amountPlanck - Amount in planck
 * @param network - Network for symbol and decimals
 * @param includeSymbol - Whether to include the token symbol
 * @returns Formatted string (e.g., "25.5 PAS")
 */
export function formatTokenAmount(
  amountPlanck: bigint,
  network: NetworkType,
  includeSymbol = true
): string {
  const decimals = getTokenDecimals(network)
  const symbol = getTokenSymbol(network)

  const divisor = 10 ** decimals
  const tokens = Number(amountPlanck) / divisor

  // Format with appropriate decimal places
  const formatted = tokens.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })

  return includeSymbol ? `${formatted} ${symbol}` : formatted
}

/**
 * Get conversion info for display purposes
 *
 * Shows both USD and token amounts for transparency.
 *
 * @param amountUsd - Amount in USD
 * @param network - Target network
 * @returns Display string (e.g., "$25 USD (~25 PAS)")
 */
export async function getConversionDisplay(
  amountUsd: number,
  network: NetworkType
): Promise<string> {
  const result = await convertUsdToTokens(amountUsd, network)
  const symbol = getTokenSymbol(network)

  const usdFormatted = amountUsd.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  })

  const tokenFormatted = result.amountTokens.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })

  return `${usdFormatted} (~${tokenFormatted} ${symbol})`
}

// ============================================================================
// Price Feed Configuration (for future production use)
// ============================================================================

/**
 * Price feed configuration
 */
export interface PriceFeedConfig {
  /** Primary source for prices */
  primarySource: 'mock' | 'coingecko' | 'chainlink'
  /** Fallback source if primary fails */
  fallbackSource?: 'mock' | 'coingecko'
  /** How often to refresh prices (ms) */
  refreshInterval: number
  /** Maximum age of cached price before refresh (ms) */
  maxCacheAge: number
  /** Custom price overrides for testing */
  customPrices?: Record<string, number>
}

/**
 * Default price feed configuration
 */
export const DEFAULT_PRICE_FEED_CONFIG: PriceFeedConfig = {
  primarySource: 'mock',
  refreshInterval: 60_000, // 1 minute
  maxCacheAge: 300_000, // 5 minutes
  customPrices: MOCK_PRICES,
}

/**
 * Update mock prices for testing
 *
 * Allows tests to set custom price ratios.
 *
 * @param prices - Map of token symbol to USD price
 *
 * @example
 * // Test with DOT at $7
 * setMockPrices({ DOT: 7.0, PAS: 1.0 })
 */
export function setMockPrices(prices: Record<string, number>): void {
  Object.assign(MOCK_PRICES, prices)
  console.log('[setMockPrices]: Updated mock prices', MOCK_PRICES)
}

/**
 * Reset mock prices to defaults (1:1 ratio)
 */
export function resetMockPrices(): void {
  MOCK_PRICES.PAS = 1.0
  MOCK_PRICES.DOT = 1.0
  MOCK_PRICES.KSM = 1.0
  console.log('[resetMockPrices]: Reset to default prices', MOCK_PRICES)
}

// ============================================================================
// Price Info Formatting for On-Chain Remarks
// ============================================================================

/**
 * Price information formatted for on-chain remark
 */
export interface PriceRemarkInfo {
  /** Price in USD (e.g., "1.00") */
  priceUsd: string
  /** ISO date string when price was fetched */
  priceDate: string
  /** Human-readable date (e.g., "2024-01-15 14:30 UTC") */
  priceDateFormatted: string
  /** Source of the price data */
  priceSource: string
  /** Full remark string for on-chain inclusion */
  remarkString: string
}

/**
 * Format price info for on-chain remark
 *
 * Creates a structured string that can be included in blockchain transactions
 * to provide transparency about the price conversion used.
 *
 * @param price - The token price information
 * @param milestoneId - Milestone ID for reference
 * @param milestoneTitle - Optional milestone title
 * @returns Formatted price info for on-chain remark
 *
 * @example
 * const remark = formatPriceForRemark(price, 42, "API Integration")
 * // remarkString: "grantflow:m42:API Integration|price:1.00USD|date:2024-01-15T14:30:00Z|src:coingecko"
 */
export function formatPriceForRemark(
  price: TokenPrice,
  milestoneId: number,
  milestoneTitle?: string
): PriceRemarkInfo {
  const priceUsd = price.priceUsd.toFixed(4)
  const priceDate = price.timestamp.toISOString()
  const priceDateFormatted = `${price.timestamp.toISOString().replace('T', ' ').slice(0, 19)} UTC`
  const priceSource = price.source

  // Build the remark string with milestone info and price data
  // Format: grantflow:m{id}:{title}|price:{price}USD|date:{iso}|src:{source}
  const titlePart = milestoneTitle
    ? `:${milestoneTitle.slice(0, 50)}` // Limit title to 50 chars for on-chain
    : ''

  const remarkString = [
    `grantflow:m${milestoneId}${titlePart}`,
    `price:${priceUsd}USD`,
    `date:${priceDate}`,
    `src:${priceSource}`,
  ].join('|')

  return {
    priceUsd,
    priceDate,
    priceDateFormatted,
    priceSource,
    remarkString,
  }
}

/**
 * Extended conversion result with remark info
 */
export interface ConversionResultWithRemark extends ConversionResult {
  /** Price info formatted for on-chain remark */
  remarkInfo: PriceRemarkInfo
}

/**
 * Convert USD amount to tokens with remark info
 *
 * Same as convertUsdToTokens but also generates the on-chain remark info.
 *
 * @param amountUsd - Amount in USD
 * @param network - Target network
 * @param milestoneId - Milestone ID for the remark
 * @param milestoneTitle - Optional milestone title for the remark
 * @returns Conversion result with remark info
 */
export async function convertUsdToTokensWithRemark(
  amountUsd: number,
  network: NetworkType,
  milestoneId: number,
  milestoneTitle?: string
): Promise<ConversionResultWithRemark> {
  const result = await convertUsdToTokens(amountUsd, network)
  const remarkInfo = formatPriceForRemark(
    result.price,
    milestoneId,
    milestoneTitle
  )

  console.log('[convertUsdToTokensWithRemark]: Conversion with remark', {
    amountUsd,
    amountTokens: result.amountTokens,
    remarkString: remarkInfo.remarkString,
  })

  return {
    ...result,
    remarkInfo,
  }
}
