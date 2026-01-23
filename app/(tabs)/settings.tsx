import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  Animated,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../../constants/theme';
import { useAuth } from '../../lib/auth/AuthContext';
import { useShop, useReceipts } from '../../lib/hooks';
import { useLanguage, useTranslation } from '../../lib/i18n';
import { FREE_TIER_LIMIT } from '../../types';
import { exportReceiptsToCSV } from '../../lib/export';
import { haptic } from '../../lib/haptics';
import { Analytics } from '../../lib/analytics';

interface MenuItemProps {
  icon: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  rightContent?: React.ReactNode;
}

function MenuItem({ icon, iconColor = Colors.primary, label, sublabel, onPress, rightContent }: MenuItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.menuItem, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.menuIcon, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuLabel}>{label}</Text>
          {sublabel && <Text style={styles.menuSublabel}>{sublabel}</Text>}
        </View>
        {rightContent || <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />}
      </Animated.View>
    </Pressable>
  );
}

// Language Toggle Component
function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const scaleAnimEn = useRef(new Animated.Value(1)).current;
  const scaleAnimTh = useRef(new Animated.Value(1)).current;

  const handlePressIn = (lang: 'en' | 'th') => {
    const anim = lang === 'en' ? scaleAnimEn : scaleAnimTh;
    Animated.spring(anim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = (lang: 'en' | 'th') => {
    const anim = lang === 'en' ? scaleAnimEn : scaleAnimTh;
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <View style={styles.languageToggle}>
      <Pressable
        onPress={() => setLanguage('en')}
        onPressIn={() => handlePressIn('en')}
        onPressOut={() => handlePressOut('en')}
      >
        <Animated.View
          style={[
            styles.languageOption,
            language === 'en' && styles.languageOptionActive,
            { transform: [{ scale: scaleAnimEn }] },
          ]}
        >
          <Text
            style={[
              styles.languageText,
              language === 'en' && styles.languageTextActive,
            ]}
          >
            ENG
          </Text>
        </Animated.View>
      </Pressable>

      <Text style={styles.languageDivider}>/</Text>

      <Pressable
        onPress={() => setLanguage('th')}
        onPressIn={() => handlePressIn('th')}
        onPressOut={() => handlePressOut('th')}
      >
        <Animated.View
          style={[
            styles.languageOption,
            language === 'th' && styles.languageOptionActive,
            { transform: [{ scale: scaleAnimTh }] },
          ]}
        >
          <Text
            style={[
              styles.languageText,
              language === 'th' && styles.languageTextActive,
            ]}
          >
            ไทย
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

// Animated FAQ Item Component
function FaqItem({
  question,
  answer,
  isExpanded,
  onToggle,
}: {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(animatedHeight, {
        toValue: isExpanded ? 1 : 0,
        useNativeDriver: false,
        speed: 20,
        bounciness: 4,
      }),
      Animated.spring(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
    ]).start();
  }, [isExpanded]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.faqQuestion}>
        <Text style={styles.faqQuestionText}>{question}</Text>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
        </Animated.View>
      </View>
      <Animated.View
        style={{
          opacity: animatedHeight,
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 200],
          }),
          overflow: 'hidden',
        }}
      >
        <Text style={styles.faqAnswer}>{answer}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { shop, updateShop, refetch } = useShop();
  const { receipts } = useReceipts(shop?.id);
  const { t, language } = useTranslation();

  // Calculate receipts this month
  const receiptsThisMonth = receipts.filter(r => {
    const receiptDate = new Date(r.created_at);
    const now = new Date();
    return receiptDate.getMonth() === now.getMonth() &&
           receiptDate.getFullYear() === now.getFullYear();
  }).length;
  const upgradeScaleAnim = useRef(new Animated.Value(1)).current;
  const signOutScaleAnim = useRef(new Animated.Value(1)).current;
  const backButtonScaleAnim = useRef(new Animated.Value(1)).current;

  // PromptPay edit state
  const [showPromptPayModal, setShowPromptPayModal] = useState(false);
  const [promptPayInput, setPromptPayInput] = useState(shop?.promptpay_id || '');
  const [savingPromptPay, setSavingPromptPay] = useState(false);

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const isThai = language === 'th';

  const handlePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handleSignOut = () => {
    Alert.alert(
      t('sign_out'),
      t('sign_out_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('sign_out'),
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleUpgrade = () => {
    Alert.alert(
      isThai ? 'อัพเกรดเป็น Pro' : 'Upgrade to Pro',
      isThai
        ? '฿59/เดือน\n\n✓ ใบเสร็จไม่จำกัด (ฟรี 30/เดือน)\n✓ รายงานยอดขายขั้นสูง\n✓ จัดการสต็อกสินค้า\n✓ ส่งออกข้อมูล\n\nพร้อมให้บริการเร็วๆ นี้ผ่าน Google Play'
        : '฿59/month\n\n✓ Unlimited receipts (free is 30/mo)\n✓ Advanced sales reports\n✓ Inventory management\n✓ Export data\n\nComing soon via Google Play',
      [
        { text: isThai ? 'ปิด' : 'Close', style: 'cancel' },
        {
          text: isThai ? 'แจ้งเตือนฉัน' : 'Notify Me',
          onPress: () => {
            Alert.alert(
              isThai ? 'ขอบคุณ!' : 'Thanks!',
              isThai ? 'เราจะแจ้งให้คุณทราบเมื่อ Pro พร้อมใช้งาน' : "We'll notify you when Pro is available"
            );
          },
        },
      ]
    );
  };

  const handleSavePromptPay = async () => {
    setSavingPromptPay(true);
    try {
      await updateShop({ promptpay_id: promptPayInput.trim() || null });
      if (promptPayInput.trim()) {
        Analytics.promptPaySetup();
      }
      await refetch();
      setShowPromptPayModal(false);
    } catch (error) {
      Alert.alert(
        isThai ? 'เกิดข้อผิดพลาด' : 'Error',
        isThai ? 'บันทึกไม่สำเร็จ' : 'Failed to save'
      );
    } finally {
      setSavingPromptPay(false);
    }
  };

  const handleExportReceipts = async () => {
    try {
      haptic.medium();
      await exportReceiptsToCSV(receipts, shop?.name || 'BillSnap');
      Analytics.receiptExported('csv');
      haptic.success();
    } catch (error) {
      haptic.error();
      Alert.alert(t('error'), t('export_failed'));
    }
  };

  const openPromptPayModal = () => {
    setPromptPayInput(shop?.promptpay_id || '');
    setShowPromptPayModal(true);
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Oct 2023';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          onPressIn={() => handlePressIn(backButtonScaleAnim)}
          onPressOut={() => handlePressOut(backButtonScaleAnim)}
        >
          <Animated.View style={[styles.backButton, { transform: [{ scale: backButtonScaleAnim }] }]}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            {shop?.logo_url ? (
              <Image source={{ uri: shop.logo_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="storefront" size={32} color={Colors.textMuted} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.shopName}>{shop?.name || 'Your Shop'}</Text>
            <Text style={styles.shopRole}>{t('shop_owner')}</Text>
            <Text style={styles.memberSince}>{t('member_since')} {memberSince}</Text>
          </View>
        </View>

        {/* Upgrade Card */}
        <View style={styles.upgradeCard}>
          <View style={styles.upgradeHeader}>
            <Ionicons name="sparkles" size={32} color={Colors.white} />
          </View>
          <View style={styles.upgradeContent}>
            <View style={styles.upgradeTitleRow}>
              <Text style={styles.upgradeTitle}>{t('upgrade_to_pro')}</Text>
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>{t('most_popular')}</Text>
              </View>
            </View>
            <View style={styles.upgradeFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={16} color={Colors.primary} />
                <Text style={styles.featureText}>{t('pro_feature_1')}</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={16} color={Colors.primary} />
                <Text style={styles.featureText}>{t('pro_feature_2')}</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={16} color={Colors.primary} />
                <Text style={styles.featureText}>{t('pro_feature_3')}</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark" size={16} color={Colors.primary} />
                <Text style={styles.featureText}>{isThai ? 'ส่งออกข้อมูล' : 'Export data'}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleUpgrade}
              onPressIn={() => handlePressIn(upgradeScaleAnim)}
              onPressOut={() => handlePressOut(upgradeScaleAnim)}
            >
              <Animated.View style={[styles.upgradeButton, { transform: [{ scale: upgradeScaleAnim }] }]}>
                <Text style={styles.upgradeButtonText}>{t('unlock_pro')}</Text>
              </Animated.View>
            </Pressable>
          </View>
        </View>

        {/* Shop Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('shop_management')}</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="storefront-outline"
              label={t('edit_shop_info')}
              onPress={() => router.push('/edit-shop')}
            />
            <MenuItem
              icon="receipt-outline"
              label={t('receipt_history')}
              onPress={() => router.push('/(tabs)/history')}
            />
            <MenuItem
              icon="download-outline"
              iconColor={Colors.accent}
              label={t('export_for_tax')}
              sublabel={t('export_for_tax_desc')}
              onPress={handleExportReceipts}
            />
          </View>
        </View>

        {/* Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isThai ? 'การชำระเงิน' : 'PAYMENT'}</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="qr-code-outline"
              iconColor={Colors.primary}
              label="PromptPay ID"
              sublabel={shop?.promptpay_id || (isThai ? 'ยังไม่ได้ตั้งค่า' : 'Not set')}
              onPress={openPromptPayModal}
            />
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isThai ? 'สมาชิก' : 'SUBSCRIPTION'}</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionPlan}>
                <Text style={styles.subscriptionPlanName}>
                  {shop?.is_pro ? 'Pro' : (isThai ? 'ฟรี' : 'Free')}
                </Text>
                {!shop?.is_pro && (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>{isThai ? 'ปัจจุบัน' : 'Current'}</Text>
                  </View>
                )}
              </View>
              {!shop?.is_pro && (
                <TouchableOpacity style={styles.upgradeSmallButton} onPress={handleUpgrade}>
                  <Text style={styles.upgradeSmallText}>{isThai ? 'อัพเกรด' : 'Upgrade'}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.subscriptionStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{receiptsThisMonth}</Text>
                <Text style={styles.statLabel}>{isThai ? 'ใบเสร็จเดือนนี้' : 'Receipts this month'}</Text>
              </View>
              {!shop?.is_pro && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{FREE_TIER_LIMIT}</Text>
                  <Text style={styles.statLabel}>{isThai ? 'จำกัดต่อเดือน' : 'Monthly limit'}</Text>
                </View>
              )}
            </View>
            {!shop?.is_pro && (
              <View style={styles.usageBar}>
                <View
                  style={[
                    styles.usageProgress,
                    { width: `${Math.min(100, (receiptsThisMonth / FREE_TIER_LIMIT) * 100)}%` }
                  ]}
                />
              </View>
            )}
          </View>
        </View>

        {/* Account & Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account_preferences')}</Text>
          <View style={styles.menuGroup}>
            <View style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="globe-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{t('language')}</Text>
              </View>
              <LanguageToggle />
            </View>
            <MenuItem
              icon="help-circle-outline"
              iconColor={Colors.primary}
              label={t('help_support')}
              onPress={() => {
                haptic.light();
                setShowHelpModal(true);
              }}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <Pressable
            onPress={handleSignOut}
            onPressIn={() => handlePressIn(signOutScaleAnim)}
            onPressOut={() => handlePressOut(signOutScaleAnim)}
          >
            <Animated.View style={[styles.signOutButton, { transform: [{ scale: signOutScaleAnim }] }]}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={styles.signOutText}>{t('sign_out')}</Text>
            </Animated.View>
          </Pressable>
        </View>

        {/* Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>{t('version')} 2.4.0 (Build 82)</Text>
          <Text style={styles.versionSubtext}>BILLSNAP</Text>
        </View>
      </ScrollView>

      {/* PromptPay Edit Modal */}
      <Modal
        visible={showPromptPayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPromptPayModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.promptPayModalContent}>
            <Text style={styles.promptPayTitle}>PromptPay ID</Text>
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
                onPress={() => setShowPromptPayModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.promptPayCancelText}>
                  {isThai ? 'ยกเลิก' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.promptPaySaveButton, savingPromptPay && styles.buttonDisabled]}
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

      {/* Help & Support Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.helpModalOverlay}>
          <View style={styles.helpModalContent}>
            {/* Header */}
            <View style={styles.helpModalHeader}>
              <Text style={styles.helpModalTitle}>{t('help_title')}</Text>
              <TouchableOpacity
                onPress={() => setShowHelpModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpScrollView} showsVerticalScrollIndicator={false}>
              {/* FAQ Section */}
              <Text style={styles.helpSectionTitle}>{t('faq')}</Text>

              {/* FAQ Items */}
              {[
                { q: t('faq_create_receipt_q'), a: t('faq_create_receipt_a') },
                { q: t('faq_share_receipt_q'), a: t('faq_share_receipt_a') },
                { q: t('faq_promptpay_q'), a: t('faq_promptpay_a') },
                { q: t('faq_export_q'), a: t('faq_export_a') },
                { q: t('faq_pro_q'), a: t('faq_pro_a') },
              ].map((faq, index) => (
                <FaqItem
                  key={index}
                  question={faq.q}
                  answer={faq.a}
                  isExpanded={expandedFaq === index}
                  onToggle={() => {
                    haptic.selection();
                    setExpandedFaq(expandedFaq === index ? null : index);
                  }}
                />
              ))}

              {/* Contact Section */}
              <Text style={[styles.helpSectionTitle, { marginTop: Spacing.lg }]}>
                {t('contact_us')}
              </Text>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => {
                  haptic.medium();
                  Linking.openURL('https://line.me/ti/p/@856yljsk');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.contactIcon, { backgroundColor: '#06C755' }]}>
                  <Ionicons name="chatbubble-ellipses" size={20} color={Colors.white} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>{t('chat_on_line')}</Text>
                  <Text style={styles.contactValue}>{t('line_support_desc')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => {
                  haptic.medium();
                  Linking.openURL('mailto:support@billsnap.app');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.contactIcon, { backgroundColor: Colors.primary }]}>
                  <Ionicons name="mail" size={20} color={Colors.white} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>{t('email_us')}</Text>
                  <Text style={styles.contactValue}>{t('email_support_desc')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>

              <View style={{ height: Spacing.xl }} />
            </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  shopRole: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  memberSince: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  upgradeCard: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.primaryLight, // primaryLight bg
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  upgradeHeader: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  upgradeContent: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
  },
  upgradeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  upgradeTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  popularBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  upgradeFeatures: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingLeft: Spacing.md,
  },
  menuGroup: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  menuSublabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  // Language Toggle Styles
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  languageOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  languageOptionActive: {
    backgroundColor: Colors.primary,
  },
  languageText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  languageTextActive: {
    color: Colors.white,
  },
  languageDivider: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginHorizontal: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  signOutText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.error, // error red
  },
  versionSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  versionText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  versionSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 4,
  },
  // Subscription Card
  subscriptionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  subscriptionPlan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subscriptionPlanName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  freeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  freeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  upgradeSmallButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  upgradeSmallText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  subscriptionStats: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  usageBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageProgress: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptPayModalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  // Help Modal Styles
  helpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  helpModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '85%',
    paddingTop: Spacing.lg,
  },
  helpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  helpModalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  helpScrollView: {
    paddingHorizontal: Spacing.lg,
  },
  helpSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  faqItem: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  faqAnswer: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  contactValue: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
