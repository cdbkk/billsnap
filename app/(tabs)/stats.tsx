import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { useShop, useReceipts } from '../../lib/hooks';
import { useTranslation } from '../../lib/i18n';
import { ReceiptItem } from '../../types';
import { SalesCard } from '../../components/stats/SalesCard';
import { BestSellersList, BestSellerItem } from '../../components/stats/BestSellersList';
import { ProLockedSection } from '../../components/stats/ProLockedSection';

/**
 * Get Monday of the current week (start of week)
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Calculate week's total from receipts
 */
function calculateWeekTotal(receipts: any[]): { total: number; count: number } {
  const monday = getMonday(new Date());
  monday.setHours(0, 0, 0, 0);

  const weekReceipts = receipts.filter((receipt) => {
    const receiptDate = new Date(receipt.created_at);
    return receiptDate >= monday;
  });

  const total = weekReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
  return { total, count: weekReceipts.length };
}

/**
 * Calculate best sellers from receipts
 */
function calculateBestSellers(receipts: any[]): BestSellerItem[] {
  const itemsMap = new Map<string, { quantity: number; revenue: number }>();

  receipts.forEach((receipt) => {
    const items = receipt.items as ReceiptItem[];
    items.forEach((item) => {
      const existing = itemsMap.get(item.name) || { quantity: 0, revenue: 0 };
      itemsMap.set(item.name, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.price * item.quantity,
      });
    });
  });

  // Convert to array and sort by quantity sold
  const bestSellers: BestSellerItem[] = Array.from(itemsMap.entries())
    .map(([name, stats]) => ({
      name,
      quantitySold: stats.quantity,
      totalRevenue: stats.revenue,
    }))
    .sort((a, b) => b.quantitySold - a.quantitySold);

  return bestSellers;
}

export default function StatsScreen() {
  const { t } = useTranslation();
  const { shop, loading: shopLoading } = useShop();
  const { receipts, todayTotal, loading: receiptsLoading } = useReceipts(shop?.id);

  const isPro = shop?.is_pro ?? false;
  const loading = shopLoading || receiptsLoading;

  // Calculate today's transaction count
  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return receipts.filter(
      (receipt) => new Date(receipt.created_at).toDateString() === today
    ).length;
  }, [receipts]);

  // Calculate week stats
  const weekStats = useMemo(() => {
    return calculateWeekTotal(receipts);
  }, [receipts]);

  // Calculate best sellers
  const bestSellers = useMemo(() => {
    return calculateBestSellers(receipts);
  }, [receipts]);

  const handleUpgradePress = () => {
    Alert.alert(
      t('coming_soon'),
      t('pro_coming_soon'),
      [{ text: t('ok'), style: 'default' }]
    );
  };

  if (shopLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('stats')}</Text>
        {isPro && (
          <View style={styles.proBadge}>
            <Ionicons name="sparkles" size={14} color={Colors.accent} />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Free Tier Features */}
        <View style={styles.section}>
          <SalesCard
            title={t('sales_today')}
            amount={todayTotal}
            transactionCount={todayCount}
            icon="today-outline"
            loading={loading}
          />
        </View>

        <View style={styles.section}>
          <SalesCard
            title={t('sales_this_week')}
            amount={weekStats.total}
            transactionCount={weekStats.count}
            icon="calendar-outline"
            loading={loading}
          />
        </View>

        <View style={styles.section}>
          <BestSellersList items={bestSellers} loading={loading} isPro={isPro} />
        </View>

        {/* Pro Features (always show, locked/blurred for free users) */}
        <View style={styles.section}>
          <ProLockedSection
            feature="Sales by Time"
            type="timeOfDay"
            isPro={isPro}
            onUpgradePress={handleUpgradePress}
          />
        </View>

        <View style={styles.section}>
          <ProLockedSection
            feature="Weekly Trends"
            type="chart"
            isPro={isPro}
            onUpgradePress={handleUpgradePress}
          />
        </View>

        <View style={styles.section}>
          <ProLockedSection
            feature="Best & Worst Days"
            type="days"
            isPro={isPro}
            onUpgradePress={handleUpgradePress}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  proBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
