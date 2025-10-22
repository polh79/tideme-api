import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setInCache } from '@/lib/cache';
import { fetchAllPortData } from '@/lib/stormglass';
import {
  calculateCurrentWaterHeight,
  calculateWaterLevel,
  calculateCoefficient,
} from '@/lib/tideCalculator';
import { calculateSunData, calculateMoonPhase, calculateIsDay } from '@/lib/astreCalculator';
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

    // 2. Chercher en cache (données API brutes)
    const cacheKey = `port:${portId}:static`;
    let staticData = await getFromCache<any>(cacheKey);
    let cacheHit = true;

    if (!staticData) {
      // Cache miss → Appeler StormGlass API
      console.log(`[CACHE MISS] Port ${portId} - Calling StormGlass API`);
      cacheHit = false;

      staticData = await fetchAllPortData(port as Port);

      // Mettre en cache pour 6h (21600 secondes)
      await setInCache(cacheKey, staticData, 21600);
    } else {
      console.log(`[CACHE HIT] Port ${portId} - From Redis cache`);
    }

    // 3. Calculer les données temps réel (TOUJOURS frais)
    const now = new Date();
    const tides: TideExtreme[] = staticData.tides;

    // Trouver les 2 marées qui encadrent maintenant
    let prevExtreme: TideExtreme | null = null;
    let nextExtreme: TideExtreme | null = null;

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

    if (!prevExtreme || !nextExtreme) {
      return NextResponse.json(
        { error: 'Cannot find tide data for current time' },
        { status: 500 }
      );
    }

    // Calculer hauteur actuelle (interpolation sinusoïdale)
    const currentHeight = calculateCurrentWaterHeight(prevExtreme, nextExtreme, now);

    // Trouver maxTide et minTide des prochaines 24h
    const next24hTides = tides.filter(
      (t) => new Date(t.time).getTime() > now.getTime()
    ).slice(0, 4); // 4 prochaines marées

    const highTides = next24hTides.filter((t) => t.type === 'high');
    const lowTides = next24hTides.filter((t) => t.type === 'low');

    const maxTide = highTides[0] || next24hTides[0];
    const minTide = lowTides[0] || next24hTides[1];

    // Calculer coefficient
    const coefficient = calculateCoefficient(maxTide.height, minTide.height);

    // Calculer niveau d'eau normalisé (0-1) pour animation
    const waterLevel = calculateWaterLevel(currentHeight, minTide.height, maxTide.height);

    // 4. Calculer les données astronomiques
    const sun = calculateSunData(port as Port, now);
    const moon = calculateMoonPhase(now);
    const isDay = calculateIsDay(sun.sunrise, sun.sunset, now);

    // 5. Calculer temps jusqu'à prochaine marée
    const timeUntilNext = Math.round(
      (new Date(nextExtreme.time).getTime() - now.getTime()) / 60000
    ); // minutes

    const hours = Math.floor(timeUntilNext / 60);
    const minutes = timeUntilNext % 60;

    // 6. Calculer le score surf (simple pour l'instant)
    const surfScore = calculateSurfScore(
      staticData.weather.waveHeight,
      staticData.weather.wavePeriod,
      staticData.weather.windSpeed
    );

    // 7. Réponse avec toutes les données
    return NextResponse.json({
      // Métadonnées
      meta: {
        cacheHit,
        timestamp: now.toISOString(),
        apiCallsUsed: cacheHit ? 0 : 2, // 2 calls si miss (tides + weather)
      },

      // Port
      port: {
        id: port.id,
        name: port.name,
        latitude: port.latitude,
        longitude: port.longitude,
      },

      // Marées (statiques + calculées)
      tide: {
        coefficient,
        maxTide,
        minTide,
        currentHeight: Math.round(currentHeight * 100) / 100,
        waterLevel: Math.round(waterLevel * 100) / 100,
        extremes: next24hTides, // Toutes les marées des prochaines 24h
      },

      // Prochaine marée
      nextTide: {
        type: nextExtreme.type,
        time: nextExtreme.time,
        height: nextExtreme.height,
        timeUntil: `${hours}h${minutes.toString().padStart(2, '0')}`,
        status: nextExtreme.type === 'high' ? 'rising' : 'falling',
      },

      // Météo (depuis cache)
      weather: {
        airTemp: staticData.weather.airTemp,
        waterTemp: {
          value: staticData.weather.waterTemp,
          unit: '°C' as const,
        },
        windSpeed: staticData.weather.windSpeed,
        windDirection: staticData.weather.windDirection,
        cloudCover: staticData.weather.cloudCover,
        precipitation: staticData.weather.precipitation,
        pressure: staticData.weather.pressure,
        humidity: staticData.weather.humidity,
      },

      // Surf (depuis cache + score calculé)
      surf: {
        waveHeight: staticData.weather.waveHeight,
        wavePeriod: staticData.weather.wavePeriod,
        waveDirection: staticData.weather.waveDirection,
        swellHeight: staticData.weather.swellHeight,
        swellPeriod: staticData.weather.swellPeriod,
        swellDirection: staticData.weather.swellDirection,
        score: surfScore,
      },

      // Astronomie (calculée)
      sun,
      moon,
      isDay,
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

/**
 * Calcule un score surf simple (0-5 étoiles)
 */
function calculateSurfScore(
  waveHeight: number,
  wavePeriod: number,
  windSpeed: number
): number {
  let score = 0;

  // Hauteur vague (0-2 étoiles)
  if (waveHeight >= 0.5 && waveHeight <= 2.5) score += 2;
  else if (waveHeight > 0.3 && waveHeight < 3) score += 1;

  // Période vague (0-2 étoiles)
  if (wavePeriod >= 8) score += 2;
  else if (wavePeriod >= 6) score += 1;

  // Vent (0-1 étoile - inversé: moins = mieux)
  if (windSpeed < 10) score += 1;

  return Math.min(5, score);
}
