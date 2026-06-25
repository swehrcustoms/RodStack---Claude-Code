import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ListOrdered, TrendingUp, Clock, Users,
  Plus, ArrowRight, AlertTriangle, Star, FileText,
} from 'lucide-react'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Dashboard — SW Custom Rods' }

const STATUS_LABEL: Record<string, string> = {
  intake: 'Intake', blank_prep: 'Blank Prep',
  wrapping: 'Wrapping', finishing: 'Finishing', done: 'Done',
}
const STATUS_VARIANT: Record<string, 'default' | 'warning' | 'accent' | 'error' | 'success' | 'muted'> = {
  intake: 'muted', blank_prep: 'default', wrapping: 'warning', finishing: 'error', done: 'success',
}
const PRIORITY_VARIANT: Record<string, 'default' | 'warning' | 'error' | 'muted'> = {
  standard: 'muted', rush: 'error', vip: 'warning',
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()
  const today = new Date().toISOString().split('T')[0]

  const [buildsRes, inventoryRes, invoicesRes, timeRes] = await Promise.all([
    supabase
      .from('rod_builds')
      .select('id, name, rod_length, power, action, status, priority, due_date, sale_price, customers(name)')
      .eq('user_id', user.id)
      .neq('status', 'done')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(6),
    supabase
      .from('inventory_items')
      .select('quantity, unit_cost')
      .eq('user_id', user.id),
    supabase
      .from('invoices')
      .select('amount, status')
      .eq('user_id', user.id),
    supabase
      .from('time_entries')
      .select('hours')
      .eq('user_id', user.id)
      .gte('entry_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
  ])

  interface ActiveBuild {
    id: string; name: string; rod_length: number; power: string; action: string
    status: string; priority: string; due_date: string | null; sale_price: number | null
    customers: { name: string } | null
  }
  const activeBuilds    = (buildsRes.data ?? []) as ActiveBuild[]
  const inventory       = (inventoryRes.data ?? []) as Array<{ quantity: number; unit_cost: number }>
  const invoices        = (invoicesRes.data ?? []) as Array<{ amount: number; status: string }>
  const timeEntries     = (timeRes.data ?? []) as Array<{ hours: number }>

  const totalActive     = activeBuilds.length
  const rushCount       = activeBuilds.filter(b => b.priority === 'rush').length
  const overdueCount    = activeBuilds.filter(b => b.due_date && b.due_date < today).length
  const revenueMTD      = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const pendingRevenue  = invoices.filter(i => i.status === 'sent' || i.status === 'draft').reduce((s, i) => s + i.amount, 0)
  const hoursThisMonth  = timeEntries.reduce((s, t) => s + t.hours, 0)
  const inventoryValue  = inventory.reduce((s, i) => s + i.unit_cost * i.quantity, 0)

  return (
    <div className="space-y-8">
      {/* Owner access banner */}
      <div
        className="flex items-start gap-4 rounded-lg px-5 py-4"
        style={{
          background: 'linear-gradient(135deg, rgba(184,148,42,0.15), rgba(184,148,42,0.05))',
          border: '1px solid rgba(184,148,42,0.4)',
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: '#B8942A' }}
        >
          <Star className="h-4 w-4" style={{ color: '#0C0B09' }} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide" style={{ color: '#B8942A' }}>
            Owner Access — Full Permissions
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(184,148,42,0.7)' }}>
            All modules unlocked · Build queue · Pricing · Customer data · Financial reports · User management · System settings
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <Link href="/build-queue/new">
            <Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />}>New Build Order</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Builds"    value={totalActive}           sub={rushCount > 0 ? `${rushCount} RUSH` : 'in queue'} href="/build-queue"    color="#B8942A" />
        <StatCard label="Revenue MTD"      value={`$${revenueMTD.toLocaleString()}`}  sub={`$${pendingRevenue.toLocaleString()} pending`}      href="/revenue"        color="#6FC46F" />
        <StatCard label="Hours This Month" value={`${hoursThisMonth.toFixed(1)}h`}   sub="time tracked"                                          href="/time-tracking"  color="#7AADDE" />
        <StatCard label="Inventory Value"  value={`$${inventoryValue.toLocaleString('en',{maximumFractionDigits:0})}`} sub="in components"      href="/components"     color="#C4BAA8" />
      </div>

      {/* Alerts */}
      {(overdueCount > 0 || rushCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
                 style={{ background: 'rgba(224,96,96,0.1)', border: '1px solid rgba(224,96,96,0.3)', color: '#E06060' }}>
              <AlertTriangle className="h-4 w-4" />
              {overdueCount} overdue build{overdueCount > 1 ? 's' : ''} — action required
            </div>
          )}
          {rushCount > 0 && (
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
                 style={{ background: 'rgba(224,96,96,0.08)', border: '1px solid rgba(224,96,96,0.2)', color: '#E06060' }}>
              RUSH: {rushCount} rod{rushCount > 1 ? 's' : ''} need priority attention
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{ color: 'rgba(196,186,168,0.5)', letterSpacing: '0.2em' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Build Order',   href: '/build-queue/new',   icon: Plus       },
            { label: 'Generate Invoice',  href: '/invoicing',         icon: FileText   },
            { label: 'Price Estimator',   href: '/costing',           icon: TrendingUp },
            { label: 'Add Customer',      href: '/customers',         icon: Users      },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}>
              <div
                className="flex flex-col items-center gap-2 rounded-lg px-3 py-4 text-center cursor-pointer transition-all"
                style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = 'rgba(184,148,42,0.4)'
                  el.style.background = 'rgba(184,148,42,0.05)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = 'rgba(232,223,208,0.1)'
                  el.style.background = '#100F0C'
                }}
              >
                <Icon className="h-6 w-6" style={{ color: 'rgba(232,223,208,0.5)' }} />
                <span className="text-xs font-bold tracking-wider uppercase"
                      style={{ color: '#C4BAA8', letterSpacing: '0.08em' }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Active build queue preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-8 rounded" style={{ background: '#B8942A' }} />
            <h2 className="font-bold tracking-wider uppercase text-sm"
                style={{ color: '#E8DFD0', letterSpacing: '0.1em' }}>
              Active Build Queue
            </h2>
          </div>
          <Link href="/build-queue"
                className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase transition-colors"
                style={{ color: '#B8942A', letterSpacing: '0.1em' }}>
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activeBuilds.length === 0 ? (
          <div className="rounded-lg py-10 text-center"
               style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
            <ListOrdered className="mx-auto h-8 w-8 mb-3" style={{ color: 'rgba(196,186,168,0.3)' }} />
            <p className="text-sm" style={{ color: 'rgba(196,186,168,0.5)' }}>No active builds. Start your first build order.</p>
            <Link href="/build-queue/new" className="mt-4 inline-block">
              <Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />}>New Build Order</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
            {/* Table header */}
            <div className="grid px-5 py-2.5 text-[10px] font-bold tracking-wider uppercase"
                 style={{
                   gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                   background: 'rgba(232,223,208,0.03)',
                   borderBottom: '1px solid rgba(232,223,208,0.1)',
                   color: 'rgba(196,186,168,0.45)',
                   letterSpacing: '0.18em',
                 }}>
              <span>Rod / Customer</span>
              <span>Due Date</span>
              <span>Status</span>
              <span>Priority</span>
              <span className="text-right">Value</span>
            </div>
            {activeBuilds.map((build, i) => {
              const isOverdue = build.due_date && build.due_date < today
              const customer = (build.customers as { name: string } | null)?.name
              return (
                <Link key={build.id} href={`/build-queue`}>
                  <div
                    className="grid items-center px-5 py-3.5 transition-colors cursor-pointer"
                    style={{
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                      borderBottom: i < activeBuilds.length - 1 ? '1px solid rgba(232,223,208,0.07)' : 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,223,208,0.025)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#E8DFD0' }}>{build.name}</p>
                      {customer && <p className="text-xs mt-0.5" style={{ color: 'rgba(196,186,168,0.5)' }}>{customer}</p>}
                    </div>
                    <p className="text-xs" style={{ color: isOverdue ? '#E06060' : 'rgba(196,186,168,0.6)' }}>
                      {build.due_date ? formatDate(build.due_date) : '—'}
                      {isOverdue && ' ⚠'}
                    </p>
                    <Badge variant={STATUS_VARIANT[build.status] ?? 'muted'}>
                      {STATUS_LABEL[build.status] ?? build.status}
                    </Badge>
                    <Badge variant={PRIORITY_VARIANT[build.priority] ?? 'muted'}>
                      {build.priority?.toUpperCase()}
                    </Badge>
                    <p className="text-sm font-bold text-right" style={{ color: '#E8DFD0' }}>
                      {build.sale_price ? `$${build.sale_price.toLocaleString()}` : '—'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label, value, sub, href, color,
}: { label: string; value: string | number; sub: string; href: string; color: string }) {
  return (
    <Link href={href}>
      <div
        className="rounded-lg p-5 cursor-pointer transition-all h-full"
        style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)', position: 'relative', overflow: 'hidden' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(184,148,42,0.3)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(232,223,208,0.1)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t"
             style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
        <p className="text-[10px] font-bold tracking-widest uppercase mb-2"
           style={{ color: 'rgba(196,186,168,0.5)', letterSpacing: '0.2em' }}>{label}</p>
        <p className="text-3xl font-bold leading-none mb-1"
           style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>
          {value}
        </p>
        <p className="text-xs" style={{ color: 'rgba(196,186,168,0.45)' }}>{sub}</p>
      </div>
    </Link>
  )
}
