import type { TideExtreme } from '../types';

/**
 * Calcule la hauteur d'eau actuelle entre deux marées
 * Utilise une approximation sinusoïdale
 */
export function calculateCurrentWaterHeight(
  maxTide: TideExtreme,
  minTide: TideExtreme,
  currentTime: Date = new Date()
): number {
  const maxTime = new Date(maxTide.time).getTime();
  const minTime = new Date(minTide.time).getTime();
  const now = currentTime.getTime();

  // Déterminer si on est entre max→min ou min→max
  let t1, t2, h1, h2;

  if (maxTime < minTime) {
    // Max puis Min
    if (now >= maxTime && now <= minTime) {
      t1 = maxTime;
      t2 = minTime;
      h1 = maxTide.height;
      h2 = minTide.height;
    } else {
      // En dehors de la plage, retourner la hauteur la plus proche
      return now < maxTime ? minTide.height : maxTide.height;
    }
  } else {
    // Min puis Max
    if (now >= minTime && now <= maxTime) {
      t1 = minTime;
      t2 = maxTime;
      h1 = minTide.height;
      h2 = maxTide.height;
    } else {
      return now < minTime ? maxTide.height : minTide.height;
    }
  }

  // Interpolation sinusoïdale (plus réaliste que linéaire)
  const progress = (now - t1) / (t2 - t1); // 0 à 1
  const angle = progress * Math.PI; // 0 à π
  const sinProgress = (1 - Math.cos(angle)) / 2; // Courbe en S

  const currentHeight = h1 + (h2 - h1) * sinProgress;

  return currentHeight;
}

/**
 * Calcule le niveau d'eau normalisé (0-1) pour l'animation
 */
export function calculateWaterLevel(
  currentHeight: number,
  minHeight: number,
  maxHeight: number
): number {
  const range = maxHeight - minHeight;
  if (range === 0) return 0.5;

  const level = (currentHeight - minHeight) / range;
  return Math.max(0, Math.min(1, level)); // Clamp entre 0 et 1
}

/**
 * Calcule le coefficient de marée (approximation simplifiée)
 * Coefficient = amplitude × 10
 * Réel: 20-120, on approxime ici
 */
export function calculateCoefficient(maxHeight: number, minHeight: number): number {
  const amplitude = Math.abs(maxHeight - minHeight);
  const coefficient = Math.round(amplitude * 20);
  return Math.max(20, Math.min(120, coefficient)); // Clamp 20-120
}
