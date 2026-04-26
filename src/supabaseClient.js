import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = "https://rwuirfcejlgqkcmoxoyo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dWlyZmNlamxncWtjbW9veCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQ0Njg2NzQzLCJleHAiOjIwNjAyNjI3NDN9.t27Xl2L3Z4R0dL4E0j5Y3Z8F8I2R0eY8QkGq1pXg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});