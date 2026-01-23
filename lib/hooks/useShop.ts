import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth/AuthContext';
import { Shop } from '../../types';
import { getCache, setCache, CacheKeys } from '../cache';

const DEFAULT_SHOP_NAME = 'My Shop';

interface UseShopReturn {
  shop: Shop | null;
  loading: boolean;
  error: string | null;
  hasShop: boolean;
  updateShop: (updates: Partial<Shop>) => Promise<void>;
  createShop: (shopData: Omit<Shop, 'id' | 'user_id' | 'created_at' | 'receipts_this_month'>) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for shop profile management
 * - Uses authenticated user ID when logged in
 * - Auto-creates anonymous session for guests
 * - Auto-creates shop if none exists
 * - Provides shop CRUD operations
 */
export function useShop(): UseShopReturn {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const initRef = useRef(false);
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  /**
   * Get owner ID - requires authenticated user
   */
  const getOwnerId = useCallback(async (): Promise<string | null> => {
    // If user is logged in, use their ID
    if (user?.id) {
      return user.id;
    }

    // Try to get existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }

    // No user - auth guard will redirect to login
    return null;
  }, [user]);

  /**
   * Fetch shop by owner ID with caching
   * Cache-first: loads from cache immediately, then fetches fresh data
   */
  const fetchShop = useCallback(async (owId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load from cache first (instant)
      const cacheKey = `${CacheKeys.SHOP}:${owId}`;
      const cached = await getCache<Shop>(cacheKey);
      if (cached) {
        setShop(cached);
      }

      // Then fetch fresh data from network
      const { data, error: fetchError } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', owId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No shop found - auto-create one for new users
          if (__DEV__) console.log('No shop found, creating default shop...');
          const { data: newShop, error: createError } = await supabase
            .from('shops')
            .insert({
              user_id: owId,
              name: DEFAULT_SHOP_NAME,
              is_pro: false,
              receipts_this_month: 0,
            })
            .select()
            .single();

          if (createError) {
            if (__DEV__) console.error('Error creating default shop:', createError);
            setShop(null);
          } else {
            if (__DEV__) console.log('Default shop created:', newShop);
            setShop(newShop);
            // Cache the new shop
            await setCache(cacheKey, newShop, 10 * 60 * 1000); // 10 min TTL
          }
        } else {
          throw fetchError;
        }
      } else {
        setShop(data);
        // Update cache (10 minutes TTL)
        await setCache(cacheKey, data, 10 * 60 * 1000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shop';
      setError(message);
      if (__DEV__) console.error('Error fetching shop:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new shop
   */
  const createShop = useCallback(async (
    shopData: Omit<Shop, 'id' | 'user_id' | 'created_at' | 'receipts_this_month'>
  ) => {
    if (!ownerId) {
      throw new Error('Owner ID not initialized');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('shops')
        .insert({
          ...shopData,
          user_id: ownerId,
          receipts_this_month: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setShop(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create shop';
      setError(message);
      if (__DEV__) console.error('Error creating shop:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  /**
   * Update shop (clears cache on update)
   */
  const updateShop = useCallback(async (updates: Partial<Shop>) => {
    if (!shop || !ownerId) {
      throw new Error('No shop to update');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('shops')
        .update(updates)
        .eq('id', shop.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setShop(data);

      // Update cache
      const cacheKey = `${CacheKeys.SHOP}:${ownerId}`;
      await setCache(cacheKey, data, 10 * 60 * 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update shop';
      setError(message);
      if (__DEV__) console.error('Error updating shop:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [shop, ownerId]);

  /**
   * Refetch shop data
   */
  const refetch = useCallback(async () => {
    if (ownerId) {
      await fetchShop(ownerId);
    }
  }, [ownerId, fetchShop]);

  /**
   * Initialize on mount or when user changes
   */
  useEffect(() => {
    const initialize = async () => {
      const currentUserId = user?.id ?? null;

      // Skip if already initialized for this user
      if (initRef.current && lastUserIdRef.current === currentUserId) {
        return;
      }

      // Reset state when user changes
      if (lastUserIdRef.current !== undefined && lastUserIdRef.current !== currentUserId) {
        setShop(null);
        setOwnerId(null);
        setError(null);
      }

      // Set flags IMMEDIATELY to prevent concurrent calls (race condition fix)
      initRef.current = true;
      lastUserIdRef.current = currentUserId;

      // Then do async work
      const owId = await getOwnerId();
      if (owId) {
        setOwnerId(owId);
        await fetchShop(owId);
      } else {
        setLoading(false);
        setError('Could not initialize user session');
      }
    };

    initialize();
  }, [getOwnerId, fetchShop, user]);

  return {
    shop,
    loading,
    error,
    hasShop: !!shop,
    updateShop,
    createShop,
    refetch,
  };
}
