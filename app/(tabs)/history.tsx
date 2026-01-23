import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows, ActiveScale } from '../../constants/theme';
import { Receipt, ReceiptItem } from '../../types';
import { formatPrice } from '../../lib/receipt';
import { useShop, useReceipts } from '../../lib/hooks';
import { useTranslation, useLanguage } from '../../lib/i18n';
import { haptic } from '../../lib/haptics';
import PromptPayQR from '../../components/PromptPayQR';
import { EmptyState } from '../../components/ui';
import { captureAndShare } from '../../lib/share';

type PaymentStatus = 'paid' | 'pending' | 'refunded';

interface ReceiptWithStatus extends Receipt {
  customer_name?: string;
  status: PaymentStatus;
}

const STATUS_STYLES: Record<PaymentStatus, { bg: string; text: string }> = {
  paid: { bg: Colors.paid, text: Colors.white },
  pending: { bg: Colors.pending, text: Colors.white },
  refunded: { bg: Colors.refunded, text: Colors.white },
};

// Animated touchable wrapper component
const AnimatedTouchable = ({ children, onPress, style }: any) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    haptic.light();
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

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

type FilterPeriod = 'all' | 'today' | 'week' | 'month';
type FilterStatus = 'all' | 'paid' | 'pending';

// Filter chip component
function FilterChip({
  label,
  active,
  onPress,
  color
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        active && { backgroundColor: color || Colors.primary }
      ]}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.filterChipText,
        active && { color: Colors.white }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithStatus | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const receiptRef = useRef<View>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  const isThai = language === 'th';

  // Get translated status label
  const getStatusLabel = (status: PaymentStatus): string => {
    const labels: Record<PaymentStatus, string> = {
      paid: t('status_paid'),
      pending: t('status_pending'),
      refunded: t('status_refunded'),
    };
    return labels[status];
  };

  // Get real data from Supabase
  const { shop } = useShop();
  const { receipts, todayTotal, loading, error, refetch } = useReceipts(shop?.id);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const openReceiptDetail = (receipt: ReceiptWithStatus) => {
    setSelectedReceipt(receipt);
    setShowDetailModal(true);
  };

  const closeReceiptDetail = () => {
    setShowDetailModal(false);
    setSelectedReceipt(null);
  };

  const handleShare = async () => {
    haptic.medium();
    await captureAndShare(receiptRef);
  };

  // Check if receipt is from quick mode (single item named "Quick Sale" or a category)
  const isQuickModeReceipt = (receipt: Receipt) => {
    const items = receipt.items as ReceiptItem[];
    return items.length === 1 && items[0].id === 'quick-sale';
  };

  // Filter receipts based on search query, period, and status
  const filteredReceipts = useMemo(() => {
    let result = receipts;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((receipt) => {
        const customerMatch = receipt.customer_name?.toLowerCase().includes(query);
        const receiptMatch = receipt.receipt_number.toLowerCase().includes(query);
        return customerMatch || receiptMatch;
      });
    }

    // Period filter
    if (filterPeriod !== 'all') {
      const now = new Date();
      result = result.filter((receipt) => {
        const receiptDate = new Date(receipt.created_at);
        if (filterPeriod === 'today') {
          return receiptDate.toDateString() === now.toDateString();
        } else if (filterPeriod === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return receiptDate >= weekAgo;
        } else if (filterPeriod === 'month') {
          return receiptDate.getMonth() === now.getMonth() &&
                 receiptDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter((receipt) => receipt.status === filterStatus);
    }

    return result;
  }, [receipts, searchQuery, filterPeriod, filterStatus]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const renderReceiptItem = ({ item }: { item: ReceiptWithStatus }) => {
    const status = STATUS_STYLES[item.status];
    const hasCustomer = !!item.customer_name;

    return (
      <AnimatedTouchable
        style={styles.receiptItem}
        onPress={() => openReceiptDetail(item)}
      >
        <View style={styles.receiptLeft}>
          <View style={[styles.receiptIcon, hasCustomer && styles.receiptIconActive]}>
            <Ionicons
              name={hasCustomer ? 'receipt-outline' : 'person-outline'}
              size={22}
              color={hasCustomer ? Colors.primary : Colors.textPrimary}
            />
          </View>
          <View style={styles.receiptInfo}>
            <Text style={styles.receiptCustomer} numberOfLines={1}>
              {item.customer_name || t('guest_customer')}
            </Text>
            <Text style={styles.receiptMeta}>
              {formatTime(item.created_at)} • Receipt {item.receipt_number}
            </Text>
          </View>
        </View>
        <View style={styles.receiptRight}>
          <Text style={styles.receiptAmount}>{formatPrice(item.total)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.text }]}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
      </AnimatedTouchable>
    );
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null; // Loading state shown separately

    return (
      <EmptyState
        icon={searchQuery ? 'search-outline' : 'receipt-outline'}
        title={searchQuery ? t('no_search_results') : t('no_receipts')}
        description={searchQuery ? t('try_different_search') : t('create_first_receipt_hint')}
      />
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Loading receipts...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
      </View>
      <Text style={styles.emptyTitle}>Error Loading Receipts</Text>
      <Text style={styles.emptyText}>{error || 'Something went wrong'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedTouchable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </AnimatedTouchable>
        <Text style={styles.headerTitle}>Receipt History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Daily Stats Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>DAILY TOTAL SALES</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsAmount}>
            {loading ? '...' : formatPrice(todayTotal)}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customer or receipt ID"
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* Period filters */}
          <FilterChip
            label={t('filter_all')}
            active={filterPeriod === 'all'}
            onPress={() => setFilterPeriod('all')}
          />
          <FilterChip
            label={t('filter_today')}
            active={filterPeriod === 'today'}
            onPress={() => setFilterPeriod('today')}
          />
          <FilterChip
            label={t('filter_week')}
            active={filterPeriod === 'week'}
            onPress={() => setFilterPeriod('week')}
          />
          <FilterChip
            label={t('filter_month')}
            active={filterPeriod === 'month'}
            onPress={() => setFilterPeriod('month')}
          />

          <View style={styles.filterDivider} />

          {/* Status filters */}
          <FilterChip
            label={t('status_paid')}
            active={filterStatus === 'paid'}
            onPress={() => setFilterStatus(filterStatus === 'paid' ? 'all' : 'paid')}
            color={Colors.paid}
          />
          <FilterChip
            label={t('status_pending')}
            active={filterStatus === 'pending'}
            onPress={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
            color={Colors.pending}
          />
        </ScrollView>
      </View>

      {/* Receipt List */}
      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={filteredReceipts}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => renderSectionHeader('TODAY')}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      {/* FAB */}
      <AnimatedTouchable
        style={styles.fab}
        onPress={() => router.push('/(tabs)/create')}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </AnimatedTouchable>

      {/* Receipt Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeReceiptDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeReceiptDetail}
            >
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>

            {selectedReceipt && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View ref={receiptRef} collapsable={false}>
                  {/* Receipt Header */}
                  <Text style={styles.modalTitle}>
                  {isThai ? 'ใบเสร็จ' : 'Receipt'} #{selectedReceipt.receipt_number}
                </Text>
                <Text style={styles.modalDate}>
                  {new Date(selectedReceipt.created_at).toLocaleString(isThai ? 'th-TH' : 'en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Text>

                {/* Status Badge */}
                <View style={[styles.modalStatusBadge, { backgroundColor: STATUS_STYLES[selectedReceipt.status].bg }]}>
                  <Text style={styles.modalStatusText}>{getStatusLabel(selectedReceipt.status)}</Text>
                </View>

                {/* QR Code */}
                {shop?.promptpay_id && (
                  <View style={styles.modalQrSection}>
                    <Text style={styles.modalSectionTitle}>
                      {isThai ? 'QR ชำระเงิน' : 'Payment QR'}
                    </Text>
                    <View style={styles.modalQrContainer}>
                      <PromptPayQR
                        promptPayId={shop.promptpay_id}
                        amount={selectedReceipt.total}
                        size={200}
                      />
                    </View>
                  </View>
                )}

                {/* Items Section */}
                <View style={styles.modalItemsSection}>
                  <Text style={styles.modalSectionTitle}>
                    {isQuickModeReceipt(selectedReceipt)
                      ? (isThai ? 'หมวดหมู่' : 'Category')
                      : (isThai ? 'รายการสินค้า' : 'Items')
                    }
                  </Text>

                  {(selectedReceipt.items as ReceiptItem[]).map((item, index) => (
                    <View key={index} style={styles.modalItemRow}>
                      <View style={styles.modalItemLeft}>
                        <Text style={styles.modalItemName}>{item.name}</Text>
                        {!isQuickModeReceipt(selectedReceipt) && (
                          <Text style={styles.modalItemQty}>x{item.quantity}</Text>
                        )}
                      </View>
                      <Text style={styles.modalItemPrice}>
                        {formatPrice(item.price * item.quantity)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Customer (if any) */}
                {selectedReceipt.customer_name && (
                  <View style={styles.modalCustomerSection}>
                    <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.modalCustomerText}>{selectedReceipt.customer_name}</Text>
                  </View>
                )}

                {/* Total */}
                <View style={styles.modalTotalSection}>
                  {selectedReceipt.vat > 0 && (
                    <>
                      <View style={styles.modalTotalRow}>
                        <Text style={styles.modalTotalLabel}>{isThai ? 'ยอดรวม' : 'Subtotal'}</Text>
                        <Text style={styles.modalTotalValue}>{formatPrice(selectedReceipt.subtotal)}</Text>
                      </View>
                      <View style={styles.modalTotalRow}>
                        <Text style={styles.modalTotalLabel}>VAT 7%</Text>
                        <Text style={styles.modalTotalValue}>{formatPrice(selectedReceipt.vat)}</Text>
                      </View>
                    </>
                  )}
                  <View style={styles.modalGrandTotalRow}>
                    <Text style={styles.modalGrandTotalLabel}>{isThai ? 'รวมทั้งหมด' : 'Total'}</Text>
                    <Text style={styles.modalGrandTotalValue}>{formatPrice(selectedReceipt.total)}</Text>
                  </View>
                </View>
                </View>

                {/* Share Button */}
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShare}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-outline" size={24} color={Colors.primary} />
                  <Text style={styles.shareButtonText}>{t('share_receipt')}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // Screen background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  statsCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  statsAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  statsChange: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.success,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 60,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  receiptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  receiptIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptIconActive: {
    backgroundColor: Colors.primaryLight,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptCustomer: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  receiptMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  receiptRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  receiptAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    maxHeight: '90%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  modalStatusBadge: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  modalStatusText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  modalQrSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  modalQrContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  modalItemsSection: {
    marginBottom: Spacing.lg,
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalItemLeft: {
    flex: 1,
  },
  modalItemName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  modalItemQty: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  modalItemPrice: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalCustomerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
  },
  modalCustomerText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  modalTotalSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  modalTotalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  modalTotalValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  modalGrandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  modalGrandTotalLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalGrandTotalValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    minHeight: 48,
  },
  shareButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Filter styles
  filterContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
    alignSelf: 'center',
  },
});
