import type { Metadata } from 'next'
import { Archive } from 'lucide-react'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent } from '@/components/ui/Card'
import { AddItemForm } from '@/components/features/inventory/AddItemForm'
import { InventoryTable } from '@/components/features/inventory/InventoryTable'
import { formatCurrency, titleCase } from '@/lib/format'
import type { InventoryItem } from '@/types/inventory'

export const metadata: Metadata = { title: 'Inventory' }

export default async function InventoryPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()
  const { data } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', user.id)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  const items = (data ?? []) as InventoryItem[]
  const totalValue = items.reduce((sum, i) => sum + i.unit_cost * i.quantity, 0)
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory"
        description="Track your components, hardware, and supplies."
        actions={<AddItemForm />}
      />

      {/* Summary stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryTile label="Total Items" value={String(items.length)} />
          <SummaryTile label="Total Units" value={String(totalUnits)} />
          <SummaryTile label="Total Value" value={formatCurrency(totalValue)} accent />
        </div>
      )}

      {/* Inventory table */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Archive className="h-6 w-6" />}
          title="No inventory yet"
          description="Add blanks, guides, thread, reel seats, and other components to track what you have on hand and what it costs."
          action={<AddItemForm />}
        />
      ) : (
        <InventoryTable items={items} />
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
