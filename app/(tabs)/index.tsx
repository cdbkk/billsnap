import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  Shadows,
  TouchTarget,
  ActiveScale,
  typography,
} from '../../constants/theme';
import { formatPrice } from '../../lib/receipt';
import { useShop, useReceipts } from '../../lib/hooks';
import { useTranslation } from '../../lib/i18n';
import { haptic } from '../../lib/haptics';
import {
  SkeletonStatCard,
  SkeletonReceiptItem,
  EmptyState,
} from '../../components/ui';

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { shop, loading: shopLoading, error: shopError, refetch: refetchShop } = useShop();
  const { receipts, todayTotal, loading: receiptsLoading, error: receiptsError, refetch: refetchReceipts } = useReceipts(shop?.id);
  const [refreshing, setRefreshing] = useState(false);

  const error = shopError || receiptsError;
  const loading = shopLoading || receiptsLoading;

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchShop?.(),
      refetchReceipts?.(),
    ].filter(Boolean));
    setRefreshing(false);
  };

  // Calculate statistics from receipts
  const todayReceipts = receipts.filter(r => {
    const receiptDate = new Date(r.created_at).toDateString();
    const today = new Date().toDateString();
    return receiptDate === today;
  });

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekReceipts = receipts.filter(r => new Date(r.created_at) >= weekStart);
  const weekTotal = weekReceipts.reduce((sum, r) => sum + r.total, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthReceipts = receipts.filter(r => new Date(r.created_at) >= monthStart);
  const monthTotal = monthReceipts.reduce((sum, r) => sum + r.total, 0);

  // Get recent receipts (last 4)
  const recentReceipts = receipts.slice(0, 4);

  const getStatusColor = (status: string) => {
    return status === 'paid' ? Colors.paid : Colors.pending;
  };

  const getStatusBg = (status: string) => {
    return status === 'paid' ? Colors.paidBg : Colors.pendingBg;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('greeting')}</Text>
            {loading ? (
              <View style={styles.shopNameSkeleton} />
            ) : (
              <Text style={styles.shopName}>{shop?.name || 'BillSnap'}</Text>
            )}
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Hero Stats */}
        <View style={styles.heroContainer}>
          {loading ? (
            <SkeletonStatCard />
          ) : (
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={styles.heroIconContainer}>
                  <Ionicons name="cash-outline" size={20} color={Colors.white} />
                </View>
                <Text style={styles.heroLabel}>{t('today_sales')}</Text>
              </View>
              <Text style={styles.heroValue}>{formatPrice(todayTotal)}</Text>
              <Text style={styles.heroSubtext}>{todayReceipts.length} {t('orders')}</Text>

              <View style={styles.heroDivider} />

              <View style={styles.heroSecondary}>
                <View style={styles.heroSecondaryItem}>
                  <Text style={styles.heroSecondaryLabel}>{t('this_week')}</Text>
                  <Text style={styles.heroSecondaryValue}>{formatPrice(weekTotal)}</Text>
                </View>
                <View style={styles.heroSecondaryDivider} />
                <View style={styles.heroSecondaryItem}>
                  <Text style={styles.heroSecondaryLabel}>{t('this_month')}</Text>
                  <Text style={styles.heroSecondaryValue}>{formatPrice(monthTotal)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <AnimatedButton
            containerStyle={styles.actionButtonContainer}
            style={[styles.actionButton, styles.actionButtonQuick]}
            onPress={() => router.push({ pathname: '/(tabs)/create', params: { mode: 'quick' } })}
          >
            <View style={styles.actionIconQuick}>
              <Ionicons name="flash" size={24} color={Colors.white} />
            </View>
            <Text style={styles.actionButtonTitleLight}>Quick Sale</Text>
          </AnimatedButton>

          <AnimatedButton
            containerStyle={styles.actionButtonContainer}
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/create')}
          >
            <View style={styles.actionIconPrimary}>
              <Ionicons name="receipt" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionButtonTitle}>{t('tab_create')}</Text>
          </AnimatedButton>

          <AnimatedButton
            containerStyle={styles.actionButtonContainer}
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/items')}
          >
            <View style={styles.actionIconSecondary}>
              <Ionicons name="cube" size={22} color={Colors.accent} />
            </View>
            <Text style={styles.actionButtonTitle}>{t('tab_items')}</Text>
          </AnimatedButton>
        </View>

        {/* Recent Receipts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recent_receipts')}</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/(tabs)/history')}
            >
              <Text style={styles.viewAllText}>{t('view_all')}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.recentList}>
              <SkeletonReceiptItem />
              <SkeletonReceiptItem />
              <SkeletonReceiptItem />
            </View>
          ) : recentReceipts.length === 0 ? (
            <View style={styles.recentList}>
              <EmptyState
                icon="receipt-outline"
                title={t('no_receipts')}
                description={t('create_first_receipt_hint')}
              />
            </View>
          ) : (
            <View style={styles.recentList}>
              {recentReceipts.map((receipt, index) => (
                <AnimatedButton
                  key={receipt.id}
                  style={[
                    styles.recentItem,
                    index === recentReceipts.length - 1 && styles.recentItemLast,
                  ]}
                  onPress={() => {}}
                >
                  <View style={styles.recentLeft}>
                    <View style={[styles.recentIcon, { backgroundColor: getStatusBg(receipt.status || 'paid') }]}>
                      <Ionicons
                        name="receipt-outline"
                        size={18}
                        color={getStatusColor(receipt.status || 'paid')}
                      />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentCustomer} numberOfLines={1}>
                        {receipt.notes || receipt.customer_name || t('guest_customer')}
                      </Text>
                      <Text style={styles.recentTime}>{formatTime(receipt.created_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={styles.recentAmount}>{formatPrice(receipt.total)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(receipt.status || 'paid') }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(receipt.status || 'paid') }]}>
                        {(receipt.status || 'paid') === 'paid' ? t('status_paid') : t('status_pending')}
                      </Text>
                    </View>
                  </View>
                </AnimatedButton>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

    </SafeAreaView>
  );
}

// Animated button component for touch feedback
function AnimatedButton({
  children,
  style,
  containerStyle,
  onPress,
}: {
  children: React.ReactNode;
  style?: any;
  containerStyle?: any;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    haptic.light();
    Animated.spring(scale, {
      toValue: ActiveScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={style}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    ...typography.bodySmall,
    marginBottom: 2,
  },
  shopName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  shopNameSkeleton: {
    width: 120,
    height: 26,
    backgroundColor: Colors.skeleton,
    borderRadius: BorderRadius.sm,
  },
  headerRight: {
    width: 40,
  },
  heroContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  heroIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  heroValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 2,
  },
  heroSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  heroSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroSecondaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroSecondaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  heroSecondaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  heroSecondaryValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionButtonContainer: {
    flex: 1,
  },
  actionButton: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    minHeight: 76,
    justifyContent: 'center',
    gap: 4,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionButtonQuick: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionIconQuick: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconPrimary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconSecondary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  actionButtonTitleLight: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TouchTarget.minimum,
    paddingHorizontal: Spacing.sm,
  },
  viewAllText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  recentList: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recentItemLast: {
    borderBottomWidth: 0,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  recentCustomer: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  recentTime: {
    ...typography.caption,
  },
  recentRight: {
    alignItems: 'flex-end',
  },
  recentAmount: {
    ...typography.price,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptyStateText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  emptyStateSmall: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.error,
  },
});
