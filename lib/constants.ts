/**
 * Liste des ports à pré-charger pour le développement
 * MODE DEBUG: 1 seul port pour économiser les API calls
 */
export const POPULAR_PORTS = [
  'le-crouesty',
] as const;

/**
 * TTL par défaut pour le cache (12 heures en secondes)
 */
export const DEFAULT_CACHE_TTL = 12 * 60 * 60; // 43200 secondes

/**
 * Horaires des cronjobs de refresh (UTC)
 */
export const CRON_SCHEDULE = '0 2,14 * * *'; // 02h, 14h UTC (toutes les 12h)
