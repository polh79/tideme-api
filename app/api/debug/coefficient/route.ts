import { NextResponse } from 'next/server';
import coefficients2025 from '@/data/coefficients/2025.json';
import coefficients2026 from '@/data/coefficients/2026.json';

/**
 * GET /api/debug/coefficient
 * Récupère le coefficient SHOM officiel depuis JSON statiques
 * Précision parfaite (±0 points) - Données officielles SHOM
 */
export async function GET() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    // Charger le bon fichier selon l'année
    const coefficientsData: Record<string, { morning: number; afternoon: number }> =
      year === 2025 ? coefficients2025 : coefficients2026;

    const todayCoef = coefficientsData[dateKey];

    if (!todayCoef) {
      return NextResponse.json({
        error: 'Coefficient not found',
        message: `No coefficient data for ${dateKey}. Update JSON files in data/coefficients/`,
      }, { status: 404 });
    }

    // Déterminer si on est matin ou après-midi (avant ou après 12h)
    const currentHour = now.getHours();
    const currentPeriod = currentHour < 12 ? 'morning' : 'afternoon';
    const currentCoefficient = currentPeriod === 'morning' ? todayCoef.morning : todayCoef.afternoon;

    // Calculer la phase en comparant matin vs après-midi (OPTIMISÉ!)
    const phase = todayCoef.afternoon > todayCoef.morning ? 'rising' : 'falling';

    return NextResponse.json({
      success: true,
      data: {
        current: currentCoefficient,
        morning: todayCoef.morning,
        afternoon: todayCoef.afternoon,
        phase,
        period: currentPeriod,
      },
      source: 'SHOM JSON (données officielles) - Précision parfaite',
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
