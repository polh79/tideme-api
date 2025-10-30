import type { Port, TideExtreme } from '../types';

const WORLDTIDES_API_KEY = process.env.WORLDTIDES_API_KEY!;
const BASE_URL = 'https://www.worldtides.info/api/v3';

interface WorldTidesResponse {
  status: number;
  callCount: number;
  extremes: Array<{
    dt: number;        // Unix timestamp
    date: string;      // ISO string
    height: number;    // meters
    type: string;      // "High" or "Low"
  }>;
  copyright?: string;
  error?: string;
}

/**
 * Fetch tide extremes (marées haute/basse) pour un port depuis WorldTides API
 * Récupère les données de marées pour les prochaines 48 heures
 */
export async function fetchTideExtremes(port: Port): Promise<TideExtreme[]> {
  const params = new URLSearchParams({
    extremes: 'true',
    lat: port.latitude.toString(),
    lon: port.longitude.toString(),
    key: WORLDTIDES_API_KEY,
    // Optionnel : nombre de jours (par défaut 7 jours)
    // days: '2',
  });

  const url = `${BASE_URL}?${params}`;

  console.log(`[WorldTides] Fetching tides for ${port.name}...`);

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WorldTides API error: ${response.status} ${errorText}`);
  }

  const json: WorldTidesResponse = await response.json();

  if (json.error) {
    throw new Error(`WorldTides API error: ${json.error}`);
  }

  if (!json.extremes || json.extremes.length === 0) {
    throw new Error(`No tide data returned for ${port.name}`);
  }

  console.log(`[WorldTides] ✅ Received ${json.extremes.length} tide extremes for ${port.name}`);
  console.log(`[WorldTides] 📊 API Call Count: ${json.callCount}`);

  // Filter pour garder seulement les 48 prochaines heures
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  return json.extremes
    .filter((item) => {
      const tideTime = new Date(item.date);
      return tideTime >= now && tideTime <= in48h;
    })
    .map((item) => ({
      time: item.date,
      height: item.height,
      type: item.type === 'High' ? 'high' : 'low',
    }));
}

/**
 * Fetch toutes les données de marées pour un port
 * Compatible avec l'ancienne fonction fetchTideData de stormglass.ts
 */
export async function fetchTideData(port: Port) {
  console.log(`[API] Fetching tide data for port: ${port.name} (WorldTides)`);

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
