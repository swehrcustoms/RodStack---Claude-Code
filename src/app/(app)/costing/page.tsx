import type { Metadata } from 'next'
import Link from 'next/link'
import { DollarSign, Plus, ArrowRight } from 'lucide-react'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Divider } from '@/components/ui/Divider'
import { Button } from '@/components/ui/Button'
import { BuildCostForm } from '@/components/features/costing/BuildCostForm'
import { formatCurrency, formatRodLength, titleCase } from '@/lib/format'
import type { RodBuild } from '@/types/rod'

export const metadata: Metadata = { title: 'Costing' }

interface BuildCostRow {
  id: string
  build_id: string
  labor_cost: number
  parts_cost: number
  notes: string | null
  rod_builds: { id: string; name: string; rod_length: number; power: string; action: string } | null
}

export default async function CostingPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()

  const [buildsResult, costsResult, inventoryResult] = await Promise.all([
    supabase
      .from('rod_builds')
      .select('id, name, rod_length, power, action')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('build_costs')
      .select('*, rod_builds(id, name, rod_length, power, action)')
      .eq('user_id', user.id),
    supabase
      .from('inventory_items')
      .select('unit_cost, quantity')
      .eq('user_id', user.id),
  ])

  const builds = (buildsResult.data ?? []) as Pick<RodBuild, 'id' | 'name' | 'rod_length' | 'power' | 'action'>[]
  const costs = (costsResult.data ?? []) as BuildCostRow[]
  const inventory = (inventoryResult.data ?? []) as Array<{ unit_cost: number; quantity: number }>

  const inventoryValue = inventory.reduce((sum, i) => sum + i.unit_cost * i.quantity, 0)
  const totalLabor = costs.reduce((sum, c) => sum + c.labor_cost, 0)
  const totalParts = costs.reduce((sum, c) => sum + c.parts_cost, 0)
  const totalAllBuilds = totalLabor + totalParts

  // Map cost data by build id for quick lookup
  const costByBuildId = new Map(costs.map((c) => [c.build_id, c]))

  return (
    <div className="space-y-8">
      <PageHeader
        title="Costing"
        description="Estimate costs per build and understand your inventory investment."
      />

      {/* Summary */}
      {builds.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryTile label="Total Parts Tracked" value={formatCurrency(totalParts)} />
          <SummaryTile label="Total Labor Tracked" value={formatCurrency(totalLabor)} />
          <SummaryTile label="Inventory On Hand" value={formatCurrency(inventoryValue)} accent />
        </div>
      )}

      {builds.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-6 w-6" />}
          title="No builds to cost yet"
          description="Create a rod build first, then come here to track parts and labor costs."
          action={
            <Link href="/rod-builder">
              <Button iconLeft={<Plus />}>Create a build</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {builds.map((build) => {
            const cost = costByBuildId.get(build.id)
            const total = cost ? cost.labor_cost + cost.parts_cost : 0
            return (
              <Card key={build.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{build.name}</CardTitle>
                      <CardDescription>
                        {formatRodLength(build.rod_length)} · {titleCase(build.power)} · {titleCase(build.action)}
                      </CardDescription>
                    </div>
                    {total > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-500 mb-0.5">Total estimate</p>
                        <p className="font-mono font-semibold text-amber-500">{formatCurrency(total)}</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <Divider />
                <CardContent className="pt-5">
                  <BuildCostForm
                    buildId={build.id}
                    buildName={build.name}
                    initialLabor={cost?.labor_cost}
                    initialParts={cost?.parts_cost}
                    initialNotes={cost?.notes ?? ''}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SummaryTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`mt-1.5 text-xl font-semibold font-mono ${accent ? 'text-amber-500' : 'text-slate-50'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
