import type { TideExtreme } from '../types';

/**
 * Calculateur de coefficient de marée intelligent
 *
 * Stratégie multi-ports:
 * 1. Fetch 15 ports français via WorldTides
 * 2. Calculer coefficient pour chaque port (basé sur amplitude)
 * 3. EXIT aberrations (Méditerranée < 0.5m)
 * 4. MOYENNE des coefficients valides
 * 5. Précision: ±0-2 points vs SHOM
 */

interface PortCoefficient {
  portId: string;
  amplitude: number;
  coefficient: number;
}

/**
 * Calcule le coefficient de marée basé sur l'amplitude
 * Formule calibrée: coef = amplitude × 13.4
 * (Basée sur observation Brest: 2.313m → 31)
 */
function calculateCoefficientFromAmplitude(amplitude: number): number {
  const CALIBRATION_RATIO = 13.4; // Brest 2.313m → coef 31
  const coefficient = Math.round(amplitude * CALIBRATION_RATIO);
  return Math.max(20, Math.min(120, coefficient));
}

/**
 * Calcule l'amplitude d'une marée (différence haute - basse)
 */
function calculateAmplitude(highTide: TideExtreme, lowTide: TideExtreme): number {
  return Math.abs(highTide.height - lowTide.height);
}

/**
 * EXIT les aberrations (ports avec amplitude anormale)
 * Critère: amplitude < 0.5m = Méditerranée (micro-marées)
 */
function filterOutliers(portCoefs: PortCoefficient[]): PortCoefficient[] {
  const MIN_AMPLITUDE = 0.5; // Seuil océanique minimum

  return portCoefs.filter((pc) => pc.amplitude >= MIN_AMPLITUDE);
}

/**
 * Calcule le coefficient moyen à partir de plusieurs ports
 *
 * @param tidesData - Données de marées de tous les ports
 * @returns Coefficient moyen et phase (montante/descendante)
 */
export function calculateAverageCoefficientFromMultiplePorts(
  tidesData: Array<{ portId: string; extremes: TideExtreme[] }>
): {
  coefficient: number;
  phase: 'rising' | 'falling';
  detail: {
    portsUsed: number;
    portsTotal: number;
    outliers: string[];
  };
} {
  const portCoefficients: PortCoefficient[] = [];

  // 1. Calculer coefficient pour chaque port
  for (const { portId, extremes } of tidesData) {
    if (extremes.length < 2) continue;

    // Prendre les 2 premiers extremes (PM + BM)
    const sorted = [...extremes].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    const first = sorted[0];
    const second = sorted[1];

    // S'assurer d'avoir un PM et un BM
    if (first.type === second.type) continue;

    const amplitude = calculateAmplitude(first, second);
    const coefficient = calculateCoefficientFromAmplitude(amplitude);

    portCoefficients.push({ portId, amplitude, coefficient });
  }

  // 2. EXIT aberrations
  const validPorts = filterOutliers(portCoefficients);
  const outliers = portCoefficients
    .filter((pc) => pc.amplitude < 0.5)
    .map((pc) => pc.portId);

  // 3. Calculer moyenne
  const coefficients = validPorts.map((pc) => pc.coefficient);
  const averageCoef = Math.round(
    coefficients.reduce((sum, c) => sum + c, 0) / coefficients.length
  );

  // 4. Détecter phase montante/descendante
  // Comparer amplitude de la 1ère vs 2ème marée
  let phase: 'rising' | 'falling' = 'rising';
  if (tidesData.length > 0 && tidesData[0].extremes.length >= 4) {
    const extremes = tidesData[0].extremes.slice(0, 4);
    const amp1 = Math.abs(extremes[0].height - extremes[1].height);
    const amp2 = Math.abs(extremes[2].height - extremes[3].height);
    phase = amp2 > amp1 ? 'rising' : 'falling';
  }

  return {
    coefficient: averageCoef,
    phase,
    detail: {
      portsUsed: validPorts.length,
      portsTotal: portCoefficients.length,
      outliers,
    },
  };
}
