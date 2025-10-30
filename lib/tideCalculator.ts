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
 * Calcule le coefficient de marée (approximation améliorée)
 *
 * IMPORTANT: Le coefficient de marée français est UNIVERSEL et calculé
 * sur la base de Brest (port de référence). Cette fonction fournit une
 * ESTIMATION basée sur l'amplitude locale et la moyenne française.
 *
 * Pour les coefficients officiels SHOM, voir: maree.info ou API SHOM
 *
 * Calibration: 14 ports océaniques français (excluant Marseille/Méditerranée)
 * Amplitude moyenne France: 1.78m (coef moyen ~70)
 */
export function calculateCoefficient(maxHeight: number, minHeight: number): number {
  const amplitude = Math.abs(maxHeight - minHeight);

  // Constantes calibrées sur ports français océaniques
  const AMPLITUDE_MOYENNE_FRANCE = 1.78; // Moyenne de 14 ports
  const COEF_MOYEN = 70; // Coefficient moyen annuel

  // Normaliser l'amplitude par rapport à la moyenne française
  const ratio = amplitude / AMPLITUDE_MOYENNE_FRANCE;

  // Appliquer le ratio au coefficient moyen
  const coefficient = Math.round(ratio * COEF_MOYEN);

  // Clamper entre 20-120 (limites officielles SHOM)
  return Math.max(20, Math.min(120, coefficient));
}

/**
 * Détecte si on est en phase montante ou descendante des coefficients
 * Compare l'amplitude actuelle avec la suivante
 */
export function detectCoefficientPhase(
  currentAmplitude: number,
  nextAmplitude: number
): 'rising' | 'falling' {
  return nextAmplitude > currentAmplitude ? 'rising' : 'falling';
}
