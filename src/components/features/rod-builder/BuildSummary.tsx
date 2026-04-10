import { Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { cn } from '@/lib/cn'
import type { RodFormData, DerivedRodValues } from '@/types/rod'

interface BuildSummaryProps {
  form: RodFormData
  derived: DerivedRodValues
}

export function BuildSummary({ form, derived }: BuildSummaryProps) {
  const isEmpty = !form.name && !form.rod_length && !form.power && !form.action

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Build Summary</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {isEmpty ? (
          <div className="flex items-start gap-2.5 rounded-md bg-slate-700/30 border border-slate-700 px-3 py-3">
            <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-slate-500">
              Fill in rod details to see a live summary here.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 leading-relaxed">{derived.buildSummary}</p>
        )}

        <Divider />

        {/* Derived metrics */}
        <div className="space-y-3">
          <MetricRow label="Length" value={derived.lengthDisplay} />
          <MetricRow label="Power" value={derived.powerLabel} />
          <MetricRow label="Action" value={derived.actionLabel} />
          <MetricRow
            label="Est. Guide Count"
            value={derived.guideCount !== null ? String(derived.guideCount) : '—'}
            highlight={derived.guideCount !== null}
          />
          {form.line_rating && <MetricRow label="Line Rating" value={form.line_rating} />}
          {form.lure_rating && <MetricRow label="Lure Rating" value={form.lure_rating} />}
        </div>

        {derived.guideCount !== null && (
          <>
            <Divider />
            <div className="rounded-md bg-amber-500/5 border border-amber-500/10 px-3 py-2.5">
              <p className="text-xs text-amber-500/80 font-medium mb-0.5">Estimation note</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Guide count is estimated using{' '}
                <span className="font-mono text-slate-400">length ÷ 5.5</span>. Actual count
                depends on your specific build design.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span
        className={cn(
          'text-sm font-medium font-mono truncate text-right',
          highlight ? 'text-amber-500' : value === '—' ? 'text-slate-600' : 'text-slate-300'
        )}
      >
        {value}
      </span>
    </div>
  )
}
