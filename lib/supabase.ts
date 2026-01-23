import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Database } from '../types';

// Use env vars - no hardcoded fallbacks for security
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local file.');
}

// Secure storage adapter for mobile with 2KB limit fallback
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }

    // Try SecureStore first
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value) return value;
    } catch (error) {
      console.warn('SecureStore read failed, trying AsyncStorage fallback:', error);
    }

    // Fallback to AsyncStorage
    return await AsyncStorage.getItem(key);
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }

    // Check if value exceeds 2KB limit (SecureStore limit on iOS)
    const sizeInBytes = new Blob([value]).size;
    const SIZE_LIMIT = 2048; // 2KB in bytes

    if (sizeInBytes > SIZE_LIMIT) {
      console.warn(
        `Value for key "${key}" exceeds 2KB (${sizeInBytes} bytes). Using AsyncStorage instead of SecureStore.`
      );
      await AsyncStorage.setItem(key, value);
      return;
    }

    // Try SecureStore first
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      // If SecureStore fails (e.g., size limit hit), fall back to AsyncStorage
      console.warn(
        `SecureStore write failed for key "${key}", falling back to AsyncStorage:`,
        error
      );
      await AsyncStorage.setItem(key, value);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }

    // Remove from both SecureStore and AsyncStorage to be safe
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      // Ignore errors, item might not exist in SecureStore
    }

    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      // Ignore errors, item might not exist in AsyncStorage
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
