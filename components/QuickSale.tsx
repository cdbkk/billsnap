import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Animated,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../constants/theme';
import { formatPrice, generateReceiptNumber } from '../lib/receipt';
import { useLanguage } from '../lib/i18n';
import { Shop, CATEGORIES_BY_STORE_TYPE, StoreType } from '../types';
import PromptPayQR from './PromptPayQR';
import { haptic } from '../lib/haptics';

interface QuickSaleProps {
  shop: Shop;
  todayTotal: number;
  todayCount: number;
  onCreateReceipt: (data: {
    shop_id: string;
    receipt_number: string;
    items: any[];
    subtotal: number;
    vat: number;
    total: number;
    status: 'paid' | 'pending';
  }) => Promise<any>;
  onShowQR: () => void;
  onUpdatePromptPayId?: (id: string) => Promise<void>;
  refetchShop: () => Promise<void>;
}

const PRESET_AMOUNTS = [20, 50, 100, 200, 500, 1000];

export default function QuickSale({
  shop,
  todayTotal,
  todayCount,
  onCreateReceipt,
  onShowQR,
  onUpdatePromptPayId,
  refetchShop,
}: QuickSaleProps) {
  const { language } = useLanguage();
  const [amount, setAmount] = useState('0');
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPromptPayEdit, setShowPromptPayEdit] = useState(false);
  const [promptPayInput, setPromptPayInput] = useState(shop.promptpay_id || '');
  const [savingPromptPay, setSavingPromptPay] = useState(false);
  const [savedAmount, setSavedAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Get categories for this store type
  const storeType = (shop.store_type || 'general') as StoreType;
  const categories = CATEGORIES_BY_STORE_TYPE[storeType] || CATEGORIES_BY_STORE_TYPE.general;

  const isThai = language === 'th';

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Animate success screen
  useEffect(() => {
    if (showSuccess) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [showSuccess, scaleAnim]);

  const vibrate = () => {
    haptic.light();
  };

  const handleNumberPress = useCallback((num: string) => {
    vibrate();
    setAmount(prev => {
      if (prev === '0') return num;
      if (prev.length >= 7) return prev; // Max 9,999,999
      return prev + num;
    });
  }, []);

  const handleDelete = useCallback(() => {
    vibrate();
    setAmount(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, []);

  const handleClear = useCallback(() => {
    vibrate();
    setAmount('0');
  }, []);

  const handlePresetPress = useCallback((preset: number) => {
    vibrate();
    setAmount(String(preset));
  }, []);

  const handleGenerate = () => {
    const numAmount = parseInt(amount, 10);
    if (numAmount <= 0) {
      Alert.alert(
        isThai ? 'ใส่จำนวนเงิน' : 'Enter Amount',
        isThai ? 'กรุณาใส่จำนวนเงินก่อน' : 'Please enter an amount first'
      );
      return;
    }

    if (!shop.promptpay_id) {
      Alert.alert(
        isThai ? 'ยังไม่ได้ตั้งค่าพร้อมเพย์' : 'PromptPay Not Set',
        isThai ? 'กรุณาตั้งค่าพร้อมเพย์ในการตั้งค่าร้านก่อน' : 'Please set up your PromptPay ID in shop settings first'
      );
      return;
    }

    vibrate();
    setShowPaymentModal(true);
  };

  const handleMarkPaid = () => {
    const numAmount = parseInt(amount, 10);
    vibrate();
    // Store amount and show tag selection
    setPendingAmount(numAmount);
    setShowPaymentModal(false);
    setShowTagModal(true);
  };

  const handleTagSelect = async (tagName: string) => {
    vibrate();
    setSaving(true);

    try {
      await onCreateReceipt({
        shop_id: shop.id,
        receipt_number: generateReceiptNumber(shop.receipts_this_month),
        items: [{ id: 'quick-sale', name: tagName, price: pendingAmount, quantity: 1 }],
        subtotal: pendingAmount,
        vat: 0,
        total: pendingAmount,
        status: 'paid',
      });

      await refetchShop();

      // Success feedback
      haptic.success();

      // Close tag modal, show success
      setShowTagModal(false);
      setSavedAmount(pendingAmount);
      setShowSuccess(true);

      // Auto-dismiss after 2 seconds
      successTimeoutRef.current = setTimeout(() => {
        dismissSuccess();
      }, 2000);

    } catch (error) {
      console.error('Failed to save:', error);
      Alert.alert(
        isThai ? 'เกิดข้อผิดพลาด' : 'Error',
        isThai ? 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง' : 'Failed to save. Please try again.'
      );
      setShowTagModal(false);
    } finally {
      setSaving(false);
    }
  };

  const dismissSuccess = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    setShowSuccess(false);
    setAmount('0');
    setSavedAmount(0);
  };

  const handleSavePromptPay = async () => {
    if (!promptPayInput.trim()) {
      Alert.alert(
        isThai ? 'กรุณาใส่ ID' : 'Enter ID',
        isThai ? 'กรุณาใส่หมายเลขพร้อมเพย์' : 'Please enter your PromptPay ID'
      );
      return;
    }

    if (!onUpdatePromptPayId) return;

    setSavingPromptPay(true);
    try {
      await onUpdatePromptPayId(promptPayInput.trim());
      await refetchShop();
      setShowPromptPayEdit(false);
      vibrate();
    } catch (error) {
      Alert.alert(
        isThai ? 'เกิดข้อผิดพลาด' : 'Error',
        isThai ? 'บันทึกไม่สำเร็จ' : 'Failed to save'
      );
    } finally {
      setSavingPromptPay(false);
    }
  };

  const numAmount = parseInt(amount, 10) || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Today's Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{isThai ? 'วันนี้' : 'Today'}</Text>
          <Text style={styles.statValue}>{formatPrice(todayTotal)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{isThai ? 'รายการ' : 'Sales'}</Text>
          <Text style={styles.statValue}>{todayCount}</Text>
        </View>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={onShowQR}
          activeOpacity={0.7}
          accessibilityLabel="Show PromptPay QR code"
          accessibilityRole="button"
        >
          <Ionicons name="qr-code" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Amount Display */}
      <View style={styles.amountContainer}>
        <Text style={styles.currencySymbol}>฿</Text>
        <Text style={styles.amountText} numberOfLines={1} adjustsFontSizeToFit>
          {numAmount.toLocaleString()}
        </Text>
      </View>

      {/* Preset Buttons */}
      <View style={styles.presetContainer}>
        {PRESET_AMOUNTS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={styles.presetButton}
            onPress={() => handlePresetPress(preset)}
            activeOpacity={0.7}
          >
            <Text style={styles.presetText}>฿{preset}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Numpad */}
      <View style={styles.numpad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['C', '0', '⌫'],
        ].map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numpadRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.numpadKey,
                  key === 'C' && styles.numpadKeyClear,
                  key === '⌫' && styles.numpadKeyDelete,
                ]}
                onPress={() => {
                  if (key === 'C') handleClear();
                  else if (key === '⌫') handleDelete();
                  else handleNumberPress(key);
                }}
                activeOpacity={0.6}
              >
                {key === '⌫' ? (
                  <Ionicons name="backspace-outline" size={28} color={Colors.textPrimary} />
                ) : (
                  <Text style={[
                    styles.numpadKeyText,
                    key === 'C' && styles.numpadKeyTextClear,
                  ]}>
                    {key}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Generate Button */}
      <View style={styles.generateContainer}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            numAmount <= 0 && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerate}
          disabled={numAmount <= 0}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code" size={28} color={Colors.white} />
          <Text style={styles.generateButtonText}>
            {isThai ? 'สร้าง QR' : 'Generate'} {numAmount > 0 && formatPrice(numAmount)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Payment Modal with QR */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContent}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>

            {/* Amount */}
            <Text style={styles.paymentAmount}>{formatPrice(numAmount)}</Text>
            <Text style={styles.paymentLabel}>
              {isThai ? 'สแกนเพื่อชำระเงิน' : 'Scan to Pay'}
            </Text>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              {shop.promptpay_id ? (
                <PromptPayQR
                  promptPayId={shop.promptpay_id}
                  amount={numAmount}
                  size={280}
                />
              ) : (
                <View style={styles.noQrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={80} color={Colors.textMuted} />
                  <Text style={styles.noQrText}>
                    {isThai ? 'ยังไม่ได้ตั้งค่า PromptPay' : 'PromptPay not set'}
                  </Text>
                </View>
              )}
            </View>

            {/* Mark as Paid Button */}
            <TouchableOpacity
              style={[styles.paidButton, saving && styles.paidButtonDisabled]}
              onPress={handleMarkPaid}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={28} color={Colors.white} />
                  <Text style={styles.paidButtonText}>
                    {isThai ? 'ชำระแล้ว' : 'Paid'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PromptPay Edit Modal */}
      <Modal
        visible={showPromptPayEdit}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPromptPayEdit(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.promptPayModalContent}>
            <Text style={styles.promptPayTitle}>
              {isThai ? 'PromptPay ID' : 'PromptPay ID'}
            </Text>
            <Text style={styles.promptPayHint}>
              {isThai ? 'เบอร์โทร 10 หลัก' : 'Phone number (10 digits)'}
            </Text>

            <TextInput
              style={styles.promptPayInput}
              value={promptPayInput}
              onChangeText={setPromptPayInput}
              placeholder={isThai ? 'เช่น 0812345678' : 'e.g. 0812345678'}
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              autoFocus
            />

            <View style={styles.promptPayButtons}>
              <TouchableOpacity
                style={styles.promptPayCancelButton}
                onPress={() => setShowPromptPayEdit(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.promptPayCancelText}>
                  {isThai ? 'ยกเลิก' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.promptPaySaveButton, savingPromptPay && styles.paidButtonDisabled]}
                onPress={handleSavePromptPay}
                disabled={savingPromptPay}
                activeOpacity={0.7}
              >
                {savingPromptPay ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.promptPaySaveText}>
                    {isThai ? 'บันทึก' : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Tag Selection Modal */}
      <Modal
        visible={showTagModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.tagModalContent}>
            <Text style={styles.tagTitle}>
              {isThai ? 'ขายอะไร?' : 'What did you sell?'}
            </Text>
            <Text style={styles.tagSubtitle}>
              {formatPrice(pendingAmount)}
            </Text>

            {/* Category Tags */}
            <View style={styles.tagGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={styles.tagButton}
                  onPress={() => handleTagSelect(isThai ? cat.labelTh : cat.label)}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tagButtonText}>
                    {isThai ? cat.labelTh : cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => handleTagSelect('Quick Sale')}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.textMuted} />
              ) : (
                <Text style={styles.skipButtonText}>
                  {isThai ? 'ข้าม' : 'Skip'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Overlay */}
      <Modal
        visible={showSuccess}
        animationType="fade"
        transparent={true}
        onRequestClose={dismissSuccess}
      >
        <TouchableWithoutFeedback onPress={dismissSuccess}>
          <View style={styles.successOverlay}>
            <Animated.View
              style={[
                styles.successContent,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={80} color={Colors.white} />
              </View>
              <Text style={styles.successAmount}>{formatPrice(savedAmount)}</Text>
              <Text style={styles.successText}>
                {isThai ? 'ชำระเงินแล้ว' : 'Paid'}
              </Text>
              <Text style={styles.successHint}>
                {isThai ? 'แตะเพื่อปิด' : 'Tap to dismiss'}
              </Text>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    ...Shadows.sm,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '300',
    color: Colors.textMuted,
    marginRight: 8,
  },
  amountText: {
    fontSize: 64,
    fontWeight: '800',
    color: Colors.textPrimary,
    maxWidth: '80%',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetButton: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  presetText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  numpad: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  numpadKey: {
    width: 80,
    height: 64,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs,
    ...Shadows.sm,
  },
  numpadKeyClear: {
    backgroundColor: Colors.errorLight,
  },
  numpadKeyDelete: {
    backgroundColor: Colors.background,
  },
  numpadKeyText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  numpadKeyTextClear: {
    color: Colors.error,
    fontWeight: '700',
  },
  generateContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 64,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  generateButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  generateButtonText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  // Payment Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    margin: Spacing.lg,
    alignItems: 'center',
    width: '90%',
    maxWidth: 360,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: Spacing.md,
  },
  paymentLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  qrContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  paidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
    height: 64,
    width: '100%',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  paidButtonDisabled: {
    opacity: 0.7,
  },
  paidButtonText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  // Success Overlay
  successOverlay: {
    flex: 1,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
  },
  successIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  successAmount: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xxl,
  },
  successHint: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.7)',
  },
  // Tag Modal
  tagModalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    margin: Spacing.lg,
    width: '90%',
    maxWidth: 360,
  },
  tagTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  tagSubtitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tagButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    minHeight: 48,
    justifyContent: 'center',
  },
  tagButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  skipButtonText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  // No QR placeholder
  noQrPlaceholder: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
  },
  noQrText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  // Edit PromptPay button
  editPromptPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  editPromptPayText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  // PromptPay Edit Modal
  promptPayModalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    margin: Spacing.lg,
    width: '90%',
    maxWidth: 360,
  },
  promptPayTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  promptPayHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  promptPayInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSize.xl,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    minHeight: 56,
    color: Colors.textPrimary,
  },
  promptPayButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  promptPayCancelButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  promptPayCancelText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  promptPaySaveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  promptPaySaveText: {
    fontSize: FontSize.md,
    color: Colors.white,
    fontWeight: '600',
  },
});
