import { useState, useCallback, useMemo } from 'react';
import { ReceiptItem } from '../../types';
import { calculateReceiptTotals, generateItemId } from '../receipt';

interface UseReceiptFormReturn {
  items: ReceiptItem[];
  includeVAT: boolean;
  subtotal: number;
  vat: number;
  total: number;
  addItem: (name: string, price: number, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<ReceiptItem>) => void;
  setIncludeVAT: (include: boolean) => void;
  resetForm: () => void;
  hasItems: boolean;
}

/**
 * Hook for receipt form state management
 * - Manages receipt items array
 * - Handles VAT toggle
 * - Calculates totals automatically
 * - Provides CRUD operations for items
 */
export function useReceiptForm(): UseReceiptFormReturn {
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [includeVAT, setIncludeVAT] = useState(false);

  /**
   * Add new item to receipt
   */
  const addItem = useCallback((name: string, price: number, quantity: number) => {
    const newItem: ReceiptItem = {
      id: generateItemId(),
      name: name.trim(),
      price,
      quantity,
    };

    setItems(prev => [...prev, newItem]);
  }, []);

  /**
   * Remove item from receipt
   */
  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  /**
   * Update existing item
   */
  const updateItem = useCallback((itemId: string, updates: Partial<ReceiptItem>) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, ...updates }
          : item
      )
    );
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setItems([]);
    setIncludeVAT(false);
  }, []);

  /**
   * Calculate totals (memoized for performance)
   */
  const { subtotal, vat, total } = useMemo(() => {
    return calculateReceiptTotals(items, includeVAT);
  }, [items, includeVAT]);

  /**
   * Check if form has items
   */
  const hasItems = items.length > 0;

  return {
    items,
    includeVAT,
    subtotal,
    vat,
    total,
    addItem,
    removeItem,
    updateItem,
    setIncludeVAT,
    resetForm,
    hasItems,
  };
}
