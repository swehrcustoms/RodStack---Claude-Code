import type { Metadata } from 'next'
import { Archive } from 'lucide-react'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddItemForm } from '@/components/features/inventory/AddItemForm'
import { InventoryTable } from '@/components/features/inventory/InventoryTable'
import { formatCurrency, titleCase } from '@/lib/format'
import type { InventoryItem } from '@/types/inventory'

export const metadata: Metadata = { title: 'Components — SW Custom Rods' }

export default async function ComponentsPage() {
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
  const lowStockCount = items.filter(i => i.quantity <= 2).length

  // Group by category
  const categories = Array.from(new Set(items.map(i => i.category))).sort()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-0.5 w-8 rounded" style={{ background: '#B8942A' }} />
            <h1 className="text-2xl font-bold tracking-wider"
                style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
              Components
            </h1>
          </div>
          <p className="text-sm ml-11" style={{ color: 'rgba(196,186,168,0.5)' }}>
            {items.length} item{items.length !== 1 ? 's' : ''} · {totalUnits} units · {formatCurrency(totalValue)} value
            {lowStockCount > 0 && <span style={{ color: '#E06060' }}> · {lowStockCount} low stock</span>}
          </p>
        </div>
        <AddItemForm />
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm"
             style={{ background: 'rgba(224,96,96,0.1)', border: '1px solid rgba(224,96,96,0.3)', color: '#E06060' }}>
          ⚠ {lowStockCount} item{lowStockCount > 1 ? 's' : ''} with 2 or fewer units remaining — reorder soon
        </div>
      )}

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Items',       value: String(items.length),     color: '#C4BAA8' },
            { label: 'Total Units',       value: String(totalUnits),       color: '#7AADDE' },
            { label: 'Inventory Value',   value: formatCurrency(totalValue), color: '#B8942A' },
            { label: 'Categories',        value: String(categories.length), color: 'rgba(196,186,168,0.5)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg p-4" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)', position: 'relative', overflow: 'hidden' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(196,186,168,0.45)', letterSpacing: '0.18em' }}>{label}</p>
              <p className="text-2xl font-bold" style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Archive className="h-6 w-6" />}
          title="No components yet"
          description="Add guides, thread, reel seats, handles, and supplies to track your inventory and costs."
          action={<AddItemForm />}
        />
      ) : (
        <InventoryTable items={items} />
      )}
    </div>
  )
}
