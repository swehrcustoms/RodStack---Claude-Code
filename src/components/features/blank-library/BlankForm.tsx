'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { saveBlank, type BlankFormData } from '@/lib/actions/blanks'

interface Blank {
  id: string
  manufacturer: string
  model: string
  length_ft: number | null
  power: string | null
  action: string | null
  material: string | null
  line_rating: string | null
  lure_rating: string | null
  cost: number | null
  supplier: string | null
  notes: string | null
  in_stock: boolean
  quantity: number
}

interface BlankFormProps {
  mode: 'add' | 'edit'
  blank?: Blank
  children: ReactNode
}

const POWERS = ['Ultra Light', 'Light', 'Medium Light', 'Medium', 'Medium Heavy', 'Heavy', 'Extra Heavy']
const ACTIONS = ['Extra Fast', 'Fast', 'Moderate Fast', 'Moderate', 'Slow']
const MATERIALS = ['Graphite', 'Fiberglass', 'Carbon Fiber', 'Composite', 'E-Glass']

const labelStyle = { color: 'rgba(196,186,168,0.6)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const }
const selectStyle = {
  background: '#0C0B09',
  color: '#E8DFD0',
  border: '1px solid rgba(232,223,208,0.15)',
  borderRadius: '0.375rem',
  padding: '0.4rem 0.75rem',
  fontSize: '0.875rem',
  width: '100%',
  outline: 'none',
}

export function BlankForm({ mode, blank, children }: BlankFormProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const form: BlankFormData = {
      manufacturer: fd.get('manufacturer') as string,
      model: fd.get('model') as string,
      length_ft: fd.get('length_ft') as string,
      power: fd.get('power') as string,
      action: fd.get('action') as string,
      material: fd.get('material') as string,
      line_rating: fd.get('line_rating') as string,
      lure_rating: fd.get('lure_rating') as string,
      cost: fd.get('cost') as string,
      supplier: fd.get('supplier') as string,
      notes: fd.get('notes') as string,
      in_stock: fd.get('in_stock') as string,
      quantity: fd.get('quantity') as string,
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveBlank(form, blank?.id)
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(12,11,9,0.85)' }}
            onClick={() => !isPending && setOpen(false)}
          />
          <div
            className="relative w-full max-w-lg rounded-lg p-6 space-y-4 my-8"
            style={{ background: '#1a1813', border: '1px solid rgba(232,223,208,0.15)' }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="font-bold tracking-widest uppercase"
                style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', fontSize: '1.1rem' }}
              >
                {mode === 'add' ? 'Add Blank' : 'Edit Blank'}
              </h2>
              <button type="button" onClick={() => !isPending && setOpen(false)} style={{ color: 'rgba(196,186,168,0.5)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Manufacturer" name="manufacturer" defaultValue={blank?.manufacturer ?? ''} required placeholder="e.g. St. Croix" />
                <Input label="Model" name="model" defaultValue={blank?.model ?? ''} required placeholder="e.g. SCGC70MHF" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Length (ft)" name="length_ft" type="number" step="0.5" defaultValue={blank?.length_ft?.toString() ?? ''} placeholder="7.0" />
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>Power</label>
                  <select name="power" defaultValue={blank?.power ?? ''} style={selectStyle}>
                    <option value="">—</option>
                    {POWERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>Action</label>
                  <select name="action" defaultValue={blank?.action ?? ''} style={selectStyle}>
                    <option value="">—</option>
                    {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>Material</label>
                  <select name="material" defaultValue={blank?.material ?? ''} style={selectStyle}>
                    <option value="">—</option>
                    {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <Input label="Supplier" name="supplier" defaultValue={blank?.supplier ?? ''} placeholder="Mudhole, Jann's..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Line Rating" name="line_rating" defaultValue={blank?.line_rating ?? ''} placeholder="6-12 lb" />
                <Input label="Lure Rating" name="lure_rating" defaultValue={blank?.lure_rating ?? ''} placeholder="1/4-3/4 oz" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Cost ($)" name="cost" type="number" step="0.01" defaultValue={blank?.cost?.toString() ?? ''} placeholder="0.00" />
                <Input label="Quantity" name="quantity" type="number" min="0" defaultValue={(blank?.quantity ?? 0).toString()} />
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>In Stock</label>
                  <select name="in_stock" defaultValue={blank?.in_stock !== false ? 'true' : 'false'} style={selectStyle}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              <Textarea label="Notes" name="notes" rows={2} defaultValue={blank?.notes ?? ''} placeholder="Any additional notes…" />
              {error && <p className="text-sm" style={{ color: '#E06060' }}>{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" size="sm" loading={isPending}>
                  {mode === 'add' ? 'Add Blank' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
