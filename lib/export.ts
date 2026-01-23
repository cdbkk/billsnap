import * as Sharing from 'expo-sharing';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/src/legacy';
import { Platform } from 'react-native';
import { Receipt, ReceiptItem } from '../types';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Downloads a CSV file on web platform
 */
function downloadCSVOnWeb(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportReceiptsToCSV(
  receipts: Receipt[],
  shopName: string,
  dateRange?: { start: Date; end: Date }
): Promise<boolean> {
  try {
    // Filter by date range if provided
    let filtered = receipts;
    if (dateRange) {
      filtered = receipts.filter((r) => {
        const date = new Date(r.created_at);
        return date >= dateRange.start && date <= dateRange.end;
      });
    }

    // Create CSV header
    const headers = [
      'Receipt Number',
      'Date',
      'Time',
      'Customer',
      'Subtotal',
      'VAT',
      'Total',
      'Status',
      'Items',
    ].join(',');

    // Create CSV rows
    const rows = filtered.map((receipt) => {
      const date = new Date(receipt.created_at);
      const items = (receipt.items as ReceiptItem[])
        .map((i) => `${i.name} x${i.quantity}`)
        .join('; ');

      return [
        receipt.receipt_number,
        formatDate(receipt.created_at),
        date.toLocaleTimeString('en-US', { hour12: false }),
        receipt.customer_name || 'Guest',
        receipt.subtotal.toFixed(2),
        receipt.vat.toFixed(2),
        receipt.total.toFixed(2),
        receipt.status || 'paid',
        `"${items}"`, // Quote to handle commas in item names
      ].join(',');
    });

    // Combine header and rows
    const csv = [headers, ...rows].join('\n');

    // Generate filename with date
    const today = new Date().toISOString().split('T')[0];
    const filename = `${shopName.replace(/\s+/g, '-')}-receipts-${today}.csv`;

    // Handle web platform differently
    if (Platform.OS === 'web') {
      downloadCSVOnWeb(csv, filename);
      return true;
    }

    // Native platforms: use FileSystem + Sharing
    const filePath = `${documentDirectory}${filename}`;

    // Write file
    await writeAsStringAsync(filePath, csv, {
      encoding: EncodingType.UTF8,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing not available on this device');
    }

    // Share the file
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Receipts',
    });

    return true;
  } catch (error) {
    if (__DEV__) console.error('Export error:', error);
    throw error;
  }
}
