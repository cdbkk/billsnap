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
  Image,
  ActionSheetIOS,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth/AuthContext';
import { useShop } from '../lib/hooks/useShop';
import { useTranslation } from '../lib/i18n';
import { STORE_TYPES, StoreType, SHOP_MODES, ShopMode } from '../types';
import { useLanguage } from '../lib/i18n';

export default function EditShopScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { shop, refetch } = useShop();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    shopName: '',
    promptpayId: '',
    storeType: 'street_food' as StoreType,
    shopMode: 'quick' as ShopMode,
  });

  const isThai = language === 'th';

  // Load existing shop data
  useEffect(() => {
    if (shop) {
      setForm({
        shopName: shop.name || '',
        promptpayId: shop.promptpay_id || '',
        storeType: shop.store_type || 'street_food',
        shopMode: shop.shop_mode || 'quick',
      });
      if (shop.logo_url) {
        setSelectedImage(shop.logo_url);
      }
    }
  }, [shop]);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        isThai ? 'ต้องการสิทธิ์' : 'Permissions Required',
        isThai ? 'กรุณาอนุญาตใช้กล้องและคลังรูปภาพ' : 'Please grant camera and photo library permissions.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async (useCamera: boolean) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const showImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            isThai ? 'ยกเลิก' : 'Cancel',
            isThai ? 'ถ่ายรูป' : 'Take Photo',
            isThai ? 'เลือกจากคลัง' : 'Choose from Library'
          ],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickImage(true);
          else if (buttonIndex === 2) pickImage(false);
        }
      );
    } else {
      Alert.alert(
        isThai ? 'เลือกรูป' : 'Select Photo',
        '',
        [
          { text: isThai ? 'ยกเลิก' : 'Cancel', style: 'cancel' },
          { text: isThai ? 'ถ่ายรูป' : 'Take Photo', onPress: () => pickImage(true) },
          { text: isThai ? 'เลือกจากคลัง' : 'Choose from Library', onPress: () => pickImage(false) },
        ]
      );
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    if (!shop || !user) return null;
    if (uri.startsWith('http')) return uri;

    setUploadingImage(true);
    try {
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${shop.id}-${Date.now()}.${ext}`;
      const filePath = `shop-logos/${fileName}`;

      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error } = await supabase.storage
        .from('shop-assets')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('shop-assets')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        isThai ? 'อัพโหลดไม่สำเร็จ' : 'Upload Failed',
        isThai ? 'ลองใหม่อีกครั้ง' : 'Please try again.'
      );
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!form.shopName.trim()) {
      Alert.alert(
        isThai ? 'กรุณากรอก' : 'Required',
        isThai ? 'กรุณาใส่ชื่อร้าน' : 'Please enter your shop name'
      );
      return;
    }

    if (!user || !shop) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setLoading(true);
    try {
      let logoUrl: string | null = shop.logo_url;
      if (selectedImage === null) {
        logoUrl = null;
      } else if (selectedImage && selectedImage !== shop.logo_url) {
        const uploadedUrl = await uploadImage(selectedImage);
        if (uploadedUrl) logoUrl = uploadedUrl;
      }

      const { error } = await supabase
        .from('shops')
        .update({
          name: form.shopName.trim(),
          promptpay_id: form.promptpayId.trim() || null,
          logo_url: logoUrl,
          store_type: form.storeType,
          shop_mode: form.shopMode,
        })
        .eq('id', shop.id);

      if (error) throw error;

      await refetch();

      Alert.alert(
        isThai ? 'สำเร็จ' : 'Success',
        isThai ? 'บันทึกแล้ว' : 'Shop info updated!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving shop:', error);
      Alert.alert(
        isThai ? 'เกิดข้อผิดพลาด' : 'Error',
        isThai ? 'บันทึกไม่สำเร็จ' : 'Failed to save. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

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
              {isThai ? 'แก้ไขร้านค้า' : 'Edit Shop'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Logo + Name Section */}
          <View style={styles.topSection}>
            <TouchableOpacity
              style={styles.logoContainer}
              onPress={showImagePicker}
              activeOpacity={0.8}
            >
              <View style={styles.logo}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.logoImage} />
                ) : (
                  <Ionicons name="storefront" size={32} color={Colors.white} />
                )}
              </View>
              <View style={styles.logoBadge}>
                <Ionicons name="camera" size={12} color={Colors.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.nameInputContainer}>
              <TextInput
                style={styles.nameInput}
                placeholder={isThai ? 'ชื่อร้านของคุณ' : 'Your shop name'}
                placeholderTextColor={Colors.textMuted}
                value={form.shopName}
                onChangeText={(text) => setForm({ ...form, shopName: text })}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* PromptPay Section - Most Important */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="qr-code" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>PromptPay</Text>
                <Text style={styles.sectionSubtitle}>
                  {isThai ? 'รับเงินจากลูกค้า' : 'Receive payments'}
                </Text>
              </View>
            </View>
            <TextInput
              style={styles.input}
              placeholder={isThai ? 'เบอร์โทร เช่น 0812345678' : 'Phone number e.g. 0812345678'}
              placeholderTextColor={Colors.textMuted}
              value={form.promptpayId}
              onChangeText={(text) => setForm({ ...form, promptpayId: text })}
              keyboardType="number-pad"
            />
          </View>

          {/* Mode Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {isThai ? 'โหมด' : 'Mode'}
            </Text>
            <View style={styles.modeContainer}>
              {SHOP_MODES.map((mode) => (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.modeOption,
                    form.shopMode === mode.value && styles.modeOptionActive,
                  ]}
                  onPress={() => setForm({ ...form, shopMode: mode.value })}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={mode.icon as any}
                    size={24}
                    color={form.shopMode === mode.value ? Colors.white : Colors.textSecondary}
                  />
                  <Text style={[
                    styles.modeLabel,
                    form.shopMode === mode.value && styles.modeLabelActive,
                  ]}>
                    {isThai ? mode.labelTh : mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Store Type Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {isThai ? 'ประเภทร้าน' : 'Store Type'}
            </Text>
            <View style={styles.storeTypeGrid}>
              {STORE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.storeTypeCard,
                    form.storeType === type.value && styles.storeTypeCardActive,
                  ]}
                  onPress={() => setForm({ ...form, storeType: type.value })}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={32}
                    color={form.storeType === type.value ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={[
                    styles.storeTypeLabel,
                    form.storeType === type.value && styles.storeTypeLabelActive,
                  ]} numberOfLines={1}>
                    {isThai ? type.labelTh : type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, (loading || uploadingImage) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading || uploadingImage}
            activeOpacity={0.9}
          >
            {loading || uploadingImage ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>
                {isThai ? 'บันทึก' : 'Save'}
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
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
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
  // Top section with logo and name
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  logoContainer: {
    position: 'relative',
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  nameInputContainer: {
    flex: 1,
  },
  nameInput: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    padding: 0,
  },
  // Sections
  section: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 52,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  // Mode selector
  modeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeLabelActive: {
    color: Colors.white,
  },
  // Store type grid
  storeTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  storeTypeCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  storeTypeCardActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  storeTypeLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  storeTypeLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  // Footer
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
