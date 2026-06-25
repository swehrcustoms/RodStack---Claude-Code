'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { saveInvoice, type InvoiceFormData } from '@/lib/actions/invoices'

interface Customer { id: string; name: string }
interface Build { id: string; name: string }

interface Invoice {
  id: string
  customer_id: string | null
  build_id: string | null
  amount: number
  due_date: string | null
  notes: string | null
}

interface InvoiceFormProps {
  mode: 'add' | 'edit'
  invoice?: Invoice
  customers: Customer[]
  builds: Build[]
  children: ReactNode
}

export function InvoiceForm({ mode, invoice, customers, builds, children }: InvoiceFormProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const form: InvoiceFormData = {
      customer_id: fd.get('customer_id') as string,
      build_id: fd.get('build_id') as string,
      amount: fd.get('amount') as string,
      due_date: fd.get('due_date') as string,
      notes: fd.get('notes') as string,
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveInvoice(form, invoice?.id)
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

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

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(12,11,9,0.85)' }}
            onClick={() => !isPending && setOpen(false)}
          />
          <div
            className="relative w-full max-w-md rounded-lg p-6 space-y-5"
            style={{ background: '#1a1813', border: '1px solid rgba(232,223,208,0.15)' }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="font-bold tracking-widest uppercase"
                style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', fontSize: '1.1rem' }}
              >
                {mode === 'add' ? 'Create Invoice' : 'Edit Invoice'}
              </h2>
              <button
                type="button"
                onClick={() => !isPending && setOpen(false)}
                style={{ color: 'rgba(196,186,168,0.5)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>Customer</label>
                <select name="customer_id" defaultValue={invoice?.customer_id ?? ''} style={selectStyle}>
                  <option value="">— No customer —</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>Linked Build</label>
                <select name="build_id" defaultValue={invoice?.build_id ?? ''} style={selectStyle}>
                  <option value="">— No build —</option>
                  {builds.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Amount ($)"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={invoice?.amount?.toString() ?? ''}
                required
                placeholder="0.00"
              />
              <Input
                label="Due Date"
                name="due_date"
                type="date"
                defaultValue={invoice?.due_date ?? ''}
              />
              <Textarea
                label="Notes"
                name="notes"
                rows={2}
                defaultValue={invoice?.notes ?? ''}
                placeholder="Invoice notes…"
              />
              {error && (
                <p className="text-sm" style={{ color: '#E06060' }}>{error}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={isPending}>
                  {mode === 'add' ? 'Create Invoice' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
