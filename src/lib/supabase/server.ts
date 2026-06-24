import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

function buildCookieAdapter() {
  const cookieStore = cookies()
  return {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet: CookieToSet[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
        )
      } catch {
        // Called from a Server Component — ignore.
      }
    },
  }
}

/** Supabase client for use in Server Components, Server Actions, and Route Handlers.
 *  Returns an `any`-typed client to avoid postgrest-js 2.x / TS 5.9 generic resolution issues.
 *  Callers should cast query results explicitly. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServerClient(): any {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: buildCookieAdapter() }
  )
}

/** Get the current authenticated user, or null */
export async function getCurrentUser() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
