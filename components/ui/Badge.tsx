import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

interface BadgeProps {
  status: 'paid' | 'pending' | 'refunded';
}

const statusConfig = {
  paid: {
    label: 'Paid',
    backgroundColor: colors.success,
  },
  pending: {
    label: 'Pending',
    backgroundColor: colors.warning,
  },
  refunded: {
    label: 'Refunded',
    backgroundColor: colors.error,
  },
};

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const config = statusConfig[status];

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <Text style={styles.text}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
  },
});
