/**
 * Liste des ports les plus populaires à pré-charger
 * (Top ports Bretagne + Atlantique)
 */
export const POPULAR_PORTS = [
  'le-crouesty',
  'la-trinite-sur-mer',
  'port-navalo',
  'vannes',
  'quiberon',
  'lorient',
  'concarneau',
  'brest',
  'saint-malo',
  'la-rochelle',
  'les-sables-d-olonne',
  'pornic',
  'le-pouliguen',
  'la-baule',
  'st-nazaire',
  'crouesty',
  'arradon',
  'locmariaquer',
  'carnac',
  'etel',
  'groix',
  'belle-ile',
  'houat',
  'hoedic',
  'penestin',
  'piriac-sur-mer',
  'le-croisic',
  'pornichet',
  'le-pouliguen',
  'batz-sur-mer',
] as const;

/**
 * TTL par défaut pour le cache (6 heures en secondes)
 */
export const DEFAULT_CACHE_TTL = 6 * 60 * 60; // 21600 secondes

/**
 * Horaires des cronjobs de refresh (UTC)
 */
export const CRON_SCHEDULE = '0 2,8,14,20 * * *'; // 02h, 08h, 14h, 20h UTC
