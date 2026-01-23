import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../constants/theme';
import { Receipt } from '../types';
import { formatPrice, formatDate } from '../lib/receipt';

interface ReceiptCardProps {
  receipt: Receipt;
  onPress: (receipt: Receipt) => void;
}

export default function ReceiptCard({ receipt, onPress }: ReceiptCardProps) {
  const itemCount = receipt.items.length;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(receipt)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.receiptNumber}>#{receipt.receipt_number}</Text>
            <Text style={styles.date}>{formatDate(receipt.created_at)}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.total}>{formatPrice(receipt.total)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.itemCount}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>

        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptNumber: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  total: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  itemCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
