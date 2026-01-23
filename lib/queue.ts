import AsyncStorage from '@react-native-async-storage/async-storage';
// NOTE: @react-native-community/netinfo needs to be installed
// Run: npx expo install @react-native-community/netinfo
// import NetInfo from '@react-native-community/netinfo';

/**
 * Offline queue for receipt creation
 * - Stores receipts when offline
 * - Syncs when connection is restored
 * - Prevents data loss for street vendors with spotty internet
 */

const QUEUE_KEY = '@billsnap_queue:receipts';

export interface QueuedReceipt {
  id: string; // Local UUID
  shop_id: string;
  receipt_number: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  customer_name?: string;
  status?: 'paid' | 'pending' | 'refunded';
  queued_at: string; // ISO timestamp
}

/**
 * Add receipt to offline queue
 */
export async function queueReceipt(receipt: QueuedReceipt): Promise<void> {
  try {
    const queue = await getQueue();
    queue.push(receipt);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('Receipt queued for offline sync:', receipt.id);
  } catch (error) {
    if (__DEV__) console.error('Error queueing receipt:', error);
    throw error;
  }
}

/**
 * Get all queued receipts
 */
export async function getQueue(): Promise<QueuedReceipt[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    if (__DEV__) console.error('Error reading queue:', error);
    return [];
  }
}

/**
 * Remove receipt from queue after successful sync
 */
export async function removeFromQueue(receiptId: string): Promise<void> {
  try {
    const queue = await getQueue();
    const filtered = queue.filter(r => r.id !== receiptId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    if (__DEV__) console.error('Error removing from queue:', error);
  }
}

/**
 * Clear entire queue (after successful bulk sync)
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    if (__DEV__) console.error('Error clearing queue:', error);
  }
}

/**
 * Get queue size
 */
export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Check if device is online
 * TODO: Uncomment when @react-native-community/netinfo is installed
 */
export async function isOnline(): Promise<boolean> {
  try {
    // TEMPORARY: Always return true until netinfo is installed
    // Once installed, uncomment below:
    // const state = await NetInfo.fetch();
    // return state.isConnected ?? false;
    return true;
  } catch (error) {
    if (__DEV__) console.error('Error checking network status:', error);
    return false;
  }
}

/**
 * Process queue - sync all pending receipts to Supabase
 * Returns number of successfully synced receipts
 */
export async function processQueue(
  syncFunction: (receipt: QueuedReceipt) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  const online = await isOnline();
  if (!online) {
    console.log('Device offline, skipping queue processing');
    return { synced: 0, failed: 0 };
  }

  const queue = await getQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`Processing ${queue.length} queued receipts...`);

  let synced = 0;
  let failed = 0;

  for (const receipt of queue) {
    try {
      await syncFunction(receipt);
      await removeFromQueue(receipt.id);
      synced++;
      console.log(`Synced receipt ${receipt.id}`);
    } catch (error) {
      if (__DEV__) console.error(`Failed to sync receipt ${receipt.id}:`, error);
      failed++;
      // Leave in queue for retry
    }
  }

  console.log(`Queue processing complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
}

/**
 * Setup network listener to auto-process queue when online
 * TODO: Uncomment when @react-native-community/netinfo is installed
 */
export function setupNetworkListener(
  syncFunction: (receipt: QueuedReceipt) => Promise<void>
): (() => void) | null {
  try {
    // TEMPORARY: Return null until netinfo is installed
    // Once installed, uncomment below:
    /*
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('Network reconnected, processing queue...');
        processQueue(syncFunction).catch(console.error);
      }
    });

    return unsubscribe;
    */
    return null;
  } catch (error) {
    if (__DEV__) console.error('Error setting up network listener:', error);
    return null;
  }
}
