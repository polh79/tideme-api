import { Redis } from '@upstash/redis';
import memoryCache from './memoryCache';

// Détecter quel système de cache utiliser
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const USE_UPSTASH = !!(UPSTASH_URL && UPSTASH_TOKEN);

// Initialiser le client Redis Upstash seulement si configuré
let redis: Redis | null = null;

if (USE_UPSTASH) {
  redis = new Redis({
    url: UPSTASH_URL,
    token: UPSTASH_TOKEN,
  });
  console.log('[CACHE] ✅ Upstash Redis configuré');
} else {
  console.log('[CACHE] ⚠️  Upstash non configuré → Utilisation du cache mémoire');
}

/**
 * Récupère une valeur depuis le cache
 * Utilise Upstash si configuré, sinon cache mémoire
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    if (USE_UPSTASH && redis) {
      // Mode Upstash Redis
      const data = await redis.get(key);
      if (!data) return null;

      // Parse si c'est une string JSON
      if (typeof data === 'string') {
        return JSON.parse(data) as T;
      }

      return data as T;
    } else {
      // Mode cache mémoire
      return await memoryCache.get<T>(key);
    }
  } catch (error) {
    console.error('[CACHE] Get error:', error);
    return null;
  }
}

/**
 * Stocke une valeur dans le cache avec TTL
 * @param key Clé de cache
 * @param value Valeur à stocker
 * @param ttl TTL en secondes (default: 12h = 43200s)
 */
export async function setInCache<T>(
  key: string,
  value: T,
  ttl: number = 43200
): Promise<void> {
  try {
    if (USE_UPSTASH && redis) {
      // Mode Upstash Redis
      await redis.setex(key, ttl, JSON.stringify(value));
      console.log(`[CACHE:Upstash] Set key: ${key}, TTL: ${ttl}s`);
    } else {
      // Mode cache mémoire
      await memoryCache.set(key, value, ttl);
      console.log(`[CACHE:Memory] Set key: ${key}, TTL: ${ttl}s`);
    }
  } catch (error) {
    console.error('[CACHE] Set error:', error);
  }
}

/**
 * Supprime une clé du cache
 */
export async function deleteFromCache(key: string): Promise<void> {
  try {
    if (USE_UPSTASH && redis) {
      await redis.del(key);
    } else {
      await memoryCache.delete(key);
    }
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
    if (USE_UPSTASH && redis) {
      const result = await redis.exists(key);
      return result === 1;
    } else {
      return await memoryCache.exists(key);
    }
  } catch (error) {
    console.error('[CACHE] Exists error:', error);
    return false;
  }
}
