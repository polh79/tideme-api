import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setInCache } from '@/lib/cache';
import { fetchTideData } from '@/lib/worldtides'; // ✅ Changed from stormglass to worldtides
import {
  calculateCurrentWaterHeight,
  calculateWaterLevel,
  calculateCoefficient,
} from '@/lib/tideCalculator';
import { DEFAULT_CACHE_TTL } from '@/lib/constants';
import portsData from '@/data/ports.json';
import type { Port, TideExtreme } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portId } = body;

    if (!portId) {
      return NextResponse.json(
        { error: 'Missing portId in request body' },
        { status: 400 }
      );
    }

    // 1. Trouver le port dans la base de données
    const port = portsData.ports.find((p) => p.id === portId);

    if (!port) {
      return NextResponse.json(
        { error: `Port not found: ${portId}` },
        { status: 404 }
      );
    }

    // 2. Chercher en cache (données de marées)
    const cacheKey = `port:${portId}:tides`;
    let tideCache = await getFromCache<any>(cacheKey);
    let cacheHit = true;

    if (!tideCache) {
      // Cache miss → Appeler StormGlass API
      console.log(`[CACHE MISS] Port ${portId} - Calling StormGlass API`);
      cacheHit = false;

      tideCache = await fetchTideData(port as Port);

      // Mettre en cache pour 12h
      await setInCache(cacheKey, tideCache, DEFAULT_CACHE_TTL);
    } else {
      console.log(`[CACHE HIT] Port ${portId} - From cache`);
    }

    // 3. Calculer les données temps réel (TOUJOURS frais)
    const now = new Date();
    const tides: TideExtreme[] = tideCache.tides;

    // Trouver les 2 marées qui encadrent maintenant
    let prevExtreme: TideExtreme | null = null;
    let nextExtreme: TideExtreme | null = null;

    // CAS 1 : Toutes les marées sont dans le futur → estimer la précédente (-6h)
    if (tides.length > 0 && new Date(tides[0].time).getTime() > now.getTime()) {
      const firstTide = tides[0];

      // Soustraire 6h pour avoir la marée précédente estimée
      const prevTime = new Date(new Date(firstTide.time).getTime() - 6 * 60 * 60 * 1000);

      prevExtreme = {
        time: prevTime.toISOString(),
        height: firstTide.type === 'low' ? 4.0 : 0.5, // Inverse : BM→PM, PM→BM
        type: firstTide.type === 'low' ? 'high' : 'low',
      };
      nextExtreme = firstTide;
    } else {
      // CAS 2 : Normal - chercher 2 marées qui encadrent maintenant
      for (let i = 0; i < tides.length - 1; i++) {
        const t1 = new Date(tides[i].time).getTime();
        const t2 = new Date(tides[i + 1].time).getTime();
        const nowTime = now.getTime();

        if (nowTime >= t1 && nowTime <= t2) {
          prevExtreme = tides[i];
          nextExtreme = tides[i + 1];
          break;
        }
      }
    }

    if (!prevExtreme || !nextExtreme) {
      return NextResponse.json(
        { error: 'Cannot find tide data for current time' },
        { status: 500 }
      );
    }

    // Calculer hauteur actuelle (interpolation sinusoïdale)
    const currentHeight = calculateCurrentWaterHeight(prevExtreme, nextExtreme, now);

    // Trouver maxTide et minTide des prochaines marées
    const futureTides = tides.filter(
      (t) => new Date(t.time).getTime() > now.getTime()
    );

    const highTides = futureTides.filter((t) => t.type === 'high');
    const lowTides = futureTides.filter((t) => t.type === 'low');

    const maxTide = highTides[0] || futureTides[0];
    const minTide = lowTides[0] || futureTides[1];

    if (!maxTide || !minTide) {
      return NextResponse.json(
        { error: 'Cannot find future tide extremes' },
        { status: 500 }
      );
    }

    // Récupérer coefficient depuis cache global (calculé par CRON multi-ports)
    const coefficientCache = await getFromCache<{
      coefficient: number;
      phase: 'rising' | 'falling';
    }>('france:coefficient');

    const coefficient = coefficientCache?.coefficient || calculateCoefficient(maxTide.height, minTide.height);
    const coefficientPhase = coefficientCache?.phase || 'rising';

    // Calculer niveau d'eau normalisé (0-1) pour animation
    const waterLevel = calculateWaterLevel(currentHeight, minTide.height, maxTide.height);

    // Déterminer si la marée monte ou descend
    const isRising = prevExtreme.type === 'low';

    // 4. Réponse avec toutes les données de marées
    return NextResponse.json({
      // Métadonnées
      meta: {
        cacheHit,
        timestamp: now.toISOString(),
        fetchedAt: tideCache.fetchedAt,
        apiCallsUsed: cacheHit ? 0 : 1, // 1 seul call si miss (tides only)
      },

      // Port
      port: {
        id: port.id,
        name: port.name,
        latitude: port.latitude,
        longitude: port.longitude,
        region: port.region,
        department: port.department,
        emoji: port.emoji,
      },

      // Marées (statiques + calculées)
      tide: {
        extremes: tides, // Tous les extremes sur 48h
        maxTide,
        minTide,
        currentHeight: Math.round(currentHeight * 100) / 100, // 2 décimales
        coefficient,
        coefficientPhase, // 'rising' ou 'falling' (basé sur 15 ports)
        isRising,
        waterLevel: Math.round(waterLevel * 100) / 100, // 2 décimales
      },
    });
  } catch (error: any) {
    console.error('[API /tides] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
