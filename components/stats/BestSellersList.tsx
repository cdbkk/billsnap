import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../../constants/theme';
import { formatPrice } from '../../lib/receipt';
import { useTranslation } from '../../lib/i18n';

export interface BestSellerItem {
  name: string;
  quantitySold: number;
  totalRevenue: number;
}

interface BestSellersListProps {
  items: BestSellerItem[];
  loading?: boolean;
  isPro?: boolean;
}

// Medal colors for top 3
const RANK_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

export function BestSellersList({ items, loading, isPro = false }: BestSellersListProps) {
  const { t } = useTranslation();

  // Show only top 5 for free users, all for pro
  const displayItems = isPro ? items : items.slice(0, 5);

  const renderItem = ({ item, index }: { item: BestSellerItem; index: number }) => {
    const rank = index + 1;
    const isTopThree = rank <= 3;
    const medalColor = RANK_COLORS[rank as keyof typeof RANK_COLORS];

    return (
      <View style={styles.item}>
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <View style={[styles.medal, { backgroundColor: `${medalColor}20` }]}>
              <Ionicons name="trophy" size={20} color={medalColor} />
            </View>
          ) : (
            <View style={styles.rankNumber}>
              <Text style={styles.rankText}>{rank}</Text>
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemStats}>
            {item.quantitySold} {t('items_sold')} • {formatPrice(item.totalRevenue)}
          </Text>
        </View>

        <View style={styles.revenueContainer}>
          <Text style={styles.revenue}>{formatPrice(item.totalRevenue)}</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyText}>{t('no_sales_yet')}</Text>
      <Text style={styles.emptySubtext}>{t('start_selling')}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (displayItems.length === 0) {
    return renderEmpty();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('best_sellers')}</Text>
        {!isPro && items.length > 5 && (
          <Text style={styles.headerSubtitle}>
            {t('top_5_items')} • {items.length - 5} more with Pro
          </Text>
        )}
      </View>

      <FlatList
        data={displayItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    minHeight: 60,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  medal: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemStats: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  revenueContainer: {
    alignItems: 'flex-end',
  },
  revenue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
