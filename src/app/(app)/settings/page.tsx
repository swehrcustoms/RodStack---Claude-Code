import type { Metadata } from 'next'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { ProfileForm } from '@/components/features/settings/ProfileForm'
import { SignOutButton } from '@/components/features/settings/SignOutButton'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('display_name, created_at')
    .eq('id', user.id)
    .maybeSingle()
  const profile = profileRaw as { display_name: string | null; created_at: string } | null

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences."
      />

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name and account details.</CardDescription>
        </CardHeader>
        <Divider />
        <CardContent className="pt-5">
          <ProfileForm
            userId={user.id}
            initialDisplayName={profile?.display_name ?? user.user_metadata?.display_name ?? ''}
            email={user.email ?? ''}
          />
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your RodStack account information.</CardDescription>
        </CardHeader>
        <Divider />
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-300">Email address</p>
              <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
            </div>
            <Badge variant="success">Verified</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-300">Member since</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {profile?.created_at ? formatDate(profile.created_at) : formatDate(user.created_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-900/30">
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>Sign out from this device.</CardDescription>
        </CardHeader>
        <Divider />
        <CardContent className="pt-5">
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  )
}
