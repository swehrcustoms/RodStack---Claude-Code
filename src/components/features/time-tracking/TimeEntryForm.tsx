'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { saveTimeEntry, type TimeEntryFormData } from '@/lib/actions/time-entries'

interface Build { id: string; name: string }

interface TimeEntryFormProps {
  builds: Build[]
  defaultBuildId?: string
  children: ReactNode
}

const ACTIVITIES = [
  'Blank prep & sanding',
  'Guide placement & spacing',
  'Thread wrapping',
  'Epoxy finishing',
  'Handle assembly',
  'Reel seat installation',
  'Final inspection',
  'Other',
]

export function TimeEntryForm({ builds, defaultBuildId, children }: TimeEntryFormProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const form: TimeEntryFormData = {
      build_id: fd.get('build_id') as string,
      hours: fd.get('hours') as string,
      activity: fd.get('activity') as string,
      entry_date: fd.get('entry_date') as string,
      notes: fd.get('notes') as string,
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveTimeEntry(form)
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
                Log Time
              </h2>
              <button type="button" onClick={() => !isPending && setOpen(false)} style={{ color: 'rgba(196,186,168,0.5)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>Build</label>
                <select name="build_id" defaultValue={defaultBuildId ?? ''} required style={selectStyle}>
                  <option value="">— Select build —</option>
                  {builds.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>Activity</label>
                <select name="activity" required style={selectStyle}>
                  {ACTIVITIES.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Hours"
                  name="hours"
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  defaultValue="1"
                  required
                />
                <Input
                  label="Date"
                  name="entry_date"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
              <Textarea
                label="Notes"
                name="notes"
                rows={2}
                placeholder="Optional notes…"
              />
              {error && <p className="text-sm" style={{ color: '#E06060' }}>{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={isPending}>Log Time</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
