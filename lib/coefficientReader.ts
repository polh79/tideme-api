import coefficients2025 from '@/data/coefficients/2025.json';
import coefficients2026 from '@/data/coefficients/2026.json';

/**
 * Récupère le coefficient SHOM du jour depuis les JSON statiques
 * Utilisé par /api/tides pour enrichir les données de marées
 */
export function getTodayCoefficient(): {
  current: number;
  morning: number;
  afternoon: number;
  phase: 'rising' | 'falling';
  period: 'morning' | 'afternoon';
} | null {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  // Charger le bon fichier selon l'année
  const coefficientsData: Record<string, { morning: number; afternoon: number }> =
    year === 2025 ? coefficients2025 : coefficients2026;

  const todayCoef = coefficientsData[dateKey];

  if (!todayCoef) {
    return null;
  }

  // Déterminer si on est matin ou après-midi (avant ou après 12h)
  const currentHour = now.getHours();
  const currentPeriod = currentHour < 12 ? 'morning' : 'afternoon';
  const currentCoefficient = currentPeriod === 'morning' ? todayCoef.morning : todayCoef.afternoon;

  // Calculer la phase en comparant matin vs après-midi
  const phase = todayCoef.afternoon > todayCoef.morning ? 'rising' : 'falling';

  return {
    current: currentCoefficient,
    morning: todayCoef.morning,
    afternoon: todayCoef.afternoon,
    phase,
    period: currentPeriod,
  };
}
