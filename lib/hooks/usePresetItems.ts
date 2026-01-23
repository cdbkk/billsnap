import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { PresetItem } from '../../types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UsePresetItemsReturn {
  items: PresetItem[];
  loading: boolean;
  error: string | null;
  addItem: (item: Omit<PresetItem, 'id'>) => Promise<PresetItem>;
  updateItem: (id: string, updates: Partial<PresetItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for preset items CRUD operations
 * - Fetch all preset items for a shop
 * - Add, update, delete items
 * - Realtime sync across all screens
 */
export function usePresetItems(shopId?: string): UsePresetItemsReturn {
  const [items, setItems] = useState<PresetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Fetch all preset items for a shop
   */
  const fetchItems = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('preset_items')
        .select('*')
        .eq('shop_id', id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setItems(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch items';
      setError(message);
      if (__DEV__) console.error('Error fetching preset items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Subscribe to realtime changes for this shop's items
   */
  useEffect(() => {
    if (!shopId) return;

    // Create realtime subscription
    const channel = supabase
      .channel(`preset_items:${shopId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'preset_items',
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems(prev => [payload.new as PresetItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev =>
              prev.map(item =>
                item.id === payload.new.id ? (payload.new as PresetItem) : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [shopId]);

  /**
   * Add new preset item
   */
  const addItem = useCallback(async (item: Omit<PresetItem, 'id'>): Promise<PresetItem> => {
    if (!shopId) {
      throw new Error('Shop ID not provided');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('preset_items')
        .insert({
          shop_id: shopId,
          name: item.name,
          price: item.price,
          category: item.category,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to local state
      setItems(prev => [data, ...prev]);

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item';
      setError(message);
      if (__DEV__) console.error('Error adding preset item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  /**
   * Update preset item
   */
  const updateItem = useCallback(async (id: string, updates: Partial<PresetItem>) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('preset_items')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update item';
      setError(message);
      if (__DEV__) console.error('Error updating preset item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete preset item
   */
  const deleteItem = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('preset_items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Remove from local state
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete item';
      setError(message);
      if (__DEV__) console.error('Error deleting preset item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refetch items
   */
  const refetch = useCallback(async () => {
    if (shopId) {
      await fetchItems(shopId);
    }
  }, [shopId, fetchItems]);

  /**
   * Auto-fetch when shopId changes
   */
  useEffect(() => {
    if (shopId) {
      fetchItems(shopId);
    }
  }, [shopId, fetchItems]);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refetch,
  };
}
