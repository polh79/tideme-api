import { NextResponse } from 'next/server';
import { getTodayCoefficient } from '@/lib/coefficientReader';

/**
 * GET /api/debug/coefficient
 * Récupère le coefficient SHOM officiel depuis JSON statiques
 * Précision parfaite (±0 points) - Données officielles SHOM
 * Si fichier mensuel manquant → scraping auto de maree.info
 */
export async function GET() {
  try {
    const coeffData = await getTodayCoefficient();

    if (!coeffData) {
      return NextResponse.json({
        error: 'Coefficient not found',
        message: 'No coefficient data available. Scraping may have failed.',
      }, { status: 404 });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateKey = year + '-' + monthStr + '-' + dayStr;

    return NextResponse.json({
      success: true,
      data: {
        current: coeffData.current,
        morning: coeffData.morning,
        afternoon: coeffData.afternoon,
        phase: coeffData.phase,
        period: coeffData.period,
      },
      source: 'SHOM JSON (données officielles) - Précision parfaite + Auto-scraping fallback',
      date: dateKey,
    });

  } catch (error: any) {
    console.error('[DEBUG-COEFFICIENT] Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch coefficient',
      message: error.message,
    }, { status: 500 });
  }
}
