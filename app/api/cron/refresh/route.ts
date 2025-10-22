import { NextRequest, NextResponse } from 'next/server';
import { fetchAllPortData } from '@/lib/stormglass';
import { setInCache } from '@/lib/cache';
import { POPULAR_PORTS, DEFAULT_CACHE_TTL } from '@/lib/constants';
import portsData from '@/data/ports.json';
import type { Port } from '@/types';

/**
 * GET /api/cron/refresh
 * Cronjob Vercel : pré-charge les ports populaires dans le cache
 * Déclenché toutes les 6h : 02h, 08h, 14h, 20h UTC
 */
export async function GET(request: NextRequest) {
  // Vérifier l'authentification (Vercel Cron Secret)
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    console.warn('[CRON] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON] 🚀 Starting refresh of popular ports');
  const startTime = Date.now();

  const results: Array<{
    portId: string;
    status: 'success' | 'error';
    error?: string;
    duration?: number;
  }> = [];

  // Pré-charger chaque port populaire
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

      // Appeler l'API StormGlass
      const data = await fetchAllPortData(port as Port);

      // Mettre en cache pour 6h
      const cacheKey = `port:${portId}:static`;
      await setInCache(cacheKey, data, DEFAULT_CACHE_TTL);

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

  const totalDuration = Date.now() - startTime;
  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  console.log(`[CRON] ✨ Refresh complete in ${totalDuration}ms`);
  console.log(`[CRON] 📊 Success: ${successCount}, Errors: ${errorCount}`);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    stats: {
      total: results.length,
      success: successCount,
      errors: errorCount,
    },
    results,
  });
}
