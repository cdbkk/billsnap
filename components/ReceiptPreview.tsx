import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Shop, ReceiptItem } from '../types';
import { formatPrice, formatDate } from '../lib/receipt';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { useTranslation } from '../lib/i18n';
import PromptPayQR from './PromptPayQR';

interface ReceiptPreviewProps {
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
}

/**
 * Thai Receipt Preview Component
 * Styled to match the premium mockup with paper texture and jagged edges
 */
const ReceiptPreview = forwardRef<View, ReceiptPreviewProps>(
  ({ shop, receipt }, ref) => {
    const { t } = useTranslation();
    const createdAt = receipt.created_at || new Date();

    return (
      <View ref={ref} style={styles.container}>
        {/* Jagged top edge */}
        <View style={styles.jaggedEdgeTop} />

        {/* Receipt Content */}
        <View style={styles.receipt}>
          {/* Shop Logo */}
          <View style={styles.logoContainer}>
            {shop.logo_url ? (
              <Image source={{ uri: shop.logo_url }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoInitial}>
                  {shop.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Shop Info */}
          <Text style={styles.shopName}>{shop.name.toUpperCase()}</Text>
          {shop.contact && (
            <Text style={styles.contact}>{shop.contact}</Text>
          )}

          {/* Dashed Separator */}
          <View style={styles.separator} />

          {/* Receipt Details */}
          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>Receipt #{receipt.receipt_number}</Text>
            <Text style={styles.detailText}>
              {formatDate(createdAt)}
            </Text>
          </View>

          {/* Items */}
          <View style={styles.itemsContainer}>
            {receipt.items.map((item, index) => (
              <View key={item.id || index} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>

          {/* Dashed Separator */}
          <View style={styles.separator} />

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('subtotal')}</Text>
              <Text style={styles.totalValue}>{formatPrice(receipt.subtotal)}</Text>
            </View>

            {receipt.discount && receipt.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.discountLabel}>
                  {receipt.discountLabel || 'Discount'}
                </Text>
                <Text style={styles.discountValue}>
                  -{formatPrice(receipt.discount)}
                </Text>
              </View>
            )}

            {receipt.vat > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('vat')}</Text>
                <Text style={styles.totalValue}>{formatPrice(receipt.vat)}</Text>
              </View>
            )}

            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>{t('total')}</Text>
              <Text style={styles.grandTotalValue}>
                {formatPrice(receipt.total)}
              </Text>
            </View>
          </View>

          {/* PromptPay QR Code */}
          {shop.promptpay_id && (
            <View style={styles.qrSection}>
              <PromptPayQR
                promptPayId={shop.promptpay_id}
                amount={receipt.total}
                size={120}
              />
            </View>
          )}

          {/* Thank You */}
          <Text style={styles.thankYou}>{t('thank_you')}</Text>

          {/* Free Version Watermark */}
          {!shop.is_pro && (
            <View style={styles.watermarkContainer}>
              <Text style={styles.watermark}>
                FREE VERSION • FREE VERSION • FREE VERSION
              </Text>
            </View>
          )}
        </View>

        {/* Jagged bottom edge */}
        <View style={styles.jaggedEdgeBottom} />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  jaggedEdgeTop: {
    height: 12,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
  },
  jaggedEdgeBottom: {
    height: 12,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
  },
  receipt: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  shopName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  contact: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  separator: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    marginVertical: Spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detailText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  itemsContainer: {
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  itemQty: {
    width: 40,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  itemPrice: {
    width: 80,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  totalsContainer: {
    gap: Spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  discountLabel: {
    fontSize: FontSize.sm,
    color: Colors.error,
  },
  discountValue: {
    fontSize: FontSize.sm,
    color: Colors.error,
  },
  grandTotalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  grandTotalLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  grandTotalValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  qrSection: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  thankYou: {
    fontSize: FontSize.xs,
    fontStyle: 'italic',
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: Spacing.lg,
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    pointerEvents: 'none',
  },
  watermark: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.03)',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
});

ReceiptPreview.displayName = 'ReceiptPreview';

export default ReceiptPreview;
