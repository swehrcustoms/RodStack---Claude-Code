'use client'

import { useTransition } from 'react'
import { updateBuildStatus, updateBuildPriority } from '@/lib/actions/build-queue'

const STATUSES = [
  { value: 'intake',     label: 'Intake',     color: '#999' },
  { value: 'blank_prep', label: 'Blank Prep', color: '#7AADDE' },
  { value: 'wrapping',   label: 'Wrapping',   color: '#B8942A' },
  { value: 'finishing',  label: 'Finishing',  color: '#E06060' },
  { value: 'done',       label: 'Done',       color: '#6FC46F' },
]

const PRIORITIES = [
  { value: 'standard', label: 'Standard' },
  { value: 'rush',     label: 'RUSH'     },
  { value: 'vip',      label: 'VIP'      },
]

interface StatusSelectProps {
  buildId: string
  currentStatus: string
  currentPriority: string
}

export function StatusSelect({ buildId, currentStatus, currentPriority }: StatusSelectProps) {
  const [statusPending, startStatus] = useTransition()
  const [priorityPending, startPriority] = useTransition()

  const statusInfo = STATUSES.find(s => s.value === currentStatus)
  const isPending = statusPending || priorityPending

  return (
    <div className="flex items-center gap-2">
      {/* Status badge/select */}
      <select
        value={currentStatus}
        disabled={isPending}
        onChange={(e) => startStatus(() => updateBuildStatus(buildId, e.target.value))}
        className="text-[10px] font-bold tracking-wider uppercase rounded px-2 py-1 border-0 outline-none cursor-pointer transition-opacity"
        style={{
          background: `${statusInfo?.color}22`,
          color: statusInfo?.color ?? '#999',
          border: `1px solid ${statusInfo?.color}44`,
          opacity: isPending ? 0.5 : 1,
          letterSpacing: '0.1em',
        }}
        aria-label="Build status"
      >
        {STATUSES.map(s => (
          <option key={s.value} value={s.value}
                  style={{ background: '#1a1813', color: '#E8DFD0' }}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Priority badge/select */}
      <select
        value={currentPriority}
        disabled={isPending}
        onChange={(e) => startPriority(() => updateBuildPriority(buildId, e.target.value))}
        className="text-[10px] font-bold tracking-wider uppercase rounded px-2 py-1 border-0 outline-none cursor-pointer"
        style={{
          background: currentPriority === 'rush' ? 'rgba(139,26,26,0.3)' : currentPriority === 'vip' ? 'rgba(184,148,42,0.2)' : 'rgba(140,140,140,0.1)',
          color: currentPriority === 'rush' ? '#E06060' : currentPriority === 'vip' ? '#B8942A' : 'rgba(196,186,168,0.5)',
          border: currentPriority === 'rush' ? '1px solid rgba(139,26,26,0.4)' : currentPriority === 'vip' ? '1px solid rgba(184,148,42,0.3)' : '1px solid transparent',
          opacity: isPending ? 0.5 : 1,
          letterSpacing: '0.1em',
        }}
        aria-label="Build priority"
      >
        {PRIORITIES.map(p => (
          <option key={p.value} value={p.value}
                  style={{ background: '#1a1813', color: '#E8DFD0' }}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  )
}
