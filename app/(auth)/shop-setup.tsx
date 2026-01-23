import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth/AuthContext';
import { useShop } from '../../lib/hooks/useShop';
import { useLanguage } from '../../lib/i18n';
import { SHOP_MODES, ShopMode, StoreType } from '../../types';
import { getOnboardingData, clearOnboardingData } from '../../lib/storage';
import { isValidPromptPayId, formatPromptPayId } from '../../lib/validation';

export default function ShopSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { shop, refetch } = useShop();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shopName: '',
    contactNumber: '',
    promptpayId: '',
    shopMode: 'quick' as ShopMode,
    storeType: 'general' as StoreType,
  });

  // Check if editing existing shop
  const isEditing = !!shop;

  // Load onboarding data or existing shop data
  useEffect(() => {
    const loadData = async () => {
      if (shop) {
        // Editing existing shop
        setForm({
          shopName: shop.name || '',
          contactNumber: shop.contact || '',
          promptpayId: shop.promptpay_id || '',
          shopMode: shop.shop_mode || 'quick',
          storeType: shop.store_type || 'general',
        });
      } else {
        // New shop - check for onboarding data
        const onboardingData = await getOnboardingData();
        if (onboardingData) {
          setForm({
            shopName: onboardingData.shopName || '',
            contactNumber: '',
            promptpayId: onboardingData.promptPayId || '',
            shopMode: onboardingData.shopMode || 'quick',
            storeType: onboardingData.storeType || 'general',
          });
        }
      }
    };
    loadData();
  }, [shop]);

  const handleSaveAndStart = async () => {
    if (!form.shopName.trim()) {
      Alert.alert('Required', 'Please enter your shop name');
      return;
    }

    if (form.promptpayId && !isValidPromptPayId(form.promptpayId)) {
      Alert.alert(
        isThai ? 'พร้อมเพย์ไม่ถูกต้อง' : 'Invalid PromptPay ID',
        isThai
          ? 'กรุณากรอกเบอร์โทร 10 หลัก (เช่น 0812345678)'
          : 'Please enter a 10-digit phone number (e.g., 0812345678)'
      );
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && shop) {
        // Update existing shop
        const { error } = await supabase
          .from('shops')
          .update({
            name: form.shopName.trim(),
            contact: form.contactNumber.trim() || null,
            promptpay_id: form.promptpayId.trim() ? formatPromptPayId(form.promptpayId.trim()) : null,
            shop_mode: form.shopMode,
            store_type: form.storeType,
          })
          .eq('id', shop.id);

        if (error) throw error;

        // Refresh shop data
        await refetch();

        Alert.alert('Success', 'Shop info updated!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        // Create new shop
        const { error } = await supabase.from('shops').insert({
          user_id: user.id,
          name: form.shopName.trim(),
          contact: form.contactNumber.trim() || null,
          promptpay_id: form.promptpayId.trim() ? formatPromptPayId(form.promptpayId.trim()) : null,
          shop_mode: form.shopMode,
          store_type: form.storeType,
        });

        if (error) throw error;

        // Clear onboarding data after successful shop creation
        await clearOnboardingData();

        // Navigate to main app
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error saving shop:', error);
      Alert.alert('Error', 'Failed to save shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isThai = language === 'th';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isThai ? 'ตั้งค่าร้านค้า' : 'Shop Setup'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {isEditing
                ? (isThai ? 'แก้ไขข้อมูลร้าน' : 'Edit shop info')
                : (isThai ? 'ตั้งค่าร้านของคุณ' : 'Set up your shop')
              }
            </Text>
            <Text style={styles.subtitle}>
              {isThai
                ? 'เลือกโหมดที่เหมาะกับธุรกิจของคุณ'
                : 'Choose the mode that fits your business'
              }
            </Text>
          </View>

          {/* Mode Selection */}
          <View style={styles.modeSection}>
            <Text style={styles.sectionLabel}>
              {isThai ? 'เลือกโหมด' : 'Choose Mode'}
            </Text>
            {SHOP_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                style={[
                  styles.modeCard,
                  form.shopMode === mode.value && styles.modeCardActive,
                ]}
                onPress={() => setForm({ ...form, shopMode: mode.value })}
                activeOpacity={0.7}
              >
                <View style={styles.modeHeader}>
                  <View style={[
                    styles.modeIcon,
                    form.shopMode === mode.value && styles.modeIconActive,
                  ]}>
                    <Ionicons
                      name={mode.icon as any}
                      size={24}
                      color={form.shopMode === mode.value ? Colors.white : Colors.primary}
                    />
                  </View>
                  <View style={styles.modeTitleContainer}>
                    <Text style={[
                      styles.modeTitle,
                      form.shopMode === mode.value && styles.modeTitleActive,
                    ]}>
                      {isThai ? mode.labelTh : mode.label}
                    </Text>
                    {mode.value === 'quick' && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedBadgeText}>
                          {isThai ? 'แนะนำ' : 'Recommended'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={[
                    styles.radioOuter,
                    form.shopMode === mode.value && styles.radioOuterActive,
                  ]}>
                    {form.shopMode === mode.value && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>
                <Text style={[
                  styles.modeDescription,
                  form.shopMode === mode.value && styles.modeDescriptionActive,
                ]}>
                  {isThai ? mode.descriptionTh : mode.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Shop Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {isThai ? 'ชื่อร้าน' : 'Shop Name'} *
              </Text>
              <TextInput
                style={styles.input}
                placeholder={isThai ? 'เช่น บ้านส้มตำ' : 'e.g., Baan Somtum'}
                placeholderTextColor={Colors.textMuted}
                value={form.shopName}
                onChangeText={(text) => setForm({ ...form, shopName: text })}
                autoCapitalize="words"
              />
            </View>

            {/* Contact Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {isThai ? 'เบอร์ติดต่อ' : 'Contact Number'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="08X-XXX-XXXX"
                placeholderTextColor={Colors.textMuted}
                value={form.contactNumber}
                onChangeText={(text) => setForm({ ...form, contactNumber: text })}
                keyboardType="phone-pad"
              />
            </View>

            {/* PromptPay ID */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {isThai ? 'พร้อมเพย์' : 'PromptPay ID'}
                </Text>
                <Text style={styles.recommended}>
                  {isThai ? 'แนะนำ' : 'Recommended'}
                </Text>
              </View>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder={isThai ? 'เลขบัตร หรือ เบอร์โทร' : 'Citizen ID or Phone Number'}
                  placeholderTextColor={Colors.textMuted}
                  value={form.promptpayId}
                  onChangeText={(text) => setForm({ ...form, promptpayId: text })}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={styles.helpIcon}
                  onPress={() => Alert.alert(
                    'PromptPay ID',
                    isThai
                      ? 'ใส่เบอร์โทรที่ลงทะเบียนพร้อมเพย์ ลูกค้าสามารถสแกน QR โอนเงินได้เลย'
                      : 'Enter your phone number registered with PromptPay. Customers can scan QR to pay you directly.'
                  )}
                >
                  <Ionicons name="help-circle-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                {isThai
                  ? 'ลูกค้าสแกน QR จ่ายเงินได้เลย'
                  : 'Customers can scan QR to pay you directly'
                }
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveAndStart}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing
                  ? (isThai ? 'บันทึก' : 'Save Changes')
                  : (isThai ? 'เริ่มใช้งาน' : 'Start Using')
                }
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
  },
  titleSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  modeSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modeCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  modeCardActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconActive: {
    backgroundColor: Colors.primary,
  },
  modeTitleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modeTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modeTitleActive: {
    color: Colors.primary,
  },
  recommendedBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  modeDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginLeft: 48 + Spacing.md,
  },
  modeDescriptionActive: {
    color: Colors.textPrimary,
  },
  form: {
    paddingHorizontal: Spacing.lg,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  recommended: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  input: {
    height: 52,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  helpIcon: {
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
});
