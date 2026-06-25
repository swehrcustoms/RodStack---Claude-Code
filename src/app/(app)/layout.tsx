import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/features/app-shell/Sidebar'
import { TopNav } from '@/components/features/app-shell/TopNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const supabase = createServerClient()
  const { data: profileData } = await supabase
    .from('profiles')
    .select('display_name, plan_tier')
    .eq('id', user.id)
    .maybeSingle()

  const profile = profileData as { display_name: string | null; plan_tier: string } | null
  const displayName = profile?.display_name ?? user.user_metadata?.display_name ?? null
  const planTier    = profile?.plan_tier ?? 'enterprise'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0C0B09' }}>
      {/* Sidebar */}
      <div className="hidden md:flex md:w-[240px] md:shrink-0">
        <Sidebar displayName={displayName} email={user.email} />
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav
          email={user.email}
          displayName={displayName}
          planTier={planTier}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
