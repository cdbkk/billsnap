/**
 * Deep Linking Configuration for BillSnap
 *
 * Handles billsnap:// URL scheme for:
 * - Opening specific receipts: billsnap://receipt/[id]
 * - Navigation to screens: billsnap://settings, billsnap://new
 * - OAuth redirects from Google sign-in
 */

import * as Linking from 'expo-linking';

/**
 * URL scheme configuration for Expo Router
 */
export const linking = {
  prefixes: [
    Linking.createURL('/'),
    'billsnap://',
    'exp://', // Expo Go development
  ],
  config: {
    screens: {
      // Auth group
      '(auth)': {
        screens: {
          login: 'login',
        },
      },
      // Onboarding
      onboarding: 'onboarding',
      // Main tabs
      '(tabs)': {
        screens: {
          index: '',
          new: 'new',
          receipts: 'receipts',
          settings: 'settings',
        },
      },
      // Receipt detail (modal)
      'receipt/[id]': 'receipt/:id',
      // Shop settings
      'edit-shop': 'edit-shop',
      // Catch-all for deep links that don't match
      '+not-found': '*',
    },
  },
};

/**
 * Parse a billsnap:// URL and extract route information
 * @param url - The deep link URL to parse
 * @returns Route information or null if invalid
 */
export function parseDeepLink(url: string): {
  route: string;
  params?: Record<string, string>;
} | null {
  try {
    const parsed = Linking.parse(url);

    if (__DEV__) {
      console.log('Deep link parsed:', {
        hostname: parsed.hostname,
        path: parsed.path,
        queryParams: parsed.queryParams,
      });
    }

    // Handle receipt deep link: billsnap://receipt/123
    if (parsed.hostname === 'receipt' && parsed.path) {
      const receiptId = parsed.path.replace(/^\//, '');
      return {
        route: `/receipt/${receiptId}`,
      };
    }

    // Handle direct screen links: billsnap://settings, billsnap://new
    if (parsed.hostname && !parsed.path) {
      const validScreens = ['settings', 'new', 'receipts', 'edit-shop'];
      if (validScreens.includes(parsed.hostname)) {
        return {
          route: `/${parsed.hostname}`,
        };
      }
    }

    // Handle OAuth callback (has access_token in query or fragment)
    if (parsed.queryParams?.access_token || url.includes('#access_token')) {
      return {
        route: '/(auth)/login',
        params: parsed.queryParams as Record<string, string>,
      };
    }

    return null;
  } catch (err) {
    if (__DEV__) console.error('Error parsing deep link:', err);
    return null;
  }
}

/**
 * Create a billsnap:// deep link URL
 * @param route - The route to link to (e.g., 'receipt/123', 'settings')
 * @returns Full deep link URL
 */
export function createDeepLink(route: string): string {
  // Remove leading slash if present
  const cleanRoute = route.replace(/^\//, '');
  return `billsnap://${cleanRoute}`;
}

/**
 * Example deep link URLs:
 * - billsnap://receipt/abc123 → Opens receipt detail
 * - billsnap://new → Opens new receipt screen
 * - billsnap://settings → Opens settings
 * - billsnap://receipts → Opens receipts list
 * - billsnap://edit-shop → Opens shop settings
 */
