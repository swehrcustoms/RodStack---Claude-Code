import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, Plus, Phone, Mail, ArrowRight } from 'lucide-react'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CustomerForm } from '@/components/features/customers/CustomerForm'
import { deleteCustomer } from '@/lib/actions/customers'

export const metadata: Metadata = { title: 'Customers — SW Custom Rods' }

export default async function CustomersPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()
  const { data: customers } = await supabase
    .from('customers')
    .select(`
      id, name, email, phone, notes, created_at,
      rod_builds(count)
    `)
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  interface CustomerListItem {
    id: string
    name: string
    email: string | null
    phone: string | null
    notes: string | null
    created_at: string
    rod_builds: Array<{ count: number }>
  }
  const list = (customers ?? []) as CustomerListItem[]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-0.5 w-8 rounded" style={{ background: '#B8942A' }} />
            <h1 className="text-2xl font-bold tracking-wider"
                style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
              Customers
            </h1>
          </div>
          <p className="text-sm ml-11" style={{ color: 'rgba(196,186,168,0.5)' }}>
            {list.length} customer{list.length !== 1 ? 's' : ''} in your book
          </p>
        </div>
        <CustomerForm mode="add">
          <Button iconLeft={<Plus className="h-4 w-4" />}>Add Customer</Button>
        </CustomerForm>
      </div>

      {/* Customer list */}
      {list.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No customers yet"
          description="Add your first customer to start tracking builds and invoices by client."
          action={
            <CustomerForm mode="add">
              <Button iconLeft={<Plus className="h-4 w-4" />}>Add Customer</Button>
            </CustomerForm>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const buildCount = c.rod_builds?.[0]?.count ?? 0
            return (
              <div
                key={c.id}
                className="rounded-lg p-5 flex flex-col gap-3 transition-all"
                style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(184,148,42,0.3)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(232,223,208,0.1)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#E8DFD0' }}>{c.name}</p>
                    {c.email && (
                      <a href={`mailto:${c.email}`}
                         className="flex items-center gap-1.5 text-xs mt-1 hover:underline"
                         style={{ color: 'rgba(196,186,168,0.55)' }}>
                        <Mail className="h-3 w-3" />{c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone}`}
                         className="flex items-center gap-1.5 text-xs mt-0.5 hover:underline"
                         style={{ color: 'rgba(196,186,168,0.55)' }}>
                        <Phone className="h-3 w-3" />{c.phone}
                      </a>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold tracking-wide"
                    style={{
                      background: 'rgba(184,148,42,0.15)',
                      color: '#B8942A',
                      border: '1px solid rgba(184,148,42,0.2)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {buildCount} build{buildCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {c.notes && (
                  <p className="text-xs line-clamp-2" style={{ color: 'rgba(196,186,168,0.45)' }}>
                    {c.notes}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-auto pt-2"
                     style={{ borderTop: '1px solid rgba(232,223,208,0.08)' }}>
                  <Link href={`/customers/${c.id}`}
                        className="flex items-center gap-1.5 text-xs font-semibold tracking-wide transition-colors"
                        style={{ color: '#B8942A', letterSpacing: '0.06em' }}>
                    View history <ArrowRight className="h-3 w-3" />
                  </Link>
                  <div className="ml-auto flex items-center gap-2">
                    <CustomerForm mode="edit" customer={c}>
                      <button className="text-xs px-2 py-1 rounded transition-colors"
                              style={{ color: 'rgba(196,186,168,0.5)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#E8DFD0'; e.currentTarget.style.background = 'rgba(232,223,208,0.06)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(196,186,168,0.5)'; e.currentTarget.style.background = 'transparent' }}>
                        Edit
                      </button>
                    </CustomerForm>
                    <form action={deleteCustomer.bind(null, c.id)}>
                      <button type="submit"
                              className="text-xs px-2 py-1 rounded transition-colors"
                              style={{ color: 'rgba(224,96,96,0.5)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#E06060' }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(224,96,96,0.5)' }}>
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
