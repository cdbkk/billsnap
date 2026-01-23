import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Animated,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, Shadows, ActiveScale } from '../../constants/theme';
import { PresetItem, ReceiptItem, VAT_RATE, FREE_TIER_LIMIT } from '../../types';
import { formatPrice, generateReceiptNumber, generateItemId } from '../../lib/receipt';
import ReceiptModal from '../../components/ReceiptModal';
import QuickSale from '../../components/QuickSale';
import PromptPayQR from '../../components/PromptPayQR';
import { useTranslation } from '../../lib/i18n';
import { haptic } from '../../lib/haptics';
import { useRouter } from 'expo-router';
import { useShop, usePresetItems, useReceipts } from '../../lib/hooks';
import { SuccessAnimation, SkeletonChip } from '../../components/ui';

// Animated Pressable Component with Scale Feedback
const AnimatedPressable = ({
  children,
  onPress,
  style,
  disabled = false
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  disabled?: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={({ pressed }) => [style, { opacity: pressed ? 0.9 : 1 }]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function CreateReceiptScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { shop, refetch: refetchShop, updateShop } = useShop();
  const { items: presetItems, loading: itemsLoading } = usePresetItems(shop?.id);
  const { createReceipt, todayTotal, receipts } = useReceipts(shop?.id);

  // Refetch shop data when tab is focused (to get updated shop_mode)
  useFocusEffect(
    useCallback(() => {
      refetchShop();
    }, [refetchShop])
  );

  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [includeVat, setIncludeVat] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Calculate today's receipt count
  const todayCount = receipts.filter(r => {
    const receiptDate = new Date(r.created_at).toDateString();
    const today = new Date().toDateString();
    return receiptDate === today;
  }).length;

  // Check if shop is in quick mode
  const isQuickMode = shop?.shop_mode === 'quick';

  // Handler for updating PromptPay ID from QuickSale
  const handleUpdatePromptPayId = async (promptPayId: string) => {
    await updateShop({ promptpay_id: promptPayId });
  };

  // If quick mode, render the QuickSale component
  if (isQuickMode && shop) {
    return (
      <>
        <QuickSale
          shop={shop}
          todayTotal={todayTotal}
          todayCount={todayCount}
          onCreateReceipt={createReceipt}
          onShowQR={() => setShowQRModal(true)}
          onUpdatePromptPayId={handleUpdatePromptPayId}
          refetchShop={refetchShop}
        />
        {/* QR Modal */}
        <Modal
          visible={showQRModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowQRModal(false)}
        >
          <View style={styles.qrModalOverlay}>
            <View style={styles.qrModalContent}>
              <View style={styles.qrModalHeader}>
                <Text style={styles.qrModalTitle}>PromptPay QR</Text>
                <TouchableOpacity
                  style={styles.qrModalClose}
                  onPress={() => setShowQRModal(false)}
                >
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              {shop.promptpay_id ? (
                <PromptPayQR promptPayId={shop.promptpay_id} size={200} />
              ) : (
                <View style={styles.noQRContainer}>
                  <Ionicons name="qr-code-outline" size={48} color={Colors.textMuted} />
                  <Text style={styles.noQRText}>No PromptPay ID set</Text>
                  <TouchableOpacity
                    style={styles.setupButton}
                    onPress={() => {
                      setShowQRModal(false);
                      router.push('/edit-shop');
                    }}
                  >
                    <Text style={styles.setupButtonText}>Set up now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Add item to receipt or increment quantity if already exists
  const handleAddItem = (presetItem: PresetItem) => {
    const existingIndex = receiptItems.findIndex(item => item.id === presetItem.id);

    if (existingIndex >= 0) {
      // Item exists, increment quantity
      const updatedItems = [...receiptItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + 1,
      };
      setReceiptItems(updatedItems);
    } else {
      // New item, add to receipt
      const newItem: ReceiptItem = {
        id: presetItem.id,
        name: presetItem.name,
        price: presetItem.price,
        quantity: 1,
      };
      setReceiptItems([...receiptItems, newItem]);
    }
  };

  // Increment item quantity
  const handleIncrementQuantity = (itemId: string) => {
    setReceiptItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  // Decrement item quantity (remove if quantity becomes 0)
  const handleDecrementQuantity = (itemId: string) => {
    setReceiptItems(items =>
      items
        .map(item =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  // Remove item from receipt
  const handleRemoveItem = (itemId: string) => {
    setReceiptItems(items => items.filter(item => item.id !== itemId));
  };

  // Clear all items
  const handleClearAll = () => {
    if (receiptItems.length === 0) return;

    Alert.alert(
      t('clear_all'),
      t('clear_all_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('ok'),
          style: 'destructive',
          onPress: () => {
            setReceiptItems([]);
            setCustomerName('');
            setIncludeVat(false);
          },
        },
      ]
    );
  };

  // Calculate totals
  const subtotal = receiptItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vat = includeVat ? subtotal * VAT_RATE : 0;
  const total = subtotal + vat;

  // Generate receipt
  const handleGenerateReceipt = async () => {
    if (receiptItems.length === 0) {
      Alert.alert(t('no_items_alert'), t('add_items_first'));
      return;
    }

    if (!shop) {
      Alert.alert('Error', 'Shop not found. Please try again.');
      return;
    }

    // Check free tier limit
    if (!shop.is_pro && shop.receipts_this_month >= FREE_TIER_LIMIT) {
      Alert.alert(
        'Limit Reached',
        `Free accounts can create ${FREE_TIER_LIMIT} receipts per month. Upgrade to Pro for unlimited receipts.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return;
    }

    try {
      setSaving(true);

      // Create receipt in database
      await createReceipt({
        shop_id: shop.id,
        receipt_number: generateReceiptNumber(shop.receipts_this_month),
        items: receiptItems,
        subtotal,
        vat,
        total,
        customer_name: customerName || undefined,
        status: 'paid',
      });

      // Refresh shop data to update receipts_this_month counter
      await refetchShop();

      // Show success animation with haptic feedback
      haptic.success();
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to create receipt:', error);
      Alert.alert('Error', 'Failed to create receipt. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowReceiptModal(false);
    // Reset form after successful creation
    setReceiptItems([]);
    setCustomerName('');
    setIncludeVat(false);
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    setShowReceiptModal(true);
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('create_receipt')}</Text>
        {receiptItems.length > 0 && (
          <AnimatedPressable onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>{t('clear_all')}</Text>
          </AnimatedPressable>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {/* Preset Items Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('select_items')}</Text>
          {itemsLoading ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <SkeletonChip />
              <SkeletonChip />
              <SkeletonChip />
              <SkeletonChip />
            </View>
          ) : presetItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>{t('no_items_yet')}</Text>
              <Text style={styles.emptySubtext}>{t('add_items_hint')}</Text>
            </View>
          ) : (
            <View style={styles.presetGrid}>
              {presetItems.map(item => (
                <AnimatedPressable
                  key={item.id}
                  style={styles.presetCard}
                  onPress={() => handleAddItem(item)}
                >
                  <View style={styles.presetIconContainer}>
                    <Ionicons name="cube-outline" size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.presetName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.presetPrice}>{formatPrice(item.price)}</Text>
                  {item.category && (
                    <View style={styles.presetCategory}>
                      <Text style={styles.presetCategoryText}>{item.category}</Text>
                    </View>
                  )}
                </AnimatedPressable>
              ))}
            </View>
          )}
        </View>

        {/* Current Receipt Items */}
        {receiptItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('receipt_items')} ({receiptItems.length})</Text>
            <View style={styles.receiptItemsContainer}>
              {receiptItems.map(item => (
                <View key={item.id} style={styles.receiptItemCard}>
                  <View style={styles.receiptItemTop}>
                    <View style={styles.receiptItemLeft}>
                      <Text style={styles.receiptItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.receiptItemPrice}>
                        {formatPrice(item.price)} x {item.quantity}
                      </Text>
                    </View>
                    <Text style={styles.receiptItemTotal}>
                      {formatPrice(item.price * item.quantity)}
                    </Text>
                  </View>

                  <View style={styles.quantityControls}>
                    <AnimatedPressable
                      style={styles.deleteButton}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </AnimatedPressable>

                    <AnimatedPressable
                      style={styles.quantityButton}
                      onPress={() => handleDecrementQuantity(item.id)}
                    >
                      <Ionicons name="remove" size={18} color={Colors.primary} />
                    </AnimatedPressable>

                    <Text style={styles.quantityText}>{item.quantity}</Text>

                    <AnimatedPressable
                      style={styles.quantityButton}
                      onPress={() => handleIncrementQuantity(item.id)}
                    >
                      <Ionicons name="add" size={18} color={Colors.primary} />
                    </AnimatedPressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Customer Info & VAT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('additional_details')}</Text>

          {/* Customer Name */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color={Colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder={t('customer_name_optional')}
              placeholderTextColor={Colors.textMuted}
              value={customerName}
              onChangeText={setCustomerName}
            />
            {customerName.length > 0 && (
              <AnimatedPressable onPress={() => setCustomerName('')}>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </AnimatedPressable>
            )}
          </View>

          {/* VAT Toggle */}
          <AnimatedPressable
            style={styles.vatToggleContainer}
            onPress={() => setIncludeVat(!includeVat)}
          >
            <View style={styles.vatToggleLeft}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <View>
                <Text style={styles.vatToggleLabel}>{t('include_vat_7')}</Text>
                <Text style={styles.vatToggleSubtext}>
                  {includeVat ? `+${formatPrice(vat)}` : t('no_vat')}
                </Text>
              </View>
            </View>
            <View style={[styles.toggleSwitch, includeVat && styles.toggleSwitchActive]}>
              <View style={[styles.toggleThumb, includeVat && styles.toggleThumbActive]} />
            </View>
          </AnimatedPressable>
        </View>

        {/* Summary Card */}
        {receiptItems.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t('summary')}</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>

            {includeVat && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>VAT 7%</Text>
                <Text style={styles.summaryValue}>{formatPrice(vat)}</Text>
              </View>
            )}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>{t('grand_total')}</Text>
              <Text style={styles.summaryTotalValue}>{formatPrice(total)}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Generate Button */}
      {receiptItems.length > 0 && (
        <View style={styles.bottomAction}>
          <AnimatedPressable
            style={[styles.generateButton, saving && styles.generateButtonDisabled]}
            onPress={handleGenerateReceipt}
            disabled={saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={styles.generateButtonText}>Saving...</Text>
              </>
            ) : (
              <>
                <Ionicons name="receipt-outline" size={24} color={Colors.white} />
                <Text style={styles.generateButtonText}>{t('generate_receipt')}</Text>
              </>
            )}
          </AnimatedPressable>
        </View>
      )}

      {/* Success Animation */}
      <SuccessAnimation
        visible={showSuccess}
        onComplete={handleSuccessComplete}
        message={t('receipt_created')}
      />

      {/* Receipt Modal */}
      {shop && (
        <ReceiptModal
          visible={showReceiptModal}
          onClose={handleCloseModal}
          shop={shop}
          receipt={{
            items: receiptItems,
            subtotal,
            vat,
            total,
            receipt_number: generateReceiptNumber(shop.receipts_this_month),
            created_at: new Date(),
          }}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: FontSize.heading,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  clearButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  clearButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.error,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  presetCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  presetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  presetName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
    height: 36,
  },
  presetPrice: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  presetCategory: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  presetCategoryText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  receiptItemsContainer: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  receiptItemCard: {
    flexDirection: 'column',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  receiptItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptItemLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  receiptItemName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  receiptItemPrice: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  receiptItemRight: {
    alignItems: 'flex-end',
  },
  receiptItemTotal: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 32,
    textAlign: 'center',
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  vatToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    ...Shadows.sm,
    minHeight: 48,
  },
  vatToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vatToggleLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  vatToggleSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  summaryCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  summaryTotalLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryTotalValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  bottomSpacer: {
    height: 80,
  },
  bottomAction: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 52,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  generateButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 12,
    ...Shadows.sm,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // QR Modal styles
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  qrModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  qrModalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  qrModalClose: {
    position: 'absolute',
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noQRContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  noQRText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  setupButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  setupButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
});
