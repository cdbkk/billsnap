import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import generatePayload from 'promptpay-qr';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

interface PromptPayQRProps {
  promptPayId: string;
  amount?: number;
  size?: number;
}

/**
 * PromptPay QR Code Component
 * Generates EMVCo-standard Thai PromptPay QR codes
 */
/**
 * Validate PromptPay ID format
 * Valid format: 10-digit phone (0xxxxxxxxx)
 */
const isValidPromptPayId = (id: string): boolean => {
  return /^0\d{9}$/.test(id); // 10 digits starting with 0
};

export default function PromptPayQR({
  promptPayId,
  amount,
  size = 140
}: PromptPayQRProps) {
  // Clean the PromptPay ID (remove dashes, spaces)
  const cleanId = promptPayId.replace(/[-\s]/g, '');

  // Validate the PromptPay ID
  if (!isValidPromptPayId(cleanId)) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid PromptPay ID</Text>
          <Text style={styles.errorHint}>Use 10-digit phone number</Text>
        </View>
      </View>
    );
  }

  // Generate EMVCo payload using promptpay-qr library
  const payload = generatePayload(cleanId, { amount });

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>PROMPTPAY</Text>
      </View>

      <View style={styles.qrWrapper}>
        <QRCode
          value={payload}
          size={size}
          backgroundColor="white"
          color={Colors.textPrimary}
          quietZone={8}
        />
      </View>

      <Text style={styles.hint}>Scan to pay directly</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  labelContainer: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 2,
  },
  qrWrapper: {
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  errorContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  errorText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.error,
  },
  errorHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
