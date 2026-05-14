import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = String(extra.supabaseUrl ?? '');
const supabaseAnonKey = String(extra.supabaseAnonKey ?? '');

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl || 'https://example.supabase.co', supabaseAnonKey || 'demo-key');
