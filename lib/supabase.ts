import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey)

let _client: ReturnType<typeof createBrowserClient> | null = null

/** Lazy singleton — never calls createBrowserClient with empty strings. */
export function getSupabase() {
  if (!_client) {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      )
    }
    _client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}
