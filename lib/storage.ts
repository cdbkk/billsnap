import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoreType, ShopMode } from '../types';
import { supabase } from './supabase';

const ONBOARDING_KEY = 'hasCompletedOnboarding';
const ONBOARDING_DATA_KEY = 'onboardingData';

export interface OnboardingData {
  storeType: StoreType;
  shopMode: ShopMode;
  shopName: string;
  promptPayId: string;
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  try {
    // Save locally
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');

    // Sync to Supabase - update the user's shop with onboarding_completed_at
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('shops')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error && __DEV__) {
        console.error('Failed to sync onboarding state to Supabase:', error);
      } else if (__DEV__) {
        console.log('Onboarding state synced to Supabase');
      }
    }
  } catch (error) {
    if (__DEV__) console.error('Failed to save onboarding state:', error);
  }
}

export async function saveOnboardingData(data: OnboardingData): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    if (__DEV__) console.error('Failed to save onboarding data:', error);
  }
}

export async function getOnboardingData(): Promise<OnboardingData | null> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function clearOnboardingData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
  } catch (error) {
    if (__DEV__) console.error('Failed to clear onboarding data:', error);
  }
}
