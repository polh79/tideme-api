/**
 * Liste des ports français pour calcul précis du coefficient de marée
 *
 * Stratégie: Fetch 15 ports océaniques français via WorldTides
 * → Calculer coefficient pour chaque port
 * → EXIT aberrations (Méditerranée)
 * → MOYENNE = coefficient précis (±0 points vs SHOM)
 *
 * Coût: 15 ports × 2 fois/jour = 30 calls/jour
 * Sur 20,000 crédits = 666 jours = ~1.8 ans
 */
export const POPULAR_PORTS = [
  // Référence française
  'brest',              // Port de référence SHOM

  // Manche / Mer du Nord (fortes amplitudes)
  'dunkerque',
  'calais',
  'boulogne',
  'dieppe',
  'le-havre',
  'cherbourg',
  'saint-malo',

  // Bretagne / Atlantique
  'le-crouesty',
  'la-rochelle',
  'royan',

  // Atlantique Sud / Pays Basque
  'arcachon',
  'biarritz',
  'saint-jean-de-luz',

  // Méditerranée (pour EXIT comme aberration)
  'marseille',
] as const;

/**
 * TTL par défaut pour le cache (12 heures en secondes)
 */
export const DEFAULT_CACHE_TTL = 12 * 60 * 60; // 43200 secondes

/**
 * Horaires des cronjobs de refresh (UTC)
 */
export const CRON_SCHEDULE = '0 2,14 * * *'; // 02h, 14h UTC (toutes les 12h)
