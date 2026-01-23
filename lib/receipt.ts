import { ReceiptItem, VAT_RATE } from '../types';

/**
 * Generate a unique receipt number
 * Format: YYYYMMDD-NNN
 */
export function generateReceiptNumber(existingCount: number = 0): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const sequence = String(existingCount + 1).padStart(3, '0');

  return `${year}${month}${day}-${sequence}`;
}

/**
 * Calculate subtotal from items
 */
export function calculateSubtotal(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
}

/**
 * Calculate VAT amount (7%)
 */
export function calculateVAT(subtotal: number, includeVAT: boolean = false): number {
  if (!includeVAT) return 0;
  return subtotal * VAT_RATE;
}

/**
 * Calculate total
 */
export function calculateTotal(subtotal: number, vat: number): number {
  return subtotal + vat;
}

/**
 * Calculate all receipt totals
 */
export function calculateReceiptTotals(items: ReceiptItem[], includeVAT: boolean = false) {
  const subtotal = calculateSubtotal(items);
  const vat = calculateVAT(subtotal, includeVAT);
  const total = calculateTotal(subtotal, vat);

  return { subtotal, vat, total };
}

/**
 * Format price in Thai Baht
 */
export function formatPrice(amount: number): string {
  return `฿${amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Format date in Thai format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate unique ID for items
 */
export function generateItemId(): string {
  return Math.random().toString(36).substring(2, 9);
}
