import type { Metadata } from 'next'
import { Plus, FileText } from 'lucide-react'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { InvoiceForm } from '@/components/features/invoicing/InvoiceForm'
import { updateInvoiceStatus, deleteInvoice } from '@/lib/actions/invoices'
import { getCustomers } from '@/lib/actions/customers'
import { formatDate, formatCurrency } from '@/lib/format'

export const metadata: Metadata = { title: 'Invoicing — SW Custom Rods' }

const STATUS_COLOR: Record<string, string> = {
  draft: 'rgba(196,186,168,0.5)',
  sent: '#7AADDE',
  paid: '#6FC46F',
  overdue: '#E06060',
}
const STATUS_BG: Record<string, string> = {
  draft: 'rgba(196,186,168,0.08)',
  sent: 'rgba(122,173,222,0.12)',
  paid: 'rgba(111,196,111,0.12)',
  overdue: 'rgba(224,96,96,0.12)',
}

export default async function InvoicingPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()
  const [customersRaw, buildsRes, invoicesRes] = await Promise.all([
    getCustomers(),
    supabase
      .from('rod_builds')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select(`id, invoice_number, amount, status, due_date, paid_at, notes, customer_id, build_id, created_at, customers(name), rod_builds(name)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  interface InvoiceRow {
    id: string; invoice_number: string; amount: number; status: string
    due_date: string | null; paid_at: string | null; notes: string | null
    customer_id: string | null; build_id: string | null; created_at: string
    customers: { name: string } | null; rod_builds: { name: string } | null
  }
  const customers = customersRaw.map(c => ({ id: c.id, name: c.name }))
  const builds = (buildsRes.data as Array<{ id: string; name: string }> ?? []).map(b => ({ id: b.id, name: b.name }))
  const invoices = (invoicesRes.data ?? []) as InvoiceRow[]

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'sent' || i.status === 'draft').reduce((s, i) => s + i.amount, 0)
  const overdueCount = invoices.filter(i => i.status === 'sent' && i.due_date && i.due_date < new Date().toISOString().split('T')[0]).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-0.5 w-8 rounded" style={{ background: '#B8942A' }} />
            <h1 className="text-2xl font-bold tracking-wider"
                style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
              Invoicing
            </h1>
          </div>
          <p className="text-sm ml-11" style={{ color: 'rgba(196,186,168,0.5)' }}>
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} · {formatCurrency(totalPaid)} collected · {formatCurrency(totalPending)} pending
          </p>
        </div>
        <InvoiceForm mode="add" customers={customers} builds={builds}>
          <Button iconLeft={<Plus className="h-4 w-4" />}>Create Invoice</Button>
        </InvoiceForm>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Collected', value: formatCurrency(totalPaid), color: '#6FC46F' },
          { label: 'Pending', value: formatCurrency(totalPending), color: '#7AADDE' },
          { label: 'Overdue', value: overdueCount, color: overdueCount > 0 ? '#E06060' : 'rgba(196,186,168,0.3)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-4" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(196,186,168,0.45)', letterSpacing: '0.18em' }}>
              {label}
            </p>
            <p className="text-2xl font-bold" style={{ color, fontFamily: "'Bebas Neue', sans-serif" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No invoices yet"
          description="Create your first invoice to start tracking payments."
          action={
            <InvoiceForm mode="add" customers={customers} builds={builds}>
              <Button iconLeft={<Plus className="h-4 w-4" />}>Create Invoice</Button>
            </InvoiceForm>
          }
        />
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
          {/* Table header */}
          <div
            className="hidden md:grid px-5 py-2.5 text-[10px] font-bold tracking-wider uppercase"
            style={{
              gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr auto',
              background: 'rgba(232,223,208,0.03)',
              borderBottom: '1px solid rgba(232,223,208,0.08)',
              color: 'rgba(196,186,168,0.4)',
              letterSpacing: '0.18em',
            }}
          >
            <span>Invoice #</span>
            <span>Customer / Build</span>
            <span>Amount</span>
            <span>Due Date</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {invoices.map((inv, i) => {
            const customer = (inv.customers as { name: string } | null)?.name
            const build = (inv.rod_builds as { name: string } | null)?.name
            const statusColor = STATUS_COLOR[inv.status] ?? STATUS_COLOR.draft
            const statusBg = STATUS_BG[inv.status] ?? STATUS_BG.draft
            const isOverdue = inv.status === 'sent' && inv.due_date && inv.due_date < new Date().toISOString().split('T')[0]

            return (
              <div
                key={inv.id}
                className="grid items-center px-5 py-4 gap-2"
                style={{
                  gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr auto',
                  borderBottom: i < invoices.length - 1 ? '1px solid rgba(232,223,208,0.06)' : 'none',
                }}
              >
                <p className="text-xs font-bold" style={{ color: '#B8942A' }}>
                  {inv.invoice_number}
                </p>
                <div>
                  {customer && <p className="text-sm font-semibold" style={{ color: '#E8DFD0' }}>{customer}</p>}
                  {build && <p className="text-xs mt-0.5" style={{ color: 'rgba(196,186,168,0.5)' }}>{build}</p>}
                  {!customer && !build && <p className="text-sm" style={{ color: 'rgba(196,186,168,0.4)' }}>—</p>}
                </div>
                <p className="text-sm font-bold" style={{ color: '#E8DFD0' }}>{formatCurrency(inv.amount)}</p>
                <p className="text-xs" style={{ color: isOverdue ? '#E06060' : 'rgba(196,186,168,0.55)' }}>
                  {inv.due_date ? formatDate(inv.due_date) : '—'}
                  {isOverdue && ' ⚠'}
                </p>
                <span
                  className="inline-flex text-[10px] font-bold tracking-wider uppercase rounded px-2 py-0.5 w-fit"
                  style={{ background: statusBg, color: statusColor, border: `1px solid ${statusColor}44`, letterSpacing: '0.1em' }}
                >
                  {inv.status}
                </span>
                <div className="flex items-center gap-1">
                  {inv.status === 'draft' && (
                    <form action={updateInvoiceStatus.bind(null, inv.id, 'sent')}>
                      <button type="submit" className="text-[10px] px-2 py-1 rounded font-semibold tracking-wide" style={{ color: '#7AADDE', background: 'rgba(122,173,222,0.1)' }}>
                        Send
                      </button>
                    </form>
                  )}
                  {inv.status === 'sent' && (
                    <form action={updateInvoiceStatus.bind(null, inv.id, 'paid')}>
                      <button type="submit" className="text-[10px] px-2 py-1 rounded font-semibold tracking-wide" style={{ color: '#6FC46F', background: 'rgba(111,196,111,0.1)' }}>
                        Mark Paid
                      </button>
                    </form>
                  )}
                  <InvoiceForm
                    mode="edit"
                    invoice={{ id: inv.id, customer_id: inv.customer_id, build_id: inv.build_id, amount: inv.amount, due_date: inv.due_date, notes: inv.notes }}
                    customers={customers}
                    builds={builds}
                  >
                    <button className="text-[10px] px-2 py-1 rounded" style={{ color: 'rgba(196,186,168,0.5)' }}>Edit</button>
                  </InvoiceForm>
                  <form action={deleteInvoice.bind(null, inv.id)}>
                    <button type="submit" className="text-[10px] px-2 py-1 rounded" style={{ color: 'rgba(224,96,96,0.5)' }}>
                      Del
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
