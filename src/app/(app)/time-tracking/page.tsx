import type { Metadata } from 'next'
import { Plus, Clock } from 'lucide-react'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TimeEntryForm } from '@/components/features/time-tracking/TimeEntryForm'
import { deleteTimeEntry } from '@/lib/actions/time-entries'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Time Tracking — SW Custom Rods' }

export default async function TimeTrackingPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const [entriesRes, buildsRes] = await Promise.all([
    supabase
      .from('time_entries')
      .select(`id, hours, activity, entry_date, notes, build_id, rod_builds(name)`)
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false }),
    supabase
      .from('rod_builds')
      .select('id, name')
      .eq('user_id', user.id)
      .neq('status', 'done')
      .order('created_at', { ascending: false }),
  ])

  interface TimeEntry {
    id: string; hours: number; activity: string; entry_date: string
    notes: string | null; build_id: string | null
    rod_builds: { name: string } | null
  }
  const entries = (entriesRes.data ?? []) as TimeEntry[]
  const builds = (buildsRes.data as Array<{ id: string; name: string }> ?? []).map(b => ({ id: b.id, name: b.name }))

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)
  const monthHours = entries
    .filter(e => e.entry_date >= monthStart)
    .reduce((s, e) => s + e.hours, 0)

  // Group by build for summary
  const buildSummary: Record<string, { name: string; hours: number }> = {}
  for (const entry of entries) {
    const buildName = (entry.rod_builds as { name: string } | null)?.name ?? 'Unassigned'
    const key = entry.build_id ?? 'unassigned'
    if (!buildSummary[key]) buildSummary[key] = { name: buildName, hours: 0 }
    buildSummary[key].hours += entry.hours
  }
  const buildSummaryList = Object.values(buildSummary).sort((a, b) => b.hours - a.hours).slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-0.5 w-8 rounded" style={{ background: '#B8942A' }} />
            <h1 className="text-2xl font-bold tracking-wider"
                style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
              Time Tracking
            </h1>
          </div>
          <p className="text-sm ml-11" style={{ color: 'rgba(196,186,168,0.5)' }}>
            {totalHours.toFixed(1)}h total · {monthHours.toFixed(1)}h this month
          </p>
        </div>
        <TimeEntryForm builds={builds}>
          <Button iconLeft={<Plus className="h-4 w-4" />}>Log Time</Button>
        </TimeEntryForm>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-4" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(196,186,168,0.45)', letterSpacing: '0.18em' }}>Hours This Month</p>
          <p className="text-3xl font-bold" style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif" }}>{monthHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(196,186,168,0.45)', letterSpacing: '0.18em' }}>Total Hours Logged</p>
          <p className="text-3xl font-bold" style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif" }}>{totalHours.toFixed(1)}h</p>
        </div>
      </div>

      {/* Build time summary */}
      {buildSummaryList.length > 0 && (
        <div className="rounded-lg p-5" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
          <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'rgba(196,186,168,0.5)', letterSpacing: '0.18em' }}>
            Hours by Build
          </h2>
          <div className="space-y-3">
            {buildSummaryList.map(({ name, hours }) => (
              <div key={name} className="flex items-center gap-3">
                <p className="text-sm w-40 truncate" style={{ color: '#E8DFD0' }}>{name}</p>
                <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(232,223,208,0.08)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: '#B8942A',
                      width: `${Math.min(100, (hours / Math.max(...buildSummaryList.map(b => b.hours))) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-sm font-bold w-12 text-right" style={{ color: '#B8942A' }}>{hours.toFixed(1)}h</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entry log */}
      {entries.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-6 w-6" />}
          title="No time logged yet"
          description="Start tracking time on your rod builds to understand your hourly efficiency."
          action={
            <TimeEntryForm builds={builds}>
              <Button iconLeft={<Plus className="h-4 w-4" />}>Log Time</Button>
            </TimeEntryForm>
          }
        />
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-0.5 w-6" style={{ background: '#B8942A' }} />
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(232,223,208,0.7)', letterSpacing: '0.2em' }}>
              Entry Log
            </h2>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
            {entries.map((entry, i) => {
              const buildName = (entry.rod_builds as { name: string } | null)?.name
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                  style={{ borderBottom: i < entries.length - 1 ? '1px solid rgba(232,223,208,0.06)' : 'none' }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-8 w-8 rounded flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: 'rgba(184,148,42,0.1)', color: '#B8942A', fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      {entry.hours}h
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#E8DFD0' }}>{entry.activity}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(196,186,168,0.5)' }}>
                        {buildName ?? 'No build'} · {formatDate(entry.entry_date)}
                      </p>
                      {entry.notes && (
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(196,186,168,0.35)' }}>{entry.notes}</p>
                      )}
                    </div>
                  </div>
                  <form action={deleteTimeEntry.bind(null, entry.id)}>
                    <button type="submit" className="text-xs px-2 py-1 rounded" style={{ color: 'rgba(224,96,96,0.45)' }}>
                      Delete
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
