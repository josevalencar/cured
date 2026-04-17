import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// During Next.js static prerendering the env vars may not be available.
// Defer client creation to avoid crashing the build.
// At runtime in the browser, NEXT_PUBLIC_* vars are always inlined.
let _client: SupabaseClient | null = null

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          "Supabase env vars not set — this should only happen at build time"
        )
      }
      _client = createClient(supabaseUrl, supabaseAnonKey)
    }
    return (_client as unknown as Record<string | symbol, unknown>)[prop]
  },
})
