import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ((import.meta as any).env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || '').trim();

const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

if (!isConfigured) {
  console.warn("Supabase credentials missing! Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.");
}

const safeUrl = isConfigured ? supabaseUrl : 'https://placeholder-9828347.supabase.co';
const safeKey = isConfigured ? supabaseAnonKey : 'placeholder-anon-key-9828347';

export const supabase = createClient(safeUrl, safeKey);
