import { RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Linking from 'expo-linking';
import { Alert, Platform, View } from 'react-native';

// Store last failed share URI for retry
let lastFailedShareUri: string | null = null;

/**
 * Capture a receipt component as an image
 * @param ref - React ref to the receipt component
 * @returns Promise with the URI of the captured image
 */
export async function captureReceipt(ref: RefObject<View | null>): Promise<string> {
  try {
    const uri = await captureRef(ref, {
      format: 'png',
      quality: 0.8,
      result: 'tmpfile',
    });
    return uri;
  } catch (error) {
    if (__DEV__) console.error('Error capturing receipt:', error);
    throw new Error('Failed to capture receipt image');
  }
}

/**
 * Share a receipt image via native share sheet
 * @param uri - URI of the image to share
 */
export async function shareReceipt(uri: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      Alert.alert('Error', 'Sharing is not available on this device');
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share Receipt',
    });

    // Clear last failed URI on success
    lastFailedShareUri = null;
  } catch (error) {
    if (__DEV__) console.error('Error sharing receipt:', error);

    // Store URI for retry
    lastFailedShareUri = uri;

    Alert.alert(
      'Share Failed',
      'Failed to share receipt. Would you like to try again?',
      [
        {
          text: 'Retry',
          onPress: () => shareReceipt(uri),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }
}

/**
 * Share receipt to LINE specifically
 * Opens LINE app if available, falls back to share sheet
 * @param uri - URI of the image to share
 */
export async function shareToLine(uri: string): Promise<void> {
  try {
    // Check if LINE is installed using URL scheme
    const lineScheme = Platform.OS === 'ios' ? 'line://' : 'line://';
    const canOpenLine = await Linking.canOpenURL(lineScheme);

    if (canOpenLine) {
      // LINE is installed - use share sheet which will prioritize LINE
      // Note: LINE doesn't support direct image sharing via URL scheme
      // We use the share sheet but the UX expectation is set for LINE
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share to LINE',
        UTI: 'public.png', // iOS specific
      });
    } else {
      // LINE not installed - show alert with option to install or use share sheet
      Alert.alert(
        'LINE Not Installed',
        'Would you like to install LINE or share via another app?',
        [
          {
            text: 'Install LINE',
            onPress: () => {
              const storeUrl = Platform.OS === 'ios'
                ? 'https://apps.apple.com/app/line/id443904275'
                : 'https://play.google.com/store/apps/details?id=jp.naver.line.android';
              Linking.openURL(storeUrl);
            },
          },
          {
            text: 'Share via Other',
            onPress: () => shareReceipt(uri),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  } catch (error) {
    if (__DEV__) console.error('Error sharing to LINE:', error);

    // Store URI for retry
    lastFailedShareUri = uri;

    Alert.alert(
      'Share Failed',
      'Failed to share to LINE. Would you like to try again?',
      [
        {
          text: 'Retry',
          onPress: () => shareToLine(uri),
        },
        {
          text: 'Share via Other',
          onPress: () => shareReceipt(uri),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }
}

/**
 * Save receipt image to device gallery
 * @param uri - URI of the image to save
 */
export async function saveToGallery(uri: string): Promise<void> {
  try {
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to save images to your gallery'
      );
      return;
    }

    // Save to gallery
    await MediaLibrary.createAssetAsync(uri);

    Alert.alert('Success', 'Receipt saved to gallery!');
  } catch (error) {
    if (__DEV__) console.error('Error saving to gallery:', error);

    // Store URI for retry
    lastFailedShareUri = uri;

    Alert.alert(
      'Save Failed',
      'Failed to save receipt to gallery. Would you like to try again?',
      [
        {
          text: 'Retry',
          onPress: () => saveToGallery(uri),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }
}

/**
 * Combined capture and share flow
 * @param ref - React ref to the receipt component
 */
export async function captureAndShare(ref: RefObject<View | null>): Promise<void> {
  try {
    const uri = await captureReceipt(ref);
    await shareReceipt(uri);
  } catch (error) {
    if (__DEV__) console.error('Error in capture and share flow:', error);
    Alert.alert('Error', 'Failed to share receipt');
  }
}

/**
 * Combined capture and share to LINE flow
 * @param ref - React ref to the receipt component
 */
export async function captureAndShareToLine(ref: RefObject<View | null>): Promise<void> {
  try {
    const uri = await captureReceipt(ref);
    await shareToLine(uri);
  } catch (error) {
    if (__DEV__) console.error('Error in capture and share to LINE flow:', error);
    Alert.alert('Error', 'Failed to share receipt');
  }
}

/**
 * Combined capture and save flow
 * @param ref - React ref to the receipt component
 */
export async function captureAndSave(ref: RefObject<View | null>): Promise<void> {
  try {
    const uri = await captureReceipt(ref);
    await saveToGallery(uri);
  } catch (error) {
    if (__DEV__) console.error('Error in capture and save flow:', error);
    Alert.alert('Error', 'Failed to save receipt');
  }
}
