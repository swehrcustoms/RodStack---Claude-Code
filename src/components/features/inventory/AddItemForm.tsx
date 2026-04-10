'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { INVENTORY_CATEGORY_OPTIONS } from '@/lib/rod/constants'
import { saveInventoryItem } from '@/lib/actions/inventory'
import type { InventoryFormData } from '@/types/inventory'

const EMPTY: InventoryFormData = {
  name: '',
  category: '',
  brand: '',
  quantity: '1',
  unit_cost: '',
  notes: '',
}

interface AddItemFormProps {
  onSuccess?: () => void
}

export function AddItemForm({ onSuccess }: AddItemFormProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<InventoryFormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof InventoryFormData, string>>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function set(field: keyof InventoryFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    if (!form.category) e.category = 'Category is required.'
    const qty = parseInt(form.quantity, 10)
    if (isNaN(qty) || qty < 0) e.quantity = 'Enter a valid quantity.'
    const cost = parseFloat(form.unit_cost)
    if (form.unit_cost && (isNaN(cost) || cost < 0)) e.unit_cost = 'Enter a valid cost.'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setSaveError(null)

    startTransition(async () => {
      const result = await saveInventoryItem(form)
      if (result.error) {
        setSaveError(result.error)
      } else {
        setForm(EMPTY)
        setErrors({})
        setOpen(false)
        onSuccess?.()
      }
    })
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} iconLeft={<Plus />}>
        Add item
      </Button>
    )
  }

  return (
    <Card className="border-slate-600">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Add Inventory Item</CardTitle>
          <button
            onClick={() => { setOpen(false); setForm(EMPTY); setErrors({}) }}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Item Name"
            placeholder="e.g. Fuji BSVLG guide set"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
            required
          />
          <Input
            label="Brand"
            placeholder="e.g. Fuji, Pacific Bay"
            value={form.brand}
            onChange={(e) => set('brand', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Category"
            placeholder="Select category"
            options={INVENTORY_CATEGORY_OPTIONS}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            error={errors.category}
            required
          />
          <Input
            label="Quantity"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="1"
            value={form.quantity}
            onChange={(e) => set('quantity', e.target.value)}
            error={errors.quantity}
          />
          <Input
            label="Unit Cost ($)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.unit_cost}
            onChange={(e) => set('unit_cost', e.target.value)}
            error={errors.unit_cost}
            prefix={<span className="text-xs">$</span>}
          />
        </div>

        <Textarea
          label="Notes"
          placeholder="Size, color, spec details..."
          rows={2}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />

        {saveError && (
          <p className="text-sm text-red-400">{saveError}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} loading={isPending}>
            Add to inventory
          </Button>
          <Button
            variant="ghost"
            onClick={() => { setOpen(false); setForm(EMPTY); setErrors({}) }}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
