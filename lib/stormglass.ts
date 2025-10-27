import type { Port, TideExtreme } from '../types';

const STORMGLASS_API_KEY = process.env.STORMGLASS_API_KEY!;
const BASE_URL = 'https://api.stormglass.io/v2';

interface StormGlassTideResponse {
  data: Array<{
    time: string;
    height: number;
    type: 'high' | 'low';
  }>;
}

/**
 * Fetch tide extremes (marées haute/basse) pour un port
 * Récupère les données de marées pour les prochaines 48 heures
 */
export async function fetchTideExtremes(port: Port): Promise<TideExtreme[]> {
  const now = new Date();
  const end = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48h

  const url = `${BASE_URL}/tide/extremes/point?lat=${port.latitude}&lng=${port.longitude}&start=${now.toISOString()}&end=${end.toISOString()}`;

  console.log(`[StormGlass] Fetching tides for ${port.name}...`);

  const response = await fetch(url, {
    headers: {
      Authorization: STORMGLASS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`StormGlass tide API error: ${response.status} ${response.statusText}`);
  }

  const json: StormGlassTideResponse = await response.json();

  console.log(`[StormGlass] ✅ Received ${json.data.length} tide extremes for ${port.name}`);

  return json.data.map((item) => ({
    time: item.time,
    height: item.height,
    type: item.type,
  }));
}

/**
 * Fetch toutes les données de marées pour un port
 * Simplifié : uniquement les marées (pas de météo/surf)
 */
export async function fetchTideData(port: Port) {
  console.log(`[API] Fetching tide data for port: ${port.name}`);

  try {
    const tides = await fetchTideExtremes(port);

    return {
      port,
      tides,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[API] Error fetching tide data for ${port.name}:`, error);
    throw error;
  }
}
