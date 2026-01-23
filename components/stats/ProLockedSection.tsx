import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows, ActiveScale } from '../../constants/theme';
import { useTranslation } from '../../lib/i18n';

interface ProLockedSectionProps {
  feature: string;
  type?: 'chart' | 'timeOfDay' | 'days';
  isPro?: boolean;
  onUpgradePress?: () => void;
}

export function ProLockedSection({ feature, type = 'chart', isPro = false, onUpgradePress }: ProLockedSectionProps) {
  const { t } = useTranslation();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: ActiveScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  // Fake chart bars for trend preview
  const renderChartPreview = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {[65, 45, 80, 55, 90, 70, 85].map((height, i) => (
          <View key={i} style={styles.barWrapper}>
            <View style={[styles.chartBar, { height: height }]} />
            <Text style={styles.dayLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // Time of day breakdown preview
  const renderTimePreview = () => (
    <View style={styles.timeContainer}>
      {[
        { icon: 'sunny-outline', label: 'Morning', pct: 25 },
        { icon: 'partly-sunny-outline', label: 'Afternoon', pct: 45 },
        { icon: 'moon-outline', label: 'Evening', pct: 30 },
      ].map((slot, i) => (
        <View key={i} style={styles.timeRow}>
          <Ionicons name={slot.icon as any} size={20} color={Colors.primary} />
          <Text style={styles.timeLabel}>{slot.label}</Text>
          <View style={styles.timeBarBg}>
            <View style={[styles.timeBarFill, { width: `${slot.pct}%` }]} />
          </View>
          <Text style={styles.timePct}>{slot.pct}%</Text>
        </View>
      ))}
    </View>
  );

  // Best/worst days preview
  const renderDaysPreview = () => (
    <View style={styles.daysContainer}>
      <View style={styles.dayRow}>
        <Ionicons name="trending-up" size={24} color={Colors.success} />
        <Text style={styles.dayText}>Best: Saturday</Text>
        <Text style={styles.dayAmount}>฿4,500</Text>
      </View>
      <View style={styles.dayRow}>
        <Ionicons name="trending-down" size={24} color={Colors.error} />
        <Text style={styles.dayText}>Slowest: Tuesday</Text>
        <Text style={styles.dayAmount}>฿1,200</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Section title */}
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>{feature}</Text>
        <View style={styles.proBadge}>
          <Ionicons name="sparkles" size={12} color={Colors.accent} />
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      </View>

      {/* Fake content (blurred) */}
      <View style={styles.previewContent}>
        {type === 'chart' && renderChartPreview()}
        {type === 'timeOfDay' && renderTimePreview()}
        {type === 'days' && renderDaysPreview()}

        {/* Blur overlay - only for non-Pro users */}
        {!isPro && (
          <View style={styles.blurOverlay}>
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={onUpgradePress}
              activeOpacity={1}
            >
              <Animated.View
                style={[
                  styles.upgradeButton,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <Ionicons name="lock-closed" size={18} color={Colors.white} />
                <Text style={styles.upgradeButtonText}>Unlock</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}

        {/* Coming soon for Pro users */}
        {isPro && (
          <View style={styles.comingSoonOverlay}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  proBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.accent,
  },
  previewContent: {
    position: 'relative',
    padding: Spacing.md,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    minHeight: 48,
    ...Shadows.sm,
  },
  upgradeButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  // Chart styles
  chartContainer: {
    paddingVertical: Spacing.sm,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 24,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  dayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  // Time of day styles
  timeContainer: {
    gap: Spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    width: 70,
  },
  timeBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  timeBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  timePct: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    width: 40,
    textAlign: 'right',
  },
  // Days styles
  daysContainer: {
    gap: Spacing.md,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dayText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  dayAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  comingSoonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
