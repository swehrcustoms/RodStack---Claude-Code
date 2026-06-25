'use client'

import { useState, useTransition } from 'react'
import { DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { saveBuildCost } from '@/lib/actions/costing'

interface BuildCostFormProps {
  buildId: string
  buildName: string
  initialLabor?: number
  initialParts?: number
  initialNotes?: string
}

export function BuildCostForm({
  buildId,
  buildName,
  initialLabor = 0,
  initialParts = 0,
  initialNotes = '',
}: BuildCostFormProps) {
  const [laborCost, setLaborCost] = useState(String(initialLabor || ''))
  const [partsCost, setPartsCost] = useState(String(initialParts || ''))
  const [notes, setNotes] = useState(initialNotes)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const labor = parseFloat(laborCost) || 0
  const parts = parseFloat(partsCost) || 0
  const total = labor + parts

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const result = await saveBuildCost(buildId, labor, parts, notes)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Parts Cost ($)"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={partsCost}
          onChange={(e) => setPartsCost(e.target.value)}
          prefix={<span className="text-xs">$</span>}
        />
        <Input
          label="Labor Cost ($)"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={laborCost}
          onChange={(e) => setLaborCost(e.target.value)}
          prefix={<span className="text-xs">$</span>}
          hint="Your time + skill rate"
        />
      </div>

      {/* Running total */}
      {total > 0 && (
        <div className="flex items-center justify-between rounded-md bg-slate-700/30 border border-slate-700 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <DollarSign className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Total estimate
          </div>
          <span className="font-mono font-semibold text-amber-500">
            ${total.toFixed(2)}
          </span>
        </div>
      )}

      <Textarea
        label="Notes"
        placeholder="Pricing notes, material sources, etc."
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-green-400">Cost saved.</p>}

      <Button onClick={handleSave} loading={isPending} size="sm">
        Save cost estimate
      </Button>
    </div>
  )
}
