import { NextResponse } from 'next/server';
import { fetchTideData } from '@/lib/worldtides';
import { setInCache } from '@/lib/cache';
import { POPULAR_PORTS, DEFAULT_CACHE_TTL } from '@/lib/constants';
import { calculateAverageCoefficientFromMultiplePorts } from '@/lib/coefficientCalculator';
import portsData from '@/data/ports.json';
import type { Port } from '@/types';

/**
 * GET /api/debug/force-refresh
 * Force manual refresh of all ports + coefficient calculation (DEBUG ONLY)
 * NO AUTH REQUIRED - pour tester le système multi-ports
 */
export async function GET() {
  console.log(`[DEBUG-REFRESH] 🚀 Starting manual refresh for ${POPULAR_PORTS.length} ports`);

  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  // Récupérer tous les ports depuis ports.json
  const allPorts = portsData.ports as Port[];

  // Collecter toutes les données de marées pour calcul coefficient
  const allTidesData: Array<{ portId: string; extremes: any[] }> = [];

  // Fetch tous les ports
  for (const portId of POPULAR_PORTS) {
    try {
      const port = allPorts.find((p) => p.id === portId);

      if (!port) {
        console.warn(`[DEBUG-REFRESH] ⚠️ Port ${portId} not found in ports.json`);
        errorCount++;
        errors.push(`Port ${portId} not found`);
        continue;
      }

      console.log(`[DEBUG-REFRESH] 🌊 Fetching ${port.name}...`);

      // Fetch depuis WorldTides
      const data = await fetchTideData(port as Port);

      // Mettre en cache
      const cacheKey = `tide:${portId}`;
      await setInCache(cacheKey, data, DEFAULT_CACHE_TTL);

      console.log(`[DEBUG-REFRESH] ✅ ${port.name} cached (${data.tides.length} tides)`);

      // Collecter pour calcul coefficient
      if (data.tides && data.tides.length > 0) {
        allTidesData.push({
          portId,
          extremes: data.tides,
        });
      }

      successCount++;
    } catch (error: any) {
      console.error(`[DEBUG-REFRESH] ❌ Error for ${portId}:`, error.message);
      errorCount++;
      errors.push(`${portId}: ${error.message}`);
    }
  }

  // Calculer le coefficient moyen depuis tous les ports
  let coefficientData;
  try {
    console.log(`[DEBUG-REFRESH] 🎯 Calculating average coefficient from ${allTidesData.length} ports...`);

    coefficientData = calculateAverageCoefficientFromMultiplePorts(allTidesData);

    // Mettre en cache le coefficient global France
    await setInCache('france:coefficient', coefficientData, DEFAULT_CACHE_TTL);

    console.log(`[DEBUG-REFRESH] 🎯 Coefficient moyen: ${coefficientData.coefficient}`);
    console.log(`[DEBUG-REFRESH] 📈 Phase: ${coefficientData.phase}`);
    console.log(`[DEBUG-REFRESH] 📊 Ports utilisés: ${coefficientData.detail.portsUsed}/${coefficientData.detail.portsTotal}`);
    console.log(`[DEBUG-REFRESH] ⚠️ Outliers: ${coefficientData.detail.outliers.join(', ') || 'aucun'}`);
  } catch (error: any) {
    console.error(`[DEBUG-REFRESH] ❌ Error calculating coefficient:`, error);
    errors.push(`Coefficient calculation: ${error.message}`);
  }

  const duration = Date.now() - startTime;

  console.log(`[DEBUG-REFRESH] ✅ Done in ${duration}ms`);
  console.log(`[DEBUG-REFRESH] 📊 Success: ${successCount}, Errors: ${errorCount}`);

  return NextResponse.json({
    success: true,
    message: `Refreshed ${POPULAR_PORTS.length} ports in ${duration}ms`,
    stats: {
      portsTotal: POPULAR_PORTS.length,
      portsSuccess: successCount,
      portsError: errorCount,
      duration,
    },
    coefficient: coefficientData || null,
    errors: errors.length > 0 ? errors : undefined,
  });
}
