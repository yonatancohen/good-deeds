import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Check your .env file.');
}

/**
 * Implicit flow is required for invite / recovery emails opened on another
 * device than the admin who triggered the send. PKCE stores a code verifier
 * only in the sender's browser, so teachers always saw "invalid/expired link".
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'implicit',
  },
});

export type { Database } from '@/types/supabase';
export type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';
