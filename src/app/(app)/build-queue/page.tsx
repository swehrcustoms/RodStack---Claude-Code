import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { StatusSelect } from '@/components/features/build-queue/StatusSelect'
import { formatDate } from '@/lib/format'

interface BuildRow {
  id: string
  name: string
  rod_length: number
  power: string
  action: string
  status: string
  priority: string
  due_date: string | null
  sale_price: number | null
  blank_manufacturer: string | null
  blank_model: string | null
  customers: { name: string } | null
}

export const metadata: Metadata = { title: 'Build Queue — SW Custom Rods' }

export default async function BuildQueuePage() {
  const user = await getCurrentUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]
  const supabase = createServerClient()

  const { data: builds } = await supabase
    .from('rod_builds')
    .select('id, name, rod_length, power, action, status, priority, due_date, sale_price, blank_manufacturer, blank_model, customers(name)')
    .eq('user_id', user.id)
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const allBuilds = (builds ?? []) as BuildRow[]
  const active = allBuilds.filter(b => b.status !== 'done')
  const done   = allBuilds.filter(b => b.status === 'done')

  const stats = {
    total:    allBuilds.length,
    active:   active.length,
    rush:     active.filter(b => b.priority === 'rush').length,
    vip:      active.filter(b => b.priority === 'vip').length,
    overdue:  active.filter(b => b.due_date && b.due_date < today).length,
    revenue:  allBuilds.reduce((s, b) => s + (b.sale_price ?? 0), 0),
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-0.5 w-8 rounded" style={{ background: '#B8942A' }} />
            <h1 className="text-2xl font-bold tracking-wider" style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
              Build Queue
            </h1>
          </div>
          <p className="text-sm ml-11" style={{ color: 'rgba(196,186,168,0.5)' }}>
            {stats.active} active · {stats.rush} rush · {stats.vip} VIP · ${stats.revenue.toLocaleString()} total value
          </p>
        </div>
        <Link href="/build-queue/new">
          <Button iconLeft={<Plus className="h-4 w-4" />}>New Build Order</Button>
        </Link>
      </div>

      {/* Stats strip */}
      {stats.overdue > 0 && (
        <div className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm"
             style={{ background: 'rgba(224,96,96,0.1)', border: '1px solid rgba(224,96,96,0.3)', color: '#E06060' }}>
          ⚠ {stats.overdue} build{stats.overdue > 1 ? 's' : ''} past due — check due dates below
        </div>
      )}

      {/* Active builds */}
      <BuildSection title="Active Builds" builds={active} today={today} />

      {/* Completed */}
      {done.length > 0 && (
        <BuildSection title="Completed" builds={done} today={today} dimmed />
      )}
    </div>
  )
}

function BuildSection({
  title,
  builds,
  today,
  dimmed,
}: {
  title: string
  builds: Array<{
    id: string
    name: string
    rod_length: number
    power: string
    action: string
    status: string
    priority: string
    due_date: string | null
    sale_price: number | null
    blank_manufacturer: string | null
    blank_model: string | null
    customers: { name: string } | null
  }>
  today: string
  dimmed?: boolean
}) {
  if (builds.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-0.5 w-6" style={{ background: dimmed ? 'rgba(196,186,168,0.2)' : '#B8942A' }} />
        <h2 className="text-xs font-bold tracking-widest uppercase"
            style={{ color: dimmed ? 'rgba(196,186,168,0.4)' : 'rgba(232,223,208,0.7)', letterSpacing: '0.2em' }}>
          {title} <span style={{ color: 'rgba(196,186,168,0.35)' }}>({builds.length})</span>
        </h2>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)', opacity: dimmed ? 0.65 : 1 }}>
        {/* Table header */}
        <div
          className="hidden md:grid px-5 py-2.5 text-[10px] font-bold tracking-wider uppercase"
          style={{
            gridTemplateColumns: '28px 2fr 1fr 1fr 220px 90px',
            background: 'rgba(232,223,208,0.03)',
            borderBottom: '1px solid rgba(232,223,208,0.08)',
            color: 'rgba(196,186,168,0.4)',
            letterSpacing: '0.18em',
          }}
        >
          <span>#</span>
          <span>Rod / Customer</span>
          <span>Blank</span>
          <span>Due Date</span>
          <span>Status / Priority</span>
          <span className="text-right">Value</span>
        </div>

        {builds.map((build, i) => {
          const isOverdue = build.due_date && build.due_date < today && build.status !== 'done'
          const customer = (build.customers as { name: string } | null)?.name

          return (
            <div
              key={build.id}
              className="grid items-center px-5 py-4 transition-colors"
              style={{
                gridTemplateColumns: '28px 2fr 1fr 1fr 220px 90px',
                borderBottom: i < builds.length - 1 ? '1px solid rgba(232,223,208,0.06)' : 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,223,208,0.02)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {/* Row number */}
              <span className="text-sm" style={{ color: 'rgba(196,186,168,0.25)', fontFamily: "'Bebas Neue', sans-serif" }}>
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Rod info */}
              <div>
                <Link href={`/builds/${build.id}`}
                      className="text-sm font-semibold hover:underline"
                      style={{ color: '#E8DFD0' }}>
                  {build.name}
                </Link>
                {customer && (
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(196,186,168,0.5)' }}>
                    {customer}
                  </p>
                )}
              </div>

              {/* Blank */}
              <p className="text-xs" style={{ color: 'rgba(196,186,168,0.55)' }}>
                {build.blank_manufacturer
                  ? `${build.blank_manufacturer}${build.blank_model ? ' ' + build.blank_model : ''}`
                  : '—'}
              </p>

              {/* Due date */}
              <p className="text-xs" style={{ color: isOverdue ? '#E06060' : 'rgba(196,186,168,0.55)' }}>
                {build.due_date ? formatDate(build.due_date) : '—'}
                {isOverdue && ' ⚠'}
              </p>

              {/* Status / priority — inline interactive */}
              <StatusSelect
                buildId={build.id}
                currentStatus={build.status}
                currentPriority={build.priority}
              />

              {/* Value */}
              <p className="text-sm font-bold text-right" style={{ color: '#E8DFD0' }}>
                {build.sale_price ? `$${build.sale_price.toLocaleString()}` : '—'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
