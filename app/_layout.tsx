import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from '../lib/auth/AuthContext';
import { LanguageProvider } from '../lib/i18n';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Colors } from '../constants/theme';
import { hasCompletedOnboarding } from '../lib/storage';
import { linking, parseDeepLink } from '../lib/linking';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isOnboardingDone, setIsOnboardingDone] = useState<boolean | null>(null);

  // Check onboarding status on mount, when user changes, or when navigating
  useEffect(() => {
    hasCompletedOnboarding().then(setIsOnboardingDone);
  }, [user, segments]);

  // Handle deep links
  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [user, isOnboardingDone]);

  // Parse and navigate to deep link
  const handleDeepLink = (url: string) => {
    if (__DEV__) console.log('Received deep link:', url);

    const parsed = parseDeepLink(url);
    if (!parsed) {
      if (__DEV__) console.log('Invalid deep link format');
      return;
    }

    // Don't navigate if user not authenticated (except for login/OAuth)
    if (!user && !parsed.route.includes('login')) {
      if (__DEV__) console.log('Deep link blocked - user not authenticated');
      return;
    }

    // Don't navigate if onboarding not done (except for onboarding route)
    if (user && !isOnboardingDone && !parsed.route.includes('onboarding')) {
      if (__DEV__) console.log('Deep link blocked - onboarding not complete');
      return;
    }

    // Navigate to the deep link route
    if (__DEV__) console.log('Navigating to deep link route:', parsed.route);
    router.push(parsed.route as any);
  };

  useEffect(() => {
    if (loading || isOnboardingDone === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    // Flow: Login first → Onboarding → Main app

    if (!user) {
      // Not logged in - go to login (unless already there)
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (!isOnboardingDone) {
      // Logged in but onboarding not done - go to onboarding
      if (!inOnboarding) {
        router.replace('/onboarding');
      }
    } else {
      // Logged in and onboarding done - go to main app
      if (inAuthGroup || inOnboarding) {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments, isOnboardingDone]);

  // Show loading spinner while checking auth or onboarding status
  if (loading || isOnboardingDone === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit-shop" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
});
