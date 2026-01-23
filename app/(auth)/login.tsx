import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../../constants/theme';
import { useGoogleAuth } from '../../lib/auth/useGoogleAuth';
import { useEmailAuth } from '../../lib/auth/useEmailAuth';
import { useLanguage, useTranslation } from '../../lib/i18n';
import { haptic } from '../../lib/haptics';

const { width } = Dimensions.get('window');

type AuthMode = 'options' | 'email_entry' | 'otp_verify';

export default function LoginScreen() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { signInWithGoogle, loading: googleLoading, isReady } = useGoogleAuth();
  const { sendOtp, verifyOtp, loading: emailLoading, clearError } = useEmailAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('options');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const otpInputRefs = React.useRef<(TextInput | null)[]>([]);

  // Rate limiting state
  const [resendCooldown, setResendCooldown] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const cooldownInterval = useRef<NodeJS.Timeout | null>(null);

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownInterval.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownInterval.current) clearInterval(cooldownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownInterval.current) clearInterval(cooldownInterval.current);
    };
  }, [resendCooldown > 0]);

  // Check if currently locked out
  const isLockedOut = lockoutUntil && Date.now() < lockoutUntil;
  const lockoutRemaining = isLockedOut ? Math.ceil((lockoutUntil - Date.now()) / 1000) : 0;

  const isThai = language === 'th';
  const loading = googleLoading || emailLoading;

  const handleGoogleSignIn = async () => {
    haptic.medium();
    const result = await signInWithGoogle();

    if (result.error) {
      haptic.error();
      Alert.alert(isThai ? 'เข้าสู่ระบบไม่สำเร็จ' : 'Sign In Failed', result.error);
    }
  };

  // Send OTP code to email
  const handleSendOtp = async (isResend = false) => {
    // Prevent double-send while loading
    if (emailLoading) {
      console.log('⚠️ Already sending, skipping');
      return;
    }

    // Check lockout
    if (isLockedOut) {
      haptic.error();
      Alert.alert(
        isThai ? 'ถูกล็อค' : 'Locked Out',
        isThai
          ? `ลองใหม่ใน ${Math.ceil(lockoutRemaining / 60)} นาที`
          : `Try again in ${Math.ceil(lockoutRemaining / 60)} minutes`
      );
      return;
    }

    // Check resend cooldown
    if (isResend && resendCooldown > 0) {
      return;
    }

    if (!email.trim()) {
      Alert.alert(
        isThai ? 'กรอกอีเมล' : 'Enter Email',
        isThai ? 'กรุณากรอกอีเมลของคุณ' : 'Please enter your email'
      );
      return;
    }

    haptic.medium();
    const result = await sendOtp(email);

    if (result.success) {
      haptic.success();
      setOtpCode(['', '', '', '', '', '']);
      setResendCooldown(60); // Start 60 second cooldown
      if (!isResend) {
        setAuthMode('otp_verify');
      }
    } else if (result.error) {
      haptic.error();
      Alert.alert(isThai ? 'เกิดข้อผิดพลาด' : 'Error', result.error);
    }
  };

  // Verify OTP code
  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otpCode.join('');
    console.log('🔑 handleVerifyOtp called, code:', code, 'loading:', loading, 'locked:', isLockedOut);

    // Check lockout
    if (isLockedOut) {
      haptic.error();
      Alert.alert(
        isThai ? 'ถูกล็อค' : 'Locked Out',
        isThai
          ? `ลองใหม่ใน ${Math.ceil(lockoutRemaining / 60)} นาที`
          : `Try again in ${Math.ceil(lockoutRemaining / 60)} minutes`
      );
      return;
    }

    if (code.length !== 6) {
      Alert.alert(
        isThai ? 'รหัสไม่ครบ' : 'Incomplete Code',
        isThai ? 'กรุณากรอกรหัส 6 หลัก' : 'Please enter the 6-digit code'
      );
      return;
    }

    haptic.medium();
    const result = await verifyOtp(email, code);

    if (result.success) {
      haptic.success();
      setFailedAttempts(0);
      setOtpError(null);
    } else if (result.error) {
      haptic.error();
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      // Lock out after 5 failed attempts (5 min lockout)
      if (newFailedAttempts >= 5) {
        const lockoutDuration = 5 * 60 * 1000; // 5 minutes
        setLockoutUntil(Date.now() + lockoutDuration);
        setFailedAttempts(0);
        setOtpError(isThai ? 'ถูกล็อค 5 นาที' : 'Locked for 5 minutes');
      } else {
        const attemptsLeft = 5 - newFailedAttempts;
        setOtpError(
          isThai
            ? `รหัสไม่ถูกต้อง (เหลือ ${attemptsLeft} ครั้ง)`
            : `Wrong code (${attemptsLeft} attempts left)`
        );
      }
      // Clear OTP inputs
      setOtpCode(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    }
  };

  // Handle OTP input
  const handleOtpChange = (text: string, index: number) => {
    if (otpError) setOtpError(null); // Clear error when typing
    const cleaned = text.replace(/[^0-9]/g, '');

    if (cleaned.length <= 1) {
      const newOtp = [...otpCode];
      newOtp[index] = cleaned;
      setOtpCode(newOtp);

      if (cleaned && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }

      if (cleaned && index === 5) {
        const fullCode = newOtp.join('');
        if (fullCode.length === 6) {
          handleVerifyOtp(fullCode);
        }
      }
    } else if (cleaned.length === 6) {
      const digits = cleaned.split('');
      setOtpCode(digits);
      otpInputRefs.current[5]?.focus();
      // Auto-verify when pasting full code
      handleVerifyOtp(cleaned);
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleLanguageChange = (lang: 'en' | 'th') => {
    haptic.selection();
    setLanguage(lang);
  };

  const switchMode = (mode: AuthMode) => {
    haptic.light();
    clearError();
    setAuthMode(mode);
  };

  // Main options view
  const renderOptions = () => (
    <>
      <View style={styles.topSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logoInner}>
            <Ionicons name="receipt" size={40} color={Colors.white} />
          </View>
        </View>
        <Text style={styles.appName}>BillSnap</Text>
        <Text style={styles.appNameThai}>ใบเสร็จปัง</Text>
      </View>

      <View style={styles.middleSection}>
        <Text style={styles.tagline}>
          {isThai ? 'สร้างและแชร์ใบเสร็จทันที' : 'Create & share receipts instantly'}
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          activeOpacity={0.9}
          disabled={loading || !isReady}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <View style={styles.googleIconContainer}>
                <Ionicons name="logo-google" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.googleButtonText}>
                {isThai ? 'ดำเนินการด้วย Google' : 'Continue with Google'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{isThai ? 'หรือ' : 'OR'}</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.emailButton}
          onPress={() => switchMode('email_entry')}
          activeOpacity={0.9}
        >
          <Ionicons name="mail-outline" size={20} color={Colors.primary} />
          <Text style={styles.emailButtonText}>
            {isThai ? 'เข้าสู่ระบบด้วยอีเมล' : 'Sign in with Email'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          {isThai ? 'ดำเนินการต่อหมายถึงยอมรับ ' : 'By continuing, you agree to our '}
          <Text
            style={styles.termsLink}
            onPress={() => Linking.openURL('https://billsnap.app/terms')}
          >
            {isThai ? 'ข้อตกลง' : 'Terms'}
          </Text>
          {isThai ? ' และ ' : ' and '}
          <Text
            style={styles.termsLink}
            onPress={() => Linking.openURL('https://billsnap.app/privacy')}
          >
            {isThai ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy'}
          </Text>
        </Text>

        <View style={styles.languageContainer}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              language === 'en' && styles.languageButtonActive,
            ]}
            onPress={() => handleLanguageChange('en')}
          >
            <Text style={[
              styles.languageText,
              language === 'en' && styles.languageTextActive,
            ]}>
              EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageButton,
              language === 'th' && styles.languageButtonActive,
            ]}
            onPress={() => handleLanguageChange('th')}
          >
            <Text style={[
              styles.languageText,
              language === 'th' && styles.languageTextActive,
            ]}>
              ไทย
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  // Email entry screen (step 1 of OTP flow)
  const renderEmailEntry = () => (
    <KeyboardAvoidingView
      style={styles.emailFormContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => switchMode('options')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.emailFormScroll}
        contentContainerStyle={styles.emailFormContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emailHeader}>
          <View style={styles.emailIconContainer}>
            <Ionicons name="mail" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.emailTitle}>
            {isThai ? 'เข้าสู่ระบบ' : 'Sign In'}
          </Text>
          <Text style={styles.emailSubtitle}>
            {isThai ? 'เราจะส่งรหัส 6 หลักไปที่อีเมลของคุณ' : "We'll send a 6-digit code to your email"}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{isThai ? 'อีเมล' : 'Email'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={() => handleSendOtp(false)}
            disabled={loading}
            activeOpacity={0.9}
          >
            {emailLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isThai ? 'ส่งรหัส' : 'Send Code'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // OTP verification screen (step 2 of OTP flow)
  const renderOtpVerify = () => (
    <KeyboardAvoidingView
      style={styles.emailFormContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => switchMode('email_entry')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.emailFormScroll}
        contentContainerStyle={styles.emailFormContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emailHeader}>
          <View style={styles.emailIconContainer}>
            <Ionicons name="keypad" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.emailTitle}>
            {isThai ? 'กรอกรหัส' : 'Enter Code'}
          </Text>
          <Text style={styles.emailSubtitle}>
            {isThai ? 'เราส่งรหัส 6 หลักไปที่' : 'We sent a 6-digit code to'}
          </Text>
          <View style={styles.emailBadge}>
            <Ionicons name="mail" size={14} color={Colors.primary} />
            <Text style={styles.emailBadgeText}>{email}</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.otpContainer}>
            {otpCode.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { otpInputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                  otpError && styles.otpInputError,
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleOtpKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          {otpError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{otpError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={() => handleVerifyOtp()}
            disabled={loading}
            activeOpacity={0.9}
          >
            {emailLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isThai ? 'ยืนยัน' : 'Verify'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resendButton,
              (loading || resendCooldown > 0) && styles.resendButtonDisabled,
            ]}
            onPress={() => handleSendOtp(true)}
            disabled={loading || resendCooldown > 0}
          >
            <Ionicons
              name="refresh"
              size={16}
              color={resendCooldown > 0 ? Colors.textMuted : Colors.primary}
            />
            <Text
              style={[
                styles.resendButtonText,
                resendCooldown > 0 && styles.resendButtonTextDisabled,
              ]}
            >
              {resendCooldown > 0
                ? isThai
                  ? `ส่งอีกครั้งใน ${resendCooldown} วินาที`
                  : `Resend in ${resendCooldown}s`
                : isThai
                  ? 'ส่งรหัสอีกครั้ง'
                  : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderContent = () => {
    switch (authMode) {
      case 'email_entry':
        return renderEmailEntry();
      case 'otp_verify':
        return renderOtpVerify();
      default:
        return renderOptions();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  topSection: {
    flex: 0.35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  appNameThai: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  middleSection: {
    flex: 0.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottomSection: {
    flex: 0.5,
    justifyContent: 'flex-start',
    paddingTop: Spacing.lg,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    ...Shadows.md,
  },
  googleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    height: 56,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  emailButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.primary,
  },
  terms: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  languageButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  languageButtonActive: {
    backgroundColor: Colors.primary,
  },
  languageText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  languageTextActive: {
    color: Colors.white,
  },
  emailFormContainer: {
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.md,
    marginTop: Spacing.sm,
  },
  emailFormScroll: {
    flex: 1,
  },
  emailFormContent: {
    paddingBottom: Spacing.xl,
  },
  emailHeader: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  emailIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emailTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emailSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  formContainer: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  textInput: {
    height: 56,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  submitButton: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.white,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  emailBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginVertical: Spacing.lg,
  },
  otpInput: {
    width: 38,
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  otpInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: '#fef2f2',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#ef4444',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
  },
  resendButtonDisabled: {
    backgroundColor: Colors.background,
  },
  resendButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  resendButtonTextDisabled: {
    color: Colors.textMuted,
  },
});
