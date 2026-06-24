'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { saveCustomer, type CustomerFormData } from '@/lib/actions/customers'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address?: string | null
  notes: string | null
}

interface CustomerFormProps {
  mode: 'add' | 'edit'
  customer?: Customer
  children: ReactNode
}

export function CustomerForm({ mode, customer, children }: CustomerFormProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const form: CustomerFormData = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      phone: fd.get('phone') as string,
      address: fd.get('address') as string,
      notes: fd.get('notes') as string,
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveCustomer(form, customer?.id)
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
                {mode === 'add' ? 'Add Customer' : 'Edit Customer'}
              </h2>
              <button
                type="button"
                onClick={() => !isPending && setOpen(false)}
                className="rounded p-1"
                style={{ color: 'rgba(196,186,168,0.5)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                name="name"
                defaultValue={customer?.name ?? ''}
                required
                placeholder="Full name"
              />
              <Input
                label="Email"
                name="email"
                type="email"
                defaultValue={customer?.email ?? ''}
                placeholder="customer@email.com"
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                defaultValue={customer?.phone ?? ''}
                placeholder="(555) 000-0000"
              />
              <Input
                label="Address"
                name="address"
                defaultValue={customer?.address ?? ''}
                placeholder="Street, City, State"
              />
              <Textarea
                label="Notes"
                name="notes"
                rows={3}
                defaultValue={customer?.notes ?? ''}
                placeholder="Any notes about this customer…"
              />
              {error && (
                <p className="text-sm" style={{ color: '#E06060' }}>{error}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={isPending}>
                  {mode === 'add' ? 'Add Customer' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
