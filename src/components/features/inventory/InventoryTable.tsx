'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, titleCase } from '@/lib/format'
import { deleteInventoryItem } from '@/lib/actions/inventory'
import type { InventoryItem } from '@/types/inventory'

interface InventoryTableProps {
  items: InventoryItem[]
}

const categoryColorMap: Record<string, 'default' | 'accent' | 'success' | 'warning' | 'muted'> = {
  blank: 'accent',
  guides: 'success',
  'reel-seat': 'warning',
  handle: 'default',
  thread: 'muted',
  finish: 'muted',
  hardware: 'default',
  other: 'muted',
}

export function InventoryTable({ items }: InventoryTableProps) {
  if (items.length === 0) return null

  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800/80">
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Brand</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Unit Cost</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Value</th>
            <th className="px-4 py-3 w-10" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {items.map((item) => (
            <InventoryRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InventoryRow({ item }: { item: InventoryItem }) {
  const [isPending, startTransition] = useTransition()
  const totalValue = item.unit_cost * item.quantity

  function handleDelete() {
    startTransition(async () => {
      await deleteInventoryItem(item.id)
    })
  }

  return (
    <tr className="bg-slate-800/30 hover:bg-slate-800/60 transition-colors group" style={{ opacity: isPending ? 0.5 : 1 }}>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-200">{item.name}</p>
          {item.notes && (
            <p className="text-xs text-slate-600 mt-0.5 truncate max-w-[200px]">{item.notes}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <Badge variant={categoryColorMap[item.category] ?? 'default'}>
          {titleCase(item.category)}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">
        {item.brand ?? '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-sm text-slate-300">{item.quantity}</span>
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm text-slate-400 hidden sm:table-cell">
        {formatCurrency(item.unit_cost)}
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm text-amber-500">
        {formatCurrency(totalValue)}
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1 rounded"
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </td>
    </tr>
  )
}
