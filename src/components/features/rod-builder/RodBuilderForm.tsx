'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BuildSummary } from './BuildSummary'
import { POWER_OPTIONS, ACTION_OPTIONS, BLANK_MATERIAL_OPTIONS } from '@/lib/rod/constants'
import { derivedRodValues } from '@/lib/rod/calculations'
import { validateRodSpec } from '@/lib/rod/validation'
import { saveRodBuild } from '@/lib/actions/rod-builds'
import type { RodFormData } from '@/types/rod'

const EMPTY_FORM: RodFormData = {
  name: '',
  rod_length: '',
  power: '',
  action: '',
  line_rating: '',
  lure_rating: '',
  blank_material: '',
  guide_notes: '',
  build_notes: '',
}

interface RodBuilderFormProps {
  initialData?: Partial<RodFormData>
  buildId?: string
}

export function RodBuilderForm({ initialData, buildId }: RodBuilderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<RodFormData>({ ...EMPTY_FORM, ...initialData })
  const [errors, setErrors] = useState<Partial<Record<keyof RodFormData, string>>>({})
  const [saveError, setSaveError] = useState<string | null>(null)

  const derived = derivedRodValues(form)

  function set(field: keyof RodFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleReset() {
    setForm({ ...EMPTY_FORM })
    setErrors({})
    setSaveError(null)
  }

  function handleSave() {
    const validation = validateRodSpec(form)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setSaveError(null)

    startTransition(async () => {
      const result = await saveRodBuild(form, buildId)
      if (result.error) {
        setSaveError(result.error)
      } else {
        router.push('/builds')
        router.refresh()
      }
    })
  }

  const isEditing = Boolean(buildId)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      {/* Form panels */}
      <div className="space-y-6 min-w-0">
        {/* Identity */}
        <Card>
          <CardHeader>
            <CardTitle>Build Identity</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <Input
              label="Build Name"
              placeholder="e.g. 7ft Medium Bass Caster"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              error={errors.name}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Rod Length (ft)"
                type="number"
                inputMode="decimal"
                placeholder="7.0"
                step="0.5"
                min="1"
                max="20"
                value={form.rod_length}
                onChange={(e) => set('rod_length', e.target.value)}
                error={errors.rod_length}
                required
              />
              <Select
                label="Blank Material"
                placeholder="Select material"
                options={BLANK_MATERIAL_OPTIONS}
                value={form.blank_material}
                onChange={(e) => set('blank_material', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rod Specs */}
        <Card>
          <CardHeader>
            <CardTitle>Rod Specifications</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Power"
                placeholder="Select power"
                options={POWER_OPTIONS}
                value={form.power}
                onChange={(e) => set('power', e.target.value)}
                error={errors.power}
                required
              />
              <Select
                label="Action"
                placeholder="Select action"
                options={ACTION_OPTIONS}
                value={form.action}
                onChange={(e) => set('action', e.target.value)}
                error={errors.action}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Line Rating"
                placeholder="e.g. 8–17 lb"
                value={form.line_rating}
                onChange={(e) => set('line_rating', e.target.value)}
                hint="Optional"
              />
              <Input
                label="Lure Rating"
                placeholder="e.g. ¼–¾ oz"
                value={form.lure_rating}
                onChange={(e) => set('lure_rating', e.target.value)}
                hint="Optional"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Build Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <Textarea
              label="Guide Train Notes"
              placeholder="Guide sizes, spacing, brand preferences, tip-top details..."
              rows={3}
              value={form.guide_notes}
              onChange={(e) => set('guide_notes', e.target.value)}
            />
            <Textarea
              label="Build Notes"
              placeholder="Thread colors, finish coats, customer name, inspiration, special details..."
              rows={4}
              value={form.build_notes}
              onChange={(e) => set('build_notes', e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Error */}
        {saveError && (
          <div className="rounded-md border border-red-900 bg-red-950/40 px-4 py-3">
            <p className="text-sm text-red-400">{saveError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={isPending} size="lg" iconLeft={<Save />}>
            {isEditing ? 'Save changes' : 'Save build'}
          </Button>
          {!isEditing && (
            <Button
              variant="ghost"
              size="lg"
              onClick={handleReset}
              iconLeft={<RotateCcw />}
              disabled={isPending}
            >
              Reset
            </Button>
          )}
          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Live summary sidebar */}
      <div className="hidden lg:block">
        <BuildSummary form={form} derived={derived} />
      </div>
    </div>
  )
}
