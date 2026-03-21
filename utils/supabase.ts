import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Safe storage: use localStorage on web, AsyncStorage on native
const customStorage = {
    getItem: (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return Promise.resolve(null);
            return Promise.resolve(window.localStorage.getItem(key));
        }
        return AsyncStorage.getItem(key);
    },
    setItem: (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return Promise.resolve();
            window.localStorage.setItem(key, value);
            return Promise.resolve();
        }
        return AsyncStorage.setItem(key, value);
    },
    removeItem: (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return Promise.resolve();
            window.localStorage.removeItem(key);
            return Promise.resolve();
        }
        return AsyncStorage.removeItem(key);
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: customStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
