import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { translations, Language, TranslationKey } from './translations';

const LANGUAGE_STORAGE_KEY = '@billsnap_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * Detect device language and return 'th' if Thai, otherwise 'en'
 */
function detectDeviceLanguage(): Language {
  try {
    // Get device locales array (new expo-localization API)
    const locales = Localization.getLocales();

    if (locales && locales.length > 0) {
      // Get the first (primary) locale's language code
      const languageCode = locales[0].languageCode?.toLowerCase() || 'en';

      // If device language is Thai, use Thai
      if (languageCode === 'th') {
        return 'th';
      }
    }
  } catch (error) {
    console.warn('Could not detect device language:', error);
  }

  // Default to English for all other languages
  return 'en';
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference or detect from device
  useEffect(() => {
    let mounted = true;

    async function loadLanguage() {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (__DEV__) console.log('Loaded language from storage:', savedLanguage);

        if (!mounted) return;

        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'th')) {
          // Use saved preference
          setLanguageState(savedLanguage);
        } else {
          // First time - detect from device
          const detectedLanguage = detectDeviceLanguage();
          setLanguageState(detectedLanguage);
          // Save the detected language
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, detectedLanguage);
        }
      } catch (error) {
        if (__DEV__) console.error('Error loading language:', error);
        // Fallback to device detection
        if (mounted) {
          setLanguageState(detectDeviceLanguage());
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  // Set language and persist
  const setLanguage = useCallback(async (lang: Language) => {
    try {
      if (__DEV__) console.log('Setting language to:', lang);
      setLanguageState(lang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      if (__DEV__) console.log('Language saved successfully');
    } catch (error) {
      if (__DEV__) console.error('Error saving language:', error);
    }
  }, []);

  // Translation function
  const t = useCallback(
    (key: TranslationKey): string => {
      const translation = translations[language][key];
      if (!translation) {
        console.warn(`Missing translation for key: ${key}`);
        return key;
      }
      return translation;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Hook to just get the translation function (simpler API)
 */
export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}
