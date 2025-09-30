import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function POST(_request: NextRequest) {
  // Stripe features are temporarily disabled
  return NextResponse.json(
    { error: 'Stripe webhooks are temporarily disabled' },
    { status: 503 }
  )
}
