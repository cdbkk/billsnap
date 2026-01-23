import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../constants/theme';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected || !state.isInternetReachable;

      if (offline !== isOffline) {
        setIsOffline(offline);

        // Animate banner in/out
        Animated.spring(slideAnim, {
          toValue: offline ? 0 : -100,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }).start();
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [isOffline, slideAnim]);

  if (Platform.OS === 'web') {
    // Simple online/offline detection for web
    useEffect(() => {
      const handleOnline = () => {
        setIsOffline(false);
        Animated.spring(slideAnim, {
          toValue: -100,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }).start();
      };

      const handleOffline = () => {
        setIsOffline(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }).start();
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Check initial state
      if (!navigator.onLine) {
        setIsOffline(true);
        slideAnim.setValue(0);
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, [slideAnim]);
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents={isOffline ? 'auto' : 'none'}
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={20} color={Colors.white} />
        <Text style={styles.text}>No internet connection</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
    paddingBottom: Spacing.sm,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  text: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
