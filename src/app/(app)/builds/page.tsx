import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { BuildCard } from '@/components/features/builds/BuildCard'
import type { RodBuild } from '@/types/rod'

export const metadata: Metadata = { title: 'Builds' }

export default async function BuildsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()
  const { data: builds } = await supabase
    .from('rod_builds')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const rodBuilds = (builds ?? []) as RodBuild[]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Saved Builds"
        description={`${rodBuilds.length} build${rodBuilds.length !== 1 ? 's' : ''} in your workspace.`}
        actions={
          <Link href="/rod-builder">
            <Button iconLeft={<Plus />}>New build</Button>
          </Link>
        }
      />

      {rodBuilds.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No builds yet"
          description="Create your first rod build. Spec out length, power, action, and materials — guide count is estimated automatically."
          action={
            <Link href="/rod-builder">
              <Button iconLeft={<Plus />}>Create first build</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rodBuilds.map((build) => (
            <BuildCard key={build.id} build={build} />
          ))}
        </div>
      )}
    </div>
  )
}
