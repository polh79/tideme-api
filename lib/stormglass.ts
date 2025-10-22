import type { Port, TideExtreme, SunData, MoonPhase } from '../types';

const STORMGLASS_API_KEY = process.env.STORMGLASS_API_KEY!;
const BASE_URL = 'https://api.stormglass.io/v2';

interface StormGlassTideResponse {
  data: Array<{
    time: string;
    height: number;
    type: 'high' | 'low';
  }>;
}

interface StormGlassWeatherResponse {
  hours: Array<{
    time: string;
    airTemperature?: { sg?: number };
    waterTemperature?: { sg?: number };
    cloudCover?: { sg?: number };
    precipitation?: { sg?: number };
    windSpeed?: { sg?: number };
    windDirection?: { sg?: number };
    pressure?: { sg?: number };
    humidity?: { sg?: number };
    waveHeight?: { sg?: number };
    wavePeriod?: { sg?: number };
    waveDirection?: { sg?: number };
    swellHeight?: { sg?: number };
    swellPeriod?: { sg?: number };
    swellDirection?: { sg?: number };
  }>;
}

/**
 * Fetch tide extremes (marées haute/basse) pour un port
 */
export async function fetchTideExtremes(port: Port): Promise<TideExtreme[]> {
  const now = new Date();
  const end = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48h

  const url = `${BASE_URL}/tide/extremes/point?lat=${port.latitude}&lng=${port.longitude}&start=${now.toISOString()}&end=${end.toISOString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: STORMGLASS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`StormGlass tide API error: ${response.status} ${response.statusText}`);
  }

  const json: StormGlassTideResponse = await response.json();

  return json.data.map((item) => ({
    time: item.time,
    height: item.height,
    type: item.type,
  }));
}

/**
 * Fetch weather & surf data pour un port
 */
export async function fetchWeatherData(port: Port) {
  const now = new Date();
  const params = [
    'airTemperature',
    'waterTemperature',
    'cloudCover',
    'precipitation',
    'windSpeed',
    'windDirection',
    'pressure',
    'humidity',
    'waveHeight',
    'wavePeriod',
    'waveDirection',
    'swellHeight',
    'swellPeriod',
    'swellDirection',
  ].join(',');

  const url = `${BASE_URL}/weather/point?lat=${port.latitude}&lng=${port.longitude}&params=${params}&start=${now.toISOString()}&end=${now.toISOString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: STORMGLASS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`StormGlass weather API error: ${response.status} ${response.statusText}`);
  }

  const json: StormGlassWeatherResponse = await response.json();

  // Prendre la première heure (maintenant)
  const current = json.hours[0];

  return {
    airTemp: current.airTemperature?.sg ?? 15,
    waterTemp: current.waterTemperature?.sg ?? 14,
    cloudCover: current.cloudCover?.sg ?? 50,
    precipitation: current.precipitation?.sg ?? 0,
    windSpeed: current.windSpeed?.sg ?? 5,
    windDirection: current.windDirection?.sg ?? 0,
    pressure: current.pressure?.sg ?? 1013,
    humidity: current.humidity?.sg ?? 70,
    waveHeight: current.waveHeight?.sg ?? 1,
    wavePeriod: current.wavePeriod?.sg ?? 6,
    waveDirection: current.waveDirection?.sg ?? 0,
    swellHeight: current.swellHeight?.sg ?? 0.5,
    swellPeriod: current.swellPeriod?.sg ?? 8,
    swellDirection: current.swellDirection?.sg ?? 0,
  };
}

/**
 * Fetch toutes les données pour un port (tides + weather)
 */
export async function fetchAllPortData(port: Port) {
  console.log(`[API] Fetching data for port: ${port.name}`);

  try {
    const [tides, weather] = await Promise.all([
      fetchTideExtremes(port),
      fetchWeatherData(port),
    ]);

    return {
      port,
      tides,
      weather,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[API] Error fetching data for ${port.name}:`, error);
    throw error;
  }
}
