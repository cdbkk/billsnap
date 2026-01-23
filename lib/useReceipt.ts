import { useState, useRef } from 'react';
import { Shop, ReceiptItem } from '../types';
import {
  calculateReceiptTotals,
  generateReceiptNumber,
} from './receipt';
import { captureAndShare, captureAndSave } from './share';

/**
 * Hook for managing receipt state and actions
 * Simplifies receipt generation and sharing
 */
export function useReceipt(shop: Shop, items: ReceiptItem[], includeVAT: boolean = false) {
  const [isProcessing, setIsProcessing] = useState(false);
  const receiptRef = useRef(null);

  // Calculate totals
  const { subtotal, vat, total } = calculateReceiptTotals(items, includeVAT);

  // Generate receipt number
  const receiptNumber = generateReceiptNumber(shop.receipts_this_month);

  // Prepare receipt data
  const receipt = {
    items,
    subtotal,
    vat,
    total,
    receiptNumber,
    createdAt: new Date(),
  };

  // Share receipt
  const share = async () => {
    if (!receiptRef.current) {
      if (__DEV__) console.error('Receipt ref is not set');
      return;
    }

    setIsProcessing(true);
    try {
      await captureAndShare(receiptRef.current);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save to gallery
  const save = async () => {
    if (!receiptRef.current) {
      if (__DEV__) console.error('Receipt ref is not set');
      return;
    }

    setIsProcessing(true);
    try {
      await captureAndSave(receiptRef.current);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    receipt,
    receiptRef,
    isProcessing,
    share,
    save,
  };
}

/**
 * Example usage:
 *
 * function MyScreen() {
 *   const shop = { ... };
 *   const items = [ ... ];
 *
 *   const { receipt, receiptRef, isProcessing, share, save } = useReceipt(
 *     shop,
 *     items,
 *     true // include VAT
 *   );
 *
 *   return (
 *     <>
 *       <ReceiptPreview ref={receiptRef} shop={shop} receipt={receipt} />
 *       <Button onPress={share} disabled={isProcessing}>Share</Button>
 *       <Button onPress={save} disabled={isProcessing}>Save</Button>
 *     </>
 *   );
 * }
 */
