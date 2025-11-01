import { getFromCache, setInCache } from './cache';

const CREDITS_KEY = 'worldtides:credits:manual';
const CREDIT_LIMIT = 20000;

/**
 * Récupère le compteur manuel de crédits depuis le cache
 * ZERO appel API - juste lecture Redis
 */
export async function getCreditsCounter(): Promise<{
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}> {
  const remaining = await getFromCache<number>(CREDITS_KEY);

  // Si pas initialisé, retourner 0 (utilisateur doit set manuellement)
  if (remaining === null || remaining === undefined) {
    return {
      used: 0,
      limit: CREDIT_LIMIT,
      remaining: 0,
      percentage: 0,
    };
  }

  const used = CREDIT_LIMIT - remaining;

  return {
    used,
    limit: CREDIT_LIMIT,
    remaining,
    percentage: Math.round((remaining / CREDIT_LIMIT) * 100),
  };
}

/**
 * Définit manuellement le nombre de crédits restants
 * @param remaining - Nombre de crédits restants (ex: 19919)
 */
export async function setCreditsCounter(remaining: number): Promise<void> {
  // TTL permanent (1 an = jamais expirer en pratique)
  const TTL = 365 * 24 * 60 * 60;
  await setInCache(CREDITS_KEY, remaining, TTL);
  console.log(`[CREDITS] 🔧 Manual counter set to ${remaining} credits`);
}

/**
 * Décrémente le compteur de crédits de 1
 * Appelé automatiquement après chaque appel WorldTides API
 */
export async function decrementCreditsCounter(): Promise<void> {
  const current = await getFromCache<number>(CREDITS_KEY);

  if (current === null || current === undefined) {
    console.warn('[CREDITS] ⚠️ Counter not initialized, skipping decrement');
    return;
  }

  const newValue = Math.max(0, current - 1);
  const TTL = 365 * 24 * 60 * 60;
  await setInCache(CREDITS_KEY, newValue, TTL);

  console.log(`[CREDITS] 📉 Credit consumed: ${current} → ${newValue} remaining`);
}
