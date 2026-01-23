import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, FontSize } from '../../constants/theme';
import { useTranslation } from '../../lib/i18n';

// Custom tab label that updates with language changes
function TabLabel({ focused, label }: { focused: boolean; label: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: focused ? '600' : '500',
        color: focused ? Colors.primary : Colors.textMuted,
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Ensure minimum bottom padding for gesture navigation
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: 56 + bottomPadding, // Base height + safe area
          // Shadow for subtle elevation
          ...Shadows.sm,
        },
        tabBarItemStyle: {
          minHeight: 48, // 48px touch target for accessibility
          minWidth: 48,
          justifyContent: 'center',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_home'),
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label={t('tab_home')} />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t('tab_create'),
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label={t('tab_create')} />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: t('tab_items'),
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label={t('tab_items')} />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'cube' : 'cube-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tab_history'),
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label={t('tab_history')} />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tab_settings'),
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label={t('tab_settings')} />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Hide stats from tab bar - accessible via dashboard */}
      <Tabs.Screen
        name="stats"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
