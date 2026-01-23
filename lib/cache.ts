import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Simple cache layer using AsyncStorage
 * - Supports TTL (time to live) for automatic expiry
 * - Used to cache receipts, shop data, preset items
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

const CACHE_PREFIX = '@billsnap_cache:';

export const CacheKeys = {
  RECEIPTS: 'receipts',
  SHOP: 'shop',
  PRESET_ITEMS: 'preset_items',
  TODAY_TOTAL: 'today_total',
  MONTHLY_COUNT: 'monthly_count',
} as const;

/**
 * Get data from cache
 * Returns null if cache miss or expired
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const item: CacheItem<T> = JSON.parse(raw);

    // Check if expired
    if (item.ttl) {
      const now = Date.now();
      const age = now - item.timestamp;
      if (age > item.ttl) {
        // Expired - remove it
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
    }

    return item.data;
  } catch (error) {
    if (__DEV__) console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Save data to cache
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Optional TTL in milliseconds (e.g., 5 * 60 * 1000 for 5 minutes)
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (error) {
    if (__DEV__) console.error('Cache write error:', error);
  }
}

/**
 * Clear specific cache key
 */
export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch (error) {
    if (__DEV__) console.error('Cache clear error:', error);
  }
}

/**
 * Clear all cache (useful for logout)
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    if (__DEV__) console.error('Cache clear all error:', error);
  }
}

/**
 * Get cache for a specific shop (receipts/stats are per-shop)
 */
export function getShopCacheKey(shopId: string, key: string): string {
  return `${key}:${shopId}`;
}
