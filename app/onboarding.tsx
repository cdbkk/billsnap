import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../constants/theme';
import { setOnboardingComplete, saveOnboardingData } from '../lib/storage';
import { useTranslation } from '../lib/i18n';
import { haptic } from '../lib/haptics';
import { STORE_TYPES, SHOP_MODES, StoreType, ShopMode } from '../types';
import { Analytics } from '../lib/analytics';

type Step = 'welcome' | 'store_type' | 'shop_mode' | 'shop_info';

export default function OnboardingScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const isThai = language === 'th';
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('welcome');
  const [storeType, setStoreType] = useState<StoreType | null>(null);
  const [shopMode, setShopMode] = useState<ShopMode>('quick');
  const [shopName, setShopName] = useState('');
  const [promptPayId, setPromptPayId] = useState('');

  const handleNext = () => {
    haptic.light();
    switch (step) {
      case 'welcome':
        Analytics.onboardingStarted();
        setStep('store_type');
        break;
      case 'store_type':
        if (storeType) setStep('shop_mode');
        break;
      case 'shop_mode':
        setStep('shop_info');
        break;
      case 'shop_info':
        handleComplete();
        break;
    }
  };

  const handleBack = () => {
    haptic.light();
    switch (step) {
      case 'store_type':
        setStep('welcome');
        break;
      case 'shop_mode':
        setStep('store_type');
        break;
      case 'shop_info':
        setStep('shop_mode');
        break;
    }
  };

  const handleComplete = async () => {
    haptic.success();
    // Save onboarding data
    await saveOnboardingData({
      storeType: storeType || 'general',
      shopMode,
      shopName: shopName.trim(),
      promptPayId: promptPayId.trim(),
    });
    await setOnboardingComplete();
    Analytics.onboardingCompleted({
      storeType: storeType || 'general',
      shopMode,
    });
    // Wait for storage to sync before navigating
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 300);
  };

  const canProceed = () => {
    switch (step) {
      case 'welcome':
        return true;
      case 'store_type':
        return storeType !== null;
      case 'shop_mode':
        return true;
      case 'shop_info':
        return shopName.trim().length > 0;
    }
  };

  const getProgress = () => {
    switch (step) {
      case 'welcome': return 0;
      case 'store_type': return 0.33;
      case 'shop_mode': return 0.66;
      case 'shop_info': return 1;
    }
  };

  // Welcome Step
  const renderWelcome = () => (
    <View style={styles.stepContent}>
      <View style={styles.welcomeIcon}>
        <Ionicons name="receipt" size={64} color={Colors.primary} />
      </View>
      <Text style={styles.welcomeTitle}>
        {isThai ? 'ยินดีต้อนรับสู่' : 'Welcome to'}
      </Text>
      <Text style={styles.appName}>BillSnap</Text>
      <Text style={styles.welcomeSubtitle}>
        {isThai
          ? 'สร้างใบเสร็จมืออาชีพ\nสำหรับร้านค้าออนไลน์และหน้าร้าน'
          : 'Professional receipts\nfor online & offline shops'}
      </Text>

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="flash" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.featureText}>
            {isThai ? 'สร้างบิลภายในวินาที' : 'Create receipts in seconds'}
          </Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="qr-code" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.featureText}>
            {isThai ? 'QR พร้อมเพย์อัตโนมัติ' : 'Auto PromptPay QR codes'}
          </Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="share-social" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.featureText}>
            {isThai ? 'แชร์ผ่าน LINE ได้เลย' : 'Share directly to LINE'}
          </Text>
        </View>
      </View>
    </View>
  );

  // Store Type Step
  const renderStoreType = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        {isThai ? 'ร้านของคุณขายอะไร?' : 'What does your shop sell?'}
      </Text>
      <Text style={styles.stepSubtitle}>
        {isThai ? 'เลือกประเภทที่ใกล้เคียงที่สุด' : 'Pick the closest category'}
      </Text>

      <ScrollView
        style={styles.optionsScroll}
        contentContainerStyle={styles.optionsGrid}
        showsVerticalScrollIndicator={false}
      >
        {STORE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.storeTypeCard,
              storeType === type.value && styles.storeTypeCardActive,
            ]}
            onPress={() => {
              haptic.selection();
              setStoreType(type.value);
            }}
            activeOpacity={0.7}
          >
            <View style={[
              styles.storeTypeIcon,
              storeType === type.value && styles.storeTypeIconActive,
            ]}>
              <Ionicons
                name={type.icon as any}
                size={24}
                color={storeType === type.value ? Colors.white : Colors.primary}
              />
            </View>
            <Text style={[
              styles.storeTypeLabel,
              storeType === type.value && styles.storeTypeLabelActive,
            ]}>
              {isThai ? type.labelTh : type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Shop Mode Step
  const renderShopMode = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        {isThai ? 'คุณต้องการสร้างบิลแบบไหน?' : 'How do you want to create receipts?'}
      </Text>
      <Text style={styles.stepSubtitle}>
        {isThai ? 'สามารถเปลี่ยนได้ภายหลัง' : 'You can change this later'}
      </Text>

      <View style={styles.modeOptions}>
        {SHOP_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.value}
            style={[
              styles.modeCard,
              shopMode === mode.value && styles.modeCardActive,
            ]}
            onPress={() => {
              haptic.selection();
              setShopMode(mode.value);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.modeHeader}>
              <View style={[
                styles.modeIcon,
                shopMode === mode.value && styles.modeIconActive,
              ]}>
                <Ionicons
                  name={mode.icon as any}
                  size={28}
                  color={shopMode === mode.value ? Colors.white : Colors.primary}
                />
              </View>
              <View style={styles.modeInfo}>
                <View style={styles.modeTitleRow}>
                  <Text style={[
                    styles.modeTitle,
                    shopMode === mode.value && styles.modeTitleActive,
                  ]}>
                    {isThai ? mode.labelTh : mode.label}
                  </Text>
                  {mode.value === 'quick' && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>
                        {isThai ? 'แนะนำ' : 'Popular'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.modeDescription,
                  shopMode === mode.value && styles.modeDescriptionActive,
                ]}>
                  {isThai ? mode.descriptionTh : mode.description}
                </Text>
              </View>
            </View>
            <View style={[
              styles.radioOuter,
              shopMode === mode.value && styles.radioOuterActive,
            ]}>
              {shopMode === mode.value && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Shop Info Step
  const renderShopInfo = () => (
    <KeyboardAvoidingView
      style={styles.stepContent}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.stepTitle}>
        {isThai ? 'ตั้งชื่อร้านของคุณ' : 'Name your shop'}
      </Text>
      <Text style={styles.stepSubtitle}>
        {isThai ? 'ชื่อนี้จะแสดงบนใบเสร็จ' : 'This will appear on your receipts'}
      </Text>

      <View style={styles.formSection}>
        <Text style={styles.inputLabel}>
          {isThai ? 'ชื่อร้าน' : 'Shop Name'} *
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder={isThai ? 'เช่น บ้านกาแฟ' : 'e.g., Baan Coffee'}
          placeholderTextColor={Colors.textMuted}
          value={shopName}
          onChangeText={setShopName}
          autoCapitalize="words"
          autoFocus
        />
      </View>

      <View style={styles.formSection}>
        <View style={styles.labelRow}>
          <Text style={styles.inputLabel}>
            {isThai ? 'พร้อมเพย์' : 'PromptPay ID'}
          </Text>
          <Text style={styles.optionalLabel}>
            {isThai ? 'ไม่บังคับ' : 'Optional'}
          </Text>
        </View>
        <TextInput
          style={styles.textInput}
          placeholder={isThai ? 'เบอร์โทร หรือ เลขบัตร' : 'Phone or ID number'}
          placeholderTextColor={Colors.textMuted}
          value={promptPayId}
          onChangeText={setPromptPayId}
          keyboardType="number-pad"
        />
        <Text style={styles.helperText}>
          {isThai
            ? 'ลูกค้าสแกน QR จ่ายเงินได้เลย'
            : 'Customers can scan QR to pay you'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );

  const renderStep = () => {
    switch (step) {
      case 'welcome': return renderWelcome();
      case 'store_type': return renderStoreType();
      case 'shop_mode': return renderShopMode();
      case 'shop_info': return renderShopInfo();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress Bar */}
      {step !== 'welcome' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
          </View>
        </View>
      )}

      {/* Back Button */}
      {step !== 'welcome' && (
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + Spacing.sm }]}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      )}

      {/* Content */}
      {renderStep()}

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
          activeOpacity={0.9}
        >
          <Text style={styles.nextButtonText}>
            {step === 'welcome'
              ? (isThai ? 'เริ่มต้น' : 'Get Started')
              : step === 'shop_info'
                ? (isThai ? 'เสร็จสิ้น' : 'Finish Setup')
                : (isThai ? 'ถัดไป' : 'Continue')
            }
          </Text>
          <Ionicons
            name={step === 'shop_info' ? 'checkmark' : 'arrow-forward'}
            size={20}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  backButton: {
    position: 'absolute',
    // top is set dynamically with safe area insets
    left: Spacing.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  // Welcome
  welcomeIcon: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xxl,
  },
  featureList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  // Step Title
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  // Store Type
  optionsScroll: {
    flex: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  storeTypeCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  storeTypeCardActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  storeTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  storeTypeIconActive: {
    backgroundColor: Colors.primary,
  },
  storeTypeLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  storeTypeLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // Mode
  modeOptions: {
    gap: Spacing.md,
  },
  modeCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modeCardActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  modeHeader: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconActive: {
    backgroundColor: Colors.primary,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
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
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  modeDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  modeDescriptionActive: {
    color: Colors.textPrimary,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
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
  // Shop Info
  formSection: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  optionalLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  textInput: {
    height: 56,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  helperText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  // Footer
  footer: {
    padding: Spacing.lg,
    // paddingBottom is set dynamically with safe area insets
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.border,
  },
  nextButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.white,
  },
});
