import PostHog from 'posthog-react-native';

// Initialize PostHog
// Get your API key from: https://posthog.com (free tier = 1M events/month)
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
const POSTHOG_HOST = 'https://us.i.posthog.com'; // or 'https://eu.i.posthog.com' for EU

// Only initialize PostHog if API key is provided
const posthogEnabled = POSTHOG_API_KEY.length > 0;

export const posthog = posthogEnabled
  ? new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      disabled: __DEV__,
    })
  : null;

// Analytics events - all methods are no-ops if PostHog is not configured
export const Analytics = {
  // Auth events
  signUp: (method: 'google' | 'email') => {
    posthog?.capture('user_signed_up', { method });
  },

  signIn: (method: 'google' | 'email') => {
    posthog?.capture('user_signed_in', { method });
  },

  signOut: () => {
    posthog?.capture('user_signed_out');
    posthog?.reset();
  },

  // Onboarding events
  onboardingStarted: () => {
    posthog?.capture('onboarding_started');
  },

  onboardingCompleted: (data: { storeType: string; shopMode: string }) => {
    posthog?.capture('onboarding_completed', data);
  },

  // Receipt events
  receiptCreated: (data: { total: number; itemCount: number; hasPromptPay: boolean }) => {
    posthog?.capture('receipt_created', data);
  },

  receiptShared: (method: 'line' | 'other') => {
    posthog?.capture('receipt_shared', { method });
  },

  receiptExported: (format: 'csv' | 'pdf') => {
    posthog?.capture('receipt_exported', { format });
  },

  // Feature usage
  quickSaleUsed: () => {
    posthog?.capture('quick_sale_used');
  },

  itemAdded: () => {
    posthog?.capture('item_added');
  },

  shopUpdated: () => {
    posthog?.capture('shop_updated');
  },

  promptPaySetup: () => {
    posthog?.capture('promptpay_setup');
  },

  // Screen views
  screenView: (screenName: string) => {
    posthog?.screen(screenName);
  },

  // Identify user (call after sign in)
  identify: (userId: string, traits?: Record<string, any>) => {
    posthog?.identify(userId, traits);
  },
};
