// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = "https://rwuirfcejlgqkcmoxoyo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dWlyZmNlamxncWtjbW94b3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTI5MDEsImV4cCI6MjA5MjA4ODkwMX0._JwB35y906uiCfzdWK5vWMaaWJ8oPaQw52cgQo8oGV4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'skillz-supabase-session', // clé unique
  },
});