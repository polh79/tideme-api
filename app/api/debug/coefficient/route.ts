import { NextResponse } from 'next/server';
import { getFromCache } from '@/lib/cache';

/**
 * GET /api/debug/coefficient
 * Récupère le coefficient universel France depuis le cache Redis
 * Calculé par le CRON multi-ports toutes les 12h
 */
export async function GET() {
  try {
    const coefficientData = await getFromCache<{
      coefficient: number;
      phase: 'rising' | 'falling';
      detail: {
        portsUsed: number;
        portsTotal: number;
        outliers: string[];
      };
    }>('france:coefficient');

    if (!coefficientData) {
      return NextResponse.json({
        error: 'Coefficient not found in cache',
        message: 'Run /api/debug/force-refresh to populate cache',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: coefficientData,
      cacheKey: 'france:coefficient',
    });

  } catch (error: any) {
    console.error('[DEBUG-COEFFICIENT] Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch coefficient',
      message: error.message,
    }, { status: 500 });
  }
}
