import type { Metadata } from 'next'
import Link from 'next/link'
import { Wrench, Package, Archive, DollarSign, ArrowRight, Plus } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatRodLength, titleCase } from '@/lib/format'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()

  const [buildsResult, inventoryResult] = await Promise.all([
    supabase
      .from('rod_builds')
      .select('id, name, rod_length, power, action, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('inventory_items')
      .select('id, unit_cost, quantity')
      .eq('user_id', user.id),
  ])

  const builds = buildsResult.data ?? []
  const inventory = inventoryResult.data ?? []

  const totalBuilds = builds.length
  const inventoryValue = inventory.reduce((sum, i) => sum + i.unit_cost * i.quantity, 0)
  const totalInventoryItems = inventory.length
  const hasData = totalBuilds > 0 || totalInventoryItems > 0

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your rod building workspace at a glance."
        actions={
          <Link href="/rod-builder">
            <Button iconLeft={<Plus />}>New build</Button>
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Builds"
          value={String(totalBuilds)}
          href="/builds"
        />
        <StatCard
          icon={Archive}
          label="Inventory Items"
          value={String(totalInventoryItems)}
          href="/inventory"
        />
        <StatCard
          icon={DollarSign}
          label="Inventory Value"
          value={`$${inventoryValue.toFixed(2)}`}
          href="/costing"
        />
        <StatCard
          icon={Wrench}
          label="Active Builder"
          value="Ready"
          href="/rod-builder"
          accent
        />
      </div>

      {/* Content */}
      {!hasData ? (
        <OnboardingState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent builds */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Builds</CardTitle>
                  <Link href="/builds" className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {builds.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No builds yet.</p>
                ) : (
                  <div className="divide-y divide-slate-700/50">
                    {builds.map((build) => (
                      <Link
                        key={build.id}
                        href={`/builds/${build.id}`}
                        className="flex items-center justify-between gap-4 py-3 group hover:bg-slate-700/20 -mx-2 px-2 rounded transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate group-hover:text-slate-50">
                            {build.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatRodLength(build.rod_length)} · {titleCase(build.power)} · {titleCase(build.action)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600 shrink-0">{formatDate(build.updated_at)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <QuickAction href="/rod-builder" icon={Wrench} label="Start new build" />
                <QuickAction href="/inventory" icon={Archive} label="Add inventory" />
                <QuickAction href="/costing" icon={DollarSign} label="Review costs" />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- Sub-components ---- */

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  href: string
  accent?: boolean
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-slate-600 transition-colors cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
              <p className={`mt-2 text-2xl font-semibold font-mono ${accent ? 'text-amber-500' : 'text-slate-50'}`}>
                {value}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700">
              <Icon className="h-4.5 w-4.5 text-slate-400" aria-hidden="true" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ElementType
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors group"
    >
      <Icon className="h-4 w-4 text-slate-500 group-hover:text-amber-500 transition-colors" aria-hidden="true" />
      {label}
      <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}

function OnboardingState() {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <EmptyState
        icon={<Wrench className="h-6 w-6" />}
        title="Create your first build"
        description="Spec out a rod with length, power, action, and materials. Guide count is estimated automatically."
        action={
          <Link href="/rod-builder">
            <Button iconLeft={<Plus />}>Start first build</Button>
          </Link>
        }
      />
      <EmptyState
        icon={<Archive className="h-6 w-6" />}
        title="Track your inventory"
        description="Add blanks, guides, thread, and hardware to keep track of what you have on hand."
        action={
          <Link href="/inventory">
            <Button variant="secondary" iconLeft={<Plus />}>Add inventory</Button>
          </Link>
        }
      />
    </div>
  )
}
