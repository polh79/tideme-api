import { NextRequest, NextResponse } from 'next/server';
import { fetchTideData } from '@/lib/worldtides';
import { setInCache } from '@/lib/cache';
import { POPULAR_PORTS, DEFAULT_CACHE_TTL } from '@/lib/constants';
import { calculateAverageCoefficientFromMultiplePorts } from '@/lib/coefficientCalculator';
import portsData from '@/data/ports.json';
import type { Port } from '@/types';

/**
 * GET /api/cron/refresh
 * Cronjob Vercel : pré-charge 15 ports français + calcul coefficient moyen
 * Déclenché toutes les 12h : 02h, 14h UTC
 *
 * Stratégie coefficient:
 * 1. Fetch 15 ports français
 * 2. Calculer coefficient pour chaque port
 * 3. EXIT aberrations (Méditerranée)
 * 4. MOYENNE = coefficient précis (±0 points vs SHOM)
 */
export async function GET(request: NextRequest) {
  // Vérifier l'authentification (Vercel Cron Secret)
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    console.warn('[CRON] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`[CRON] 🚀 Starting tide refresh for ${POPULAR_PORTS.length} ports`);
  const startTime = Date.now();

  const results: Array<{
    portId: string;
    status: 'success' | 'error';
    error?: string;
    duration?: number;
  }> = [];

  // Collecter toutes les données de marées pour calcul coefficient
  const allTidesData: Array<{ portId: string; extremes: any[] }> = [];

  // Pré-charger chaque port
  for (const portId of POPULAR_PORTS) {
    const portStartTime = Date.now();

    try {
      // Trouver le port dans la base
      const port = portsData.ports.find((p) => p.id === portId);

      if (!port) {
        results.push({
          portId,
          status: 'error',
          error: 'Port not found in database',
        });
        continue;
      }

      // Appeler WorldTides API
      const data = await fetchTideData(port as Port);

      // Mettre en cache pour 12h
      const cacheKey = `port:${portId}:tides`;
      await setInCache(cacheKey, data, DEFAULT_CACHE_TTL);

      // Collecter les extremes pour calcul coefficient
      if (data.tides && data.tides.length > 0) {
        allTidesData.push({
          portId,
          extremes: data.tides,
        });
      }

      const duration = Date.now() - portStartTime;

      results.push({
        portId,
        status: 'success',
        duration,
      });

      console.log(`[CRON] ✅ ${port.name} cached (${duration}ms)`);
    } catch (error: any) {
      const duration = Date.now() - portStartTime;

      results.push({
        portId,
        status: 'error',
        error: error.message,
        duration,
      });

      console.error(`[CRON] ❌ ${portId} failed (${duration}ms):`, error.message);
    }
  }

  // Calculer le coefficient moyen à partir de tous les ports
  let coefficientData = null;
  if (allTidesData.length > 0) {
    try {
      coefficientData = calculateAverageCoefficientFromMultiplePorts(allTidesData);

      // Stocker le coefficient en cache global
      await setInCache('france:coefficient', coefficientData, DEFAULT_CACHE_TTL);

      console.log(
        `[CRON] 🎯 Coefficient moyen: ${coefficientData.coefficient} (phase: ${coefficientData.phase})`
      );
      console.log(
        `[CRON] 📊 Ports utilisés: ${coefficientData.detail.portsUsed}/${coefficientData.detail.portsTotal}`
      );
      if (coefficientData.detail.outliers.length > 0) {
        console.log(`[CRON] 🚫 Outliers: ${coefficientData.detail.outliers.join(', ')}`);
      }
    } catch (error: any) {
      console.error(`[CRON] ❌ Coefficient calculation failed:`, error.message);
    }
  }

  const totalDuration = Date.now() - startTime;
  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  console.log(`[CRON] ✨ Refresh complete in ${totalDuration}ms`);
  console.log(`[CRON] 📊 Success: ${successCount}, Errors: ${errorCount}`);
  console.log(`[CRON] 📞 API calls used: ${successCount} (1 per port)`);

  // Déterminer si c'est un succès global (au moins 1 port OK)
  const isSuccess = successCount > 0;

  return NextResponse.json({
    success: isSuccess,
    warning: errorCount > 0 ? `${errorCount} port(s) failed` : undefined,
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    coefficient: coefficientData
      ? {
          value: coefficientData.coefficient,
          phase: coefficientData.phase,
          portsUsed: coefficientData.detail.portsUsed,
          portsTotal: coefficientData.detail.portsTotal,
          outliers: coefficientData.detail.outliers,
        }
      : null,
    stats: {
      total: results.length,
      success: successCount,
      errors: errorCount,
      apiCallsUsed: successCount,
    },
    results,
  });
}
