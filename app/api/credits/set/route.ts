import { NextRequest, NextResponse } from 'next/server';
import { setCreditsCounter } from '@/lib/credits';

/**
 * POST /api/credits/set
 * Définit manuellement le compteur de crédits WorldTides
 * Body: { remaining: 19919 }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { remaining } = body;

    if (typeof remaining !== 'number' || remaining < 0 || remaining > 20000) {
      return NextResponse.json({
        error: 'Invalid remaining value',
        message: 'remaining must be a number between 0 and 20000',
      }, { status: 400 });
    }

    await setCreditsCounter(remaining);

    return NextResponse.json({
      success: true,
      message: `Credits counter set to ${remaining}`,
      credits: {
        remaining,
        used: 20000 - remaining,
        limit: 20000,
        percentage: Math.round((remaining / 20000) * 100),
      },
    });

  } catch (error: any) {
    console.error('[CREDITS-SET] Error:', error);
    return NextResponse.json({
      error: 'Failed to set credits counter',
      message: error.message,
    }, { status: 500 });
  }
}
