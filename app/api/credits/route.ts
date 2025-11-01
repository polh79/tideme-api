import { NextResponse } from 'next/server';
import { getCreditsCounter } from '@/lib/credits';

/**
 * GET /api/credits
 * Récupère le compteur manuel de crédits WorldTides
 * ZERO appel API - lecture depuis Redis uniquement
 */
export async function GET() {
  try {
    const credits = await getCreditsCounter();

    return NextResponse.json({
      success: true,
      credits: {
        used: credits.used,
        limit: credits.limit,
        remaining: credits.remaining,
        percentage: credits.percentage,
      },
      timestamp: new Date().toISOString(),
      mode: 'manual-counter',
    });

  } catch (error: any) {
    console.error('[CREDITS] Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch credits',
      message: error.message,
    }, { status: 500 });
  }
}
