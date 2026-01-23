import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Animated skeleton loading placeholder
 * Use for loading states instead of spinners
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.md,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton for a stat card
 */
export function SkeletonStatCard() {
  return (
    <View style={styles.statCard}>
      <Skeleton width={40} height={40} borderRadius={BorderRadius.lg} />
      <Skeleton width={80} height={12} style={{ marginTop: Spacing.sm }} />
      <Skeleton width={100} height={24} style={{ marginTop: Spacing.xs }} />
      <Skeleton width={60} height={12} style={{ marginTop: Spacing.xs }} />
    </View>
  );
}

/**
 * Skeleton for a receipt list item
 */
export function SkeletonReceiptItem() {
  return (
    <View style={styles.receiptItem}>
      <View style={styles.receiptLeft}>
        <Skeleton width={40} height={40} borderRadius={BorderRadius.lg} />
        <View style={styles.receiptInfo}>
          <Skeleton width={120} height={16} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.receiptRight}>
        <Skeleton width={70} height={16} />
        <Skeleton width={50} height={20} borderRadius={BorderRadius.full} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/**
 * Skeleton for monthly overview
 */
export function SkeletonMonthlyOverview() {
  return (
    <View style={styles.monthlyCard}>
      <View style={styles.monthlyHeader}>
        <Skeleton width={140} height={18} />
        <Skeleton width={80} height={14} />
      </View>
      <View style={styles.monthlyStats}>
        <View style={styles.monthlyStat}>
          <Skeleton width={80} height={20} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.monthlyDivider} />
        <View style={styles.monthlyStat}>
          <Skeleton width={40} height={20} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.monthlyDivider} />
        <View style={styles.monthlyStat}>
          <Skeleton width={60} height={20} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for an item row in items management
 */
export function SkeletonItemRow() {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemLeft}>
        <Skeleton width={44} height={44} borderRadius={BorderRadius.lg} />
        <View style={styles.itemInfo}>
          <Skeleton width={100} height={16} />
          <Skeleton width={60} height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton width={70} height={18} />
    </View>
  );
}

/**
 * Skeleton for preset item chips
 */
export function SkeletonChip() {
  return (
    <Skeleton
      width={80}
      height={36}
      borderRadius={BorderRadius.full}
      style={{ marginRight: Spacing.sm }}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.skeleton,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  receiptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  receiptInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  receiptRight: {
    alignItems: 'flex-end',
  },
  monthlyCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  monthlyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyStat: {
    flex: 1,
    alignItems: 'center',
  },
  monthlyDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
});
