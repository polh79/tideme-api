import { Redis } from '@upstash/redis';

// Initialiser le client Redis Upstash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Récupère une valeur depuis le cache Redis
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;

    // Parse si c'est une string JSON
    if (typeof data === 'string') {
      return JSON.parse(data) as T;
    }

    return data as T;
  } catch (error) {
    console.error('[CACHE] Get error:', error);
    return null;
  }
}

/**
 * Stocke une valeur dans le cache Redis avec TTL
 * @param key Clé de cache
 * @param value Valeur à stocker
 * @param ttl TTL en secondes (default: 6h = 21600s)
 */
export async function setInCache<T>(
  key: string,
  value: T,
  ttl: number = 21600
): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    console.log(`[CACHE] Set key: ${key}, TTL: ${ttl}s`);
  } catch (error) {
    console.error('[CACHE] Set error:', error);
  }
}

/**
 * Supprime une clé du cache
 */
export async function deleteFromCache(key: string): Promise<void> {
  try {
    await redis.del(key);
    console.log(`[CACHE] Deleted key: ${key}`);
  } catch (error) {
    console.error('[CACHE] Delete error:', error);
  }
}

/**
 * Vérifie si une clé existe dans le cache
 */
export async function existsInCache(key: string): Promise<boolean> {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    console.error('[CACHE] Exists error:', error);
    return false;
  }
}
