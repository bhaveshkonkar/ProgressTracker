import { createClient } from '@supabase/supabase-js';

// Safely access process.env to avoid crashes in environments where it might not be defined
const getEnv = (key: string) => {
  try {
    return typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// User provided credentials
const PROVIDED_URL = 'https://hycmcootrzydytzuhpti.supabase.co';
const PROVIDED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y21jb290cnp5ZHl0enVocHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjIxNTksImV4cCI6MjA4NjgzODE1OX0.Dlvkkw2xZYegqdoYUQN5IuU-gIIgGMudt5YHmblE9LQ';

const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL') || PROVIDED_URL;
const supabaseAnonKey = getEnv('REACT_APP_SUPABASE_ANON_KEY') || PROVIDED_KEY;

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn("Supabase URL or Key missing. App running in fallback mode. Authentication will fail.");
}

// Fallback to prevent app crash on startup if env vars are missing
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

// Cast to 'any' to resolve potential type mismatch issues with strict TS configurations
export const supabase = createClient(url, key) as any;
export const isSupabaseConfigured = isConfigured;