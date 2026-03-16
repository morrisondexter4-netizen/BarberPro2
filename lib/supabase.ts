import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey)

// createBrowserClient handles cookie-based session storage,
// which is required for the SSR middleware to read the session server-side.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
