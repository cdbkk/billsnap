import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../supabase';

/**
 * Google Sign-In Hook
 *
 * IMPORTANT: Production Build Requirements
 * =========================================
 * This implementation uses web-based OAuth flow which works in Expo Go development mode.
 * For production standalone builds, you'll need to configure native Google Sign-In:
 *
 * 1. iOS Setup:
 *    - Add Google Sign-In iOS SDK via expo-google-sign-in
 *    - Configure OAuth Client ID in Google Cloud Console (iOS app type)
 *    - Add URL scheme to app.json: com.googleusercontent.apps.[REVERSED_CLIENT_ID]
 *    - Update Info.plist with CFBundleURLSchemes
 *
 * 2. Android Setup:
 *    - Configure OAuth Client ID in Google Cloud Console (Android app type)
 *    - Add SHA-1 fingerprint from your keystore
 *    - Install @react-native-google-signin/google-signin
 *    - Configure google-services.json with your app's package name
 *
 * 3. Alternative (simpler):
 *    - Use expo-auth-session with proper Google provider configuration
 *    - Configure OAuth 2.0 redirect URIs in Google Cloud Console
 *    - Add billsnap:// scheme to allowed redirect URIs
 *
 * Current Implementation:
 * - Works in Expo Go with web OAuth flow
 * - Uses Supabase's OAuth endpoint
 * - Handles token extraction from callback URL
 * - Suitable for development and testing
 */

// Complete auth session when returning from browser
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create redirect URI - works for both Expo Go and standalone
      const redirectUri = makeRedirectUri({
        // In Expo Go, this uses exp:// scheme automatically
        // In standalone builds, uses the app's scheme
      });

      if (__DEV__) console.log('Redirect URI:', redirectUri);

      // Use Supabase's OAuth flow - handles everything properly
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) throw oauthError;
      if (!data.url) throw new Error('No OAuth URL returned');

      // Open browser for Google sign-in
      if (__DEV__) console.log('Opening auth URL:', data.url);
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri
      );

      // Auth result type logged (no sensitive data)
      if (__DEV__) console.log('Auth result type:', result.type);

      if (result.type === 'success') {
        // Extract the URL and get session
        const url = result.url;

        // Validate callback URL matches expected redirect URI before parsing tokens
        // This prevents token extraction from malicious redirect URLs
        if (!url.startsWith(redirectUri.split('?')[0]) &&
            !url.startsWith('exp://') &&
            !url.startsWith('billsnap://')) {
          throw new Error('Invalid callback URL - possible redirect attack');
        }

        // Parse the URL to get tokens - check both hash and query params
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        // Try hash first (fragment)
        if (url.includes('#')) {
          const hashParams = new URLSearchParams(url.split('#')[1]);
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        }

        // Try query params if no hash tokens
        if (!accessToken && url.includes('?')) {
          const queryParams = new URLSearchParams(url.split('?')[1].split('#')[0]);
          accessToken = queryParams.get('access_token');
          refreshToken = queryParams.get('refresh_token');
        }

        if (accessToken) {
          // Set the session in Supabase
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) throw sessionError;

          return { success: true, user: sessionData.user };
        } else {
          // Don't log URL - contains sensitive OAuth tokens
          if (__DEV__) console.error('No access token found in callback');
          throw new Error('Authentication failed: No access token received from Google. Please try again.');
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        return { success: false, cancelled: true };
      }

      throw new Error('Google sign-in was not completed. Please try again.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      if (__DEV__) console.error('Google sign-in error:', message);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    loading,
    error,
    isReady: true,
  };
}
