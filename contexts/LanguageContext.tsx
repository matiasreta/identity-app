import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { translations, Locale, TranslationKey } from '@/utils/i18n';

interface LanguageContextData {
    locale: Locale;
    setLocale: (locale: Locale) => Promise<void>;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextData>({} as LanguageContextData);

const LOCALE_STORAGE_KEY = '@app_locale';

// Platform-safe storage helpers
const storageGet = (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
        if (typeof window === 'undefined') return Promise.resolve(null);
        return Promise.resolve(window.localStorage.getItem(key));
    }
    return AsyncStorage.getItem(key);
};

const storageSet = (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
        if (typeof window === 'undefined') return Promise.resolve();
        window.localStorage.setItem(key, value);
        return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en');

    useEffect(() => {
        const loadLocale = async () => {
            try {
                const savedLocale = await storageGet(LOCALE_STORAGE_KEY);
                if (savedLocale === 'en' || savedLocale === 'es') {
                    setLocaleState(savedLocale);
                }
            } catch (error) {
                console.error('Failed to load locale:', error);
            }
        };
        loadLocale();
    }, []);

    const setLocale = async (newLocale: Locale) => {
        setLocaleState(newLocale);
        try {
            await storageSet(LOCALE_STORAGE_KEY, newLocale);
        } catch (error) {
            console.error('Failed to save locale:', error);
        }
    };

    const t = (key: TranslationKey): string => {
        return translations[locale][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
