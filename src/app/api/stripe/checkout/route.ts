import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function GET(_request: NextRequest) {
  // Stripe features are temporarily disabled
  return NextResponse.json(
    { error: 'Stripe checkout is temporarily disabled' },
    { status: 503 }
  )
}
