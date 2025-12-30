import { NextRequest, NextResponse } from 'next/server';
import { setCreditsCounter } from '@/lib/credits';

/**
 * POST /api/admin/init-credits
 * Initialise ou réinitialise le compteur de crédits WorldTides
 *
 * Require Authorization header with CRON_SECRET
 *
 * Usage:
 * curl -X POST https://tideme-api.vercel.app/api/admin/init-credits \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET" \
 *   -H "Content-Type: application/json" \
 *   -d '{"remaining": 20000}'
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer la valeur depuis le body (défaut: 20000)
    const body = await req.json().catch(() => ({}));
    const remaining = body.remaining ?? 20000;

    if (typeof remaining !== 'number' || remaining < 0 || remaining > 25000) {
      return NextResponse.json(
        { error: 'Invalid remaining value (must be 0-25000)' },
        { status: 400 }
      );
    }

    // Initialiser le compteur
    await setCreditsCounter(remaining);

    return NextResponse.json({
      success: true,
      message: `Credits counter initialized to ${remaining}`,
      credits: {
        used: 20000 - remaining,
        limit: 20000,
        remaining,
        percentage: Math.round((remaining / 20000) * 100),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[INIT-CREDITS] Error:', error);
    return NextResponse.json({
      error: 'Failed to initialize credits',
      message: error.message,
    }, { status: 500 });
  }
}
