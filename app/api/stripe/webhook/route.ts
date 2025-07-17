import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Stripe features are temporarily disabled
  return NextResponse.json(
    { error: 'Stripe webhooks are temporarily disabled' },
    { status: 503 }
  );
}
