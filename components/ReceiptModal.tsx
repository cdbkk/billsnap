import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReceiptPreview from './ReceiptPreview';
import { Shop, ReceiptItem } from '../types';
import { captureAndShareToLine, captureAndSave } from '../lib/share';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../constants/theme';
import { useTranslation } from '../lib/i18n';

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  shop: Shop;
  receipt: {
    items: ReceiptItem[];
    subtotal: number;
    vat: number;
    total: number;
    receipt_number: string;
    created_at?: string | Date;
    discount?: number;
    discountLabel?: string;
  };
  onUpgrade?: () => void;
}

export default function ReceiptModal({
  visible,
  onClose,
  shop,
  receipt,
  onUpgrade,
}: ReceiptModalProps) {
  const { t } = useTranslation();
  const receiptRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleShareToLine = async () => {
    if (!receiptRef.current) return;

    setIsSharing(true);
    try {
      await captureAndShareToLine(receiptRef);
    } finally {
      setIsSharing(false);
    }
  };

  const handleSave = async () => {
    if (!receiptRef.current) return;

    setIsSaving(true);
    try {
      await captureAndSave(receiptRef);
    } finally {
      setIsSaving(false);
    }
  };

  const isProcessing = isSharing || isSaving;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
            disabled={isProcessing}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('receipt_preview')}</Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Receipt Preview */}
          <View style={styles.receiptContainer}>
            <ReceiptPreview ref={receiptRef} shop={shop} receipt={receipt} />
          </View>

          {/* Pro Upgrade Banner (only for free tier) */}
          {!shop.is_pro && (
            <TouchableOpacity
              style={styles.upgradeBanner}
              onPress={onUpgrade}
              activeOpacity={0.8}
            >
              <View style={styles.upgradeBannerContent}>
                <Text style={styles.upgradeBannerTitle}>{t('remove_watermark')}</Text>
                <Text style={styles.upgradeBannerSubtitle}>
                  {t('upgrade_pro_watermark')}
                </Text>
              </View>
              <View style={styles.upgradeBannerAction}>
                <Text style={styles.upgradeBannerLink}>{t('get_pro')}</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.actionsContainer}>
          {/* Share to LINE Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.lineButton]}
            onPress={handleShareToLine}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isSharing ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={Colors.textPrimary} />
                <Text style={styles.lineButtonText}>{t('share_to_line')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Save to Photos Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.saveButtonText}>{t('save_to_photos')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  receiptContainer: {
    ...Shadows.lg,
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#DBE6DF',
    padding: Spacing.lg,
  },
  upgradeBannerContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  upgradeBannerTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  upgradeBannerSubtitle: {
    fontSize: FontSize.sm,
    color: '#61896F',
    lineHeight: 20,
  },
  upgradeBannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upgradeBannerLink: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionsContainer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  lineButton: {
    backgroundColor: Colors.primary,
  },
  lineButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.borderLight,
  },
  saveButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
