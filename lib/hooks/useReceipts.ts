import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Receipt, ReceiptItem, Json } from '../../types';
import { Analytics } from '../analytics';
import { getCache, setCache, CacheKeys, getShopCacheKey } from '../cache';
import { queueReceipt, processQueue, isOnline, QueuedReceipt } from '../queue';

interface CreateReceiptData {
  shop_id: string;
  receipt_number: string;
  items: ReceiptItem[];
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  customer_name?: string;
  status?: 'paid' | 'pending' | 'refunded';
}

const RECEIPTS_PER_PAGE = 50;

// Helper to convert DB row to Receipt type
function dbRowToReceipt(row: {
  id: string;
  shop_id: string;
  receipt_number: string;
  items: Json;
  subtotal: number;
  vat: number;
  total: number;
  notes: string | null;
  customer_name?: string | null;
  status?: string | null;
  created_at: string;
}): Receipt {
  return {
    ...row,
    items: row.items as unknown as ReceiptItem[],
    notes: row.notes ?? undefined,
    customer_name: row.customer_name ?? undefined,
    status: (row.status as 'paid' | 'pending' | 'refunded') || 'paid',
  };
}

interface UseReceiptsReturn {
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
  todayTotal: number;
  monthlyCount: number;
  hasMore: boolean;
  queuedCount: number;
  createReceipt: (data: CreateReceiptData) => Promise<Receipt>;
  getReceipts: (shopId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  getTodayTotal: (shopId: string) => Promise<void>;
  getMonthlyCount: (shopId: string) => Promise<void>;
  refetch: () => Promise<void>;
  syncQueue: () => Promise<void>;
}

/**
 * Hook for receipt CRUD operations
 * - Fetch receipts for a shop
 * - Create new receipts
 * - Calculate daily/monthly statistics
 * - Cache-first loading
 * - Offline queue support
 * - Pagination (50 receipts per page)
 */
export function useReceipts(shopId?: string): UseReceiptsReturn {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [page, setPage] = useState(0);

  /**
   * Fetch receipts for a shop with pagination
   * Cache-first: loads from cache immediately, then fetches fresh data
   */
  const getReceipts = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setPage(0);

      // Load from cache first (instant)
      const cacheKey = getShopCacheKey(id, CacheKeys.RECEIPTS);
      const cached = await getCache<Receipt[]>(cacheKey);
      if (cached && cached.length > 0) {
        setReceipts(cached);
        setHasMore(cached.length >= RECEIPTS_PER_PAGE);
      }

      // Then fetch fresh data from network
      const { data, error: fetchError } = await supabase
        .from('receipts')
        .select('*')
        .eq('shop_id', id)
        .order('created_at', { ascending: false })
        .limit(RECEIPTS_PER_PAGE);

      if (fetchError) throw fetchError;

      const receiptsData = (data || []).map(dbRowToReceipt);
      setReceipts(receiptsData);
      setHasMore(receiptsData.length >= RECEIPTS_PER_PAGE);

      // Update cache (5 minutes TTL)
      await setCache(cacheKey, receiptsData, 5 * 60 * 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch receipts';
      setError(message);
      if (__DEV__) console.error('Error fetching receipts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load more receipts (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!shopId || loading || !hasMore) return;

    try {
      setLoading(true);
      const nextPage = page + 1;

      const { data, error: fetchError } = await supabase
        .from('receipts')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .range(nextPage * RECEIPTS_PER_PAGE, (nextPage + 1) * RECEIPTS_PER_PAGE - 1);

      if (fetchError) throw fetchError;

      const newReceipts = (data || []).map(dbRowToReceipt);

      if (newReceipts.length < RECEIPTS_PER_PAGE) {
        setHasMore(false);
      }

      setReceipts(prev => [...prev, ...newReceipts]);
      setPage(nextPage);
    } catch (err) {
      if (__DEV__) console.error('Error loading more receipts:', err);
    } finally {
      setLoading(false);
    }
  }, [shopId, loading, hasMore, page]);

  /**
   * Create new receipt with offline queue support
   * If offline, receipt is queued and synced when connection returns
   */
  const createReceipt = useCallback(async (data: CreateReceiptData): Promise<Receipt> => {
    const online = await isOnline();

    // OFFLINE: Queue receipt for later sync
    if (!online) {
      const queuedReceipt: QueuedReceipt = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        queued_at: new Date().toISOString(),
      };

      await queueReceipt(queuedReceipt);
      setQueuedCount(prev => prev + 1);

      // Create optimistic receipt for UI
      const optimisticReceipt: Receipt = {
        id: queuedReceipt.id,
        shop_id: data.shop_id,
        receipt_number: data.receipt_number,
        items: data.items,
        subtotal: data.subtotal,
        vat: data.vat,
        total: data.total,
        notes: data.notes,
        customer_name: data.customer_name,
        status: data.status || 'paid',
        created_at: new Date().toISOString(),
      };

      // Add to local state
      setReceipts(prev => [optimisticReceipt, ...prev]);

      console.log('Receipt queued (offline):', queuedReceipt.id);
      return optimisticReceipt;
    }

    // ONLINE: Save directly to Supabase
    try {
      setLoading(true);
      setError(null);

      const { data: dbReceipt, error: insertError } = await supabase
        .from('receipts')
        .insert({
          ...data,
          items: data.items as unknown as Json,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const receipt = dbRowToReceipt(dbReceipt);

      // Track analytics
      Analytics.receiptCreated({
        total: receipt.total,
        itemCount: receipt.items.length,
        hasPromptPay: false,
      });

      // Add to local state
      setReceipts(prev => [receipt, ...prev]);

      // Update monthly count
      setMonthlyCount(prev => prev + 1);

      // Update today's total if receipt is from today (use UTC for consistency with getTodayTotal)
      const receiptDate = new Date(receipt.created_at);
      const now = new Date();
      const isToday = (
        receiptDate.getUTCFullYear() === now.getUTCFullYear() &&
        receiptDate.getUTCMonth() === now.getUTCMonth() &&
        receiptDate.getUTCDate() === now.getUTCDate()
      );
      if (isToday) {
        setTodayTotal(prev => prev + receipt.total);
      }

      return receipt;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create receipt';
      setError(message);
      if (__DEV__) console.error('Error creating receipt:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get today's total sales
   */
  const getTodayTotal = useCallback(async (id: string) => {
    try {
      const now = new Date();
      const todayUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0, 0
      ));

      const { data, error: fetchError } = await supabase
        .from('receipts')
        .select('total')
        .eq('shop_id', id)
        .gte('created_at', todayUTC.toISOString());

      if (fetchError) throw fetchError;

      const total = data?.reduce((sum, receipt) => sum + receipt.total, 0) || 0;
      setTodayTotal(total);
    } catch (err) {
      if (__DEV__) console.error('Error fetching today total:', err);
    }
  }, []);

  /**
   * Get this month's receipt count
   */
  const getMonthlyCount = useCallback(async (id: string) => {
    try {
      const now = new Date();
      const firstDayOfMonthUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1,
        0, 0, 0, 0
      ));

      const { count, error: countError } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', id)
        .gte('created_at', firstDayOfMonthUTC.toISOString());

      if (countError) throw countError;

      setMonthlyCount(count || 0);
    } catch (err) {
      if (__DEV__) console.error('Error fetching monthly count:', err);
    }
  }, []);

  /**
   * Sync queued receipts from offline queue
   */
  const syncQueue = useCallback(async () => {
    if (!shopId) return;

    try {
      const online = await isOnline();
      if (!online) {
        if (__DEV__) console.log('Device offline, cannot sync queue');
        return;
      }

      const result = await processQueue(async (queuedReceipt) => {
        // Convert QueuedReceipt to CreateReceiptData and insert
        await supabase
          .from('receipts')
          .insert({
            shop_id: queuedReceipt.shop_id,
            receipt_number: queuedReceipt.receipt_number,
            items: queuedReceipt.items as unknown as Json,
            subtotal: queuedReceipt.subtotal,
            vat: queuedReceipt.vat,
            total: queuedReceipt.total,
            notes: queuedReceipt.notes,
            customer_name: queuedReceipt.customer_name,
            status: queuedReceipt.status,
            // Use original queued timestamp
            created_at: queuedReceipt.queued_at,
          });
      });

      if (result.synced > 0) {
        if (__DEV__) console.log(`Synced ${result.synced} queued receipts`);
        // Refresh receipts after sync
        await refetch();
      }

      if (result.failed > 0) {
        if (__DEV__) console.error(`Failed to sync ${result.failed} receipts`);
      }

      // Update queued count
      const queueSize = await getCache<number>('queue_size') || 0;
      setQueuedCount(queueSize);
    } catch (err) {
      if (__DEV__) console.error('Error syncing queue:', err);
    }
  }, [shopId]);

  /**
   * Refetch all data
   */
  const refetch = useCallback(async () => {
    if (shopId) {
      await Promise.all([
        getReceipts(shopId),
        getTodayTotal(shopId),
        getMonthlyCount(shopId),
      ]);
    }
  }, [shopId, getReceipts, getTodayTotal, getMonthlyCount]);

  /**
   * Auto-fetch when shopId changes
   */
  useEffect(() => {
    if (shopId) {
      refetch();
    }
  }, [shopId, refetch]);

  return {
    receipts,
    loading,
    error,
    todayTotal,
    monthlyCount,
    hasMore,
    queuedCount,
    createReceipt,
    getReceipts,
    loadMore,
    getTodayTotal,
    getMonthlyCount,
    refetch,
    syncQueue,
  };
}
