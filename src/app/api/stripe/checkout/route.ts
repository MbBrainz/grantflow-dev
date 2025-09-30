import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Stripe features are temporarily disabled
  return NextResponse.json(
    { error: 'Stripe checkout is temporarily disabled' },
    { status: 503 }
  )
}
