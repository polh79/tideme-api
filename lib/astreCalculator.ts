import * as SunCalc from 'suncalc';
import { phase } from 'lune';
import type { Port, SunData, MoonPhase } from '../types';

/**
 * Calcule les heures de lever/coucher du soleil pour un port
 */
export function calculateSunData(port: Port, date: Date = new Date()): SunData {
  const times = SunCalc.getTimes(date, port.latitude, port.longitude);

  const formatTime = (d: Date): string => {
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    });
  };

  return {
    sunrise: formatTime(times.sunrise),
    sunset: formatTime(times.sunset),
  };
}

/**
 * Calcule la phase de la lune actuelle
 */
export function calculateMoonPhase(date: Date = new Date()): MoonPhase {
  const lunePhase = phase(date);

  // Mapping de lune vers nos types
  const phaseMap: Record<string, MoonPhase['phase']> = {
    'New': 'new',
    'Waxing Crescent': 'waxing_crescent',
    'First Quarter': 'first_quarter',
    'Waxing Gibbous': 'waxing_gibbous',
    'Full': 'full',
    'Waning Gibbous': 'waning_gibbous',
    'Last Quarter': 'last_quarter',
    'Waning Crescent': 'waning_crescent',
  };

  // lune renvoie un pourcentage (0-100), on le normalise en 0-1
  const illumination = SunCalc.getMoonIllumination(date);

  // Déterminer la phase textuelle
  let phaseName: MoonPhase['phase'] = 'new';
  const fraction = illumination.fraction;

  if (fraction < 0.05) phaseName = 'new';
  else if (fraction < 0.25) phaseName = 'waxing_crescent';
  else if (fraction < 0.30) phaseName = 'first_quarter';
  else if (fraction < 0.45) phaseName = 'waxing_gibbous';
  else if (fraction < 0.55) phaseName = 'full';
  else if (fraction < 0.70) phaseName = 'waning_gibbous';
  else if (fraction < 0.75) phaseName = 'last_quarter';
  else phaseName = 'waning_crescent';

  return {
    phase: phaseName,
    illumination: Math.round(fraction * 100) / 100, // 2 décimales
  };
}

/**
 * Détermine si on est actuellement en journée (entre sunrise et sunset)
 */
export function calculateIsDay(
  sunrise: string,
  sunset: string,
  currentTime: Date = new Date()
): boolean {
  const now = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Parser sunrise/sunset (format "HH:mm")
  const parseSunTime = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const sunriseMinutes = parseSunTime(sunrise);
  const sunsetMinutes = parseSunTime(sunset);

  return now >= sunriseMinutes && now <= sunsetMinutes;
}
