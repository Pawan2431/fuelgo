import { createClient } from '@supabase/supabase-js';

// Environment variables from Vite (.env file)
// Fallback to the same Supabase project currently used by the backend if env vars aren't set yet.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://feshnblvfdhjvgehklvd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlc2huYmx2ZmRoanZnZWhrbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE384NzgyMTQ0LCJleHAiOjIxMDAzNTgxNDR9.8AKDE2oehprL4yYcyKhGBSrX4ovH4OJQkq3paueweE0';

// Create and export the Supabase React client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
