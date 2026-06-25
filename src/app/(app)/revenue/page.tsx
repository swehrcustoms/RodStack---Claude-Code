import type { Metadata } from 'next'
import { TrendingUp } from 'lucide-react'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Revenue — SW Custom Rods' }

export default async function RevenuePage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()
  const now = new Date()
  const yearStart = `${now.getFullYear()}-01-01`
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const [invoicesRes, buildsRes] = await Promise.all([
    supabase
      .from('invoices')
      .select(`id, invoice_number, amount, status, due_date, paid_at, created_at, customers(name), rod_builds(name)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('rod_builds')
      .select('id, name, sale_price, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  interface InvoiceRow {
    id: string; invoice_number: string; amount: number; status: string
    due_date: string | null; paid_at: string | null; created_at: string
    customers: { name: string } | null; rod_builds: { name: string } | null
  }
  interface BuildRow { id: string; name: string; sale_price: number | null; status: string; created_at: string }
  const invoices = (invoicesRes.data ?? []) as InvoiceRow[]
  const builds = (buildsRes.data ?? []) as BuildRow[]

  const paid = invoices.filter(i => i.status === 'paid')
  const pending = invoices.filter(i => i.status === 'sent' || i.status === 'draft')

  const totalRevenue = paid.reduce((s, i) => s + i.amount, 0)
  const pendingRevenue = pending.reduce((s, i) => s + i.amount, 0)
  const ytdRevenue = paid.filter(i => i.paid_at && i.paid_at >= yearStart).reduce((s, i) => s + i.amount, 0)
  const mtdRevenue = paid.filter(i => i.paid_at && i.paid_at.startsWith(monthStart.slice(0, 7))).reduce((s, i) => s + i.amount, 0)
  const avgInvoice = paid.length > 0 ? totalRevenue / paid.length : 0

  // Monthly breakdown for this year
  const monthlyData: Record<string, number> = {}
  for (let m = 0; m < 12; m++) {
    const key = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`
    monthlyData[key] = 0
  }
  for (const inv of paid) {
    if (!inv.paid_at) continue
    const key = inv.paid_at.slice(0, 7)
    if (key in monthlyData) monthlyData[key] += inv.amount
  }
  const monthlyList = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    amount,
  }))
  const maxMonthly = Math.max(...monthlyList.map(m => m.amount), 1)

  // Pipeline value from builds
  const pipelineValue = builds
    .filter(b => b.status !== 'done')
    .reduce((s, b) => s + (b.sale_price ?? 0), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-0.5 w-8 rounded" style={{ background: '#B8942A' }} />
            <h1 className="text-2xl font-bold tracking-wider"
                style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
              Revenue
            </h1>
          </div>
          <p className="text-sm ml-11" style={{ color: 'rgba(196,186,168,0.5)' }}>
            {paid.length} paid invoices · {pending.length} pending
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-4 py-2"
             style={{ background: 'rgba(111,196,111,0.1)', border: '1px solid rgba(111,196,111,0.2)' }}>
          <TrendingUp className="h-4 w-4" style={{ color: '#6FC46F' }} />
          <span className="text-sm font-bold" style={{ color: '#6FC46F' }}>{formatCurrency(totalRevenue)} total collected</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue MTD',    value: formatCurrency(mtdRevenue),    color: '#6FC46F' },
          { label: 'Revenue YTD',    value: formatCurrency(ytdRevenue),    color: '#B8942A' },
          { label: 'Pending',        value: formatCurrency(pendingRevenue), color: '#7AADDE' },
          { label: 'Pipeline Value', value: formatCurrency(pipelineValue), color: '#C4BAA8' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-5" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)', position: 'relative', overflow: 'hidden' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(196,186,168,0.5)', letterSpacing: '0.2em' }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="rounded-lg p-5" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
        <h2 className="text-xs font-bold tracking-widest uppercase mb-5" style={{ color: 'rgba(196,186,168,0.5)', letterSpacing: '0.18em' }}>
          Monthly Revenue — {now.getFullYear()}
        </h2>
        <div className="flex items-end gap-2 h-32">
          {monthlyList.map(({ label, amount }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <p className="text-[9px] font-bold" style={{ color: amount > 0 ? '#B8942A' : 'transparent' }}>
                {amount > 0 ? `$${Math.round(amount / 100) * 100 >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount.toFixed(0)}` : ''}
              </p>
              <div className="w-full rounded-t transition-all" style={{
                background: amount > 0 ? 'rgba(184,148,42,0.4)' : 'rgba(232,223,208,0.04)',
                height: `${Math.max(4, (amount / maxMonthly) * 100)}%`,
                border: amount > 0 ? '1px solid rgba(184,148,42,0.3)' : '1px solid rgba(232,223,208,0.06)',
              }} />
              <p className="text-[9px]" style={{ color: 'rgba(196,186,168,0.4)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent paid invoices */}
      {paid.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-0.5 w-6" style={{ background: '#B8942A' }} />
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(232,223,208,0.7)', letterSpacing: '0.2em' }}>
              Payment History
            </h2>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
            <div
              className="hidden md:grid px-5 py-2.5 text-[10px] font-bold tracking-wider uppercase"
              style={{
                gridTemplateColumns: '1fr 2fr 1fr 1fr',
                background: 'rgba(232,223,208,0.03)',
                borderBottom: '1px solid rgba(232,223,208,0.08)',
                color: 'rgba(196,186,168,0.4)',
                letterSpacing: '0.18em',
              }}
            >
              <span>Invoice #</span>
              <span>Customer</span>
              <span>Paid On</span>
              <span className="text-right">Amount</span>
            </div>
            {paid.slice(0, 20).map((inv, i) => {
              const customer = (inv.customers as { name: string } | null)?.name
              return (
                <div
                  key={inv.id}
                  className="grid items-center px-5 py-3.5"
                  style={{
                    gridTemplateColumns: '1fr 2fr 1fr 1fr',
                    borderBottom: i < Math.min(paid.length, 20) - 1 ? '1px solid rgba(232,223,208,0.06)' : 'none',
                  }}
                >
                  <p className="text-xs font-bold" style={{ color: '#B8942A' }}>{inv.invoice_number}</p>
                  <p className="text-sm" style={{ color: '#E8DFD0' }}>{customer ?? '—'}</p>
                  <p className="text-xs" style={{ color: 'rgba(196,186,168,0.55)' }}>
                    {inv.paid_at ? formatDate(inv.paid_at) : '—'}
                  </p>
                  <p className="text-sm font-bold text-right" style={{ color: '#6FC46F' }}>{formatCurrency(inv.amount)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Average stats */}
      {paid.length > 0 && (
        <div className="rounded-lg p-5" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
          <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'rgba(196,186,168,0.5)', letterSpacing: '0.18em' }}>Averages</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(196,186,168,0.35)', letterSpacing: '0.15em' }}>Avg Invoice Value</p>
              <p className="text-xl font-bold" style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif" }}>{formatCurrency(avgInvoice)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(196,186,168,0.35)', letterSpacing: '0.15em' }}>Avg Monthly (YTD)</p>
              <p className="text-xl font-bold" style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif" }}>
                {formatCurrency(ytdRevenue / Math.max(1, now.getMonth() + 1))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
