import { useState, useCallback } from 'react'
import { Save, AlertTriangle, CheckCircle, Info, ChevronRight } from 'lucide-react'
import { TopNav } from '@/components/layout/TopNav'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import {
  createEmptyBuild,
  calculateWeightBreakdown,
  calculateCostBreakdown,
  validateBuild,
  formatCents,
  formatLengthInches,
  calculateGuideSpacing,
} from '@/lib/rodCalculations'
import type { RodBuild, RodType, RodBlank, GuideSet } from '@/types/rod'

/* ============================================================
   Mock catalogue data
   ============================================================ */

const MOCK_BLANKS: RodBlank[] = [
  {
    id: 'b1', manufacturer: 'Batson', model: 'PC764MHF',
    lengthIn: 91, sections: 1, type: 'casting',
    power: 'medium-heavy', action: 'fast',
    lineWeight: '12-20lb', lureWeight: '3/8-1oz',
    tipDiameterMm: 1.6, buttDiameterMm: 15.2, weightG: 98,
    color: 'Midnight Blue', priceCents: 8995,
  },
  {
    id: 'b2', manufacturer: 'MHX', model: 'MB844C',
    lengthIn: 84, sections: 1, type: 'casting',
    power: 'medium', action: 'moderate-fast',
    lineWeight: '8-15lb', lureWeight: '1/4-3/4oz',
    tipDiameterMm: 1.4, buttDiameterMm: 13.8, weightG: 85,
    color: 'Smoke', priceCents: 7499,
  },
  {
    id: 'b3', manufacturer: 'Rainshadow', model: 'RXSC86MHF',
    lengthIn: 103, sections: 2, type: 'spinning',
    power: 'medium-heavy', action: 'fast',
    lineWeight: '10-17lb', lureWeight: '3/8-1.5oz',
    tipDiameterMm: 1.8, buttDiameterMm: 16.5, weightG: 112,
    color: 'Graphite', priceCents: 11200,
  },
]

const MOCK_GUIDE_SETS: GuideSet[] = [
  {
    id: 'g1', manufacturer: 'Fuji', model: 'BKOG — K-Series',
    frameMaterial: 'Stainless', insertMaterial: 'Alconite',
    count: 9, ringSizes: [8, 7, 6, 6, 5, 5, 4, 4, 4],
    type: 'single-foot', finish: 'Gunsmoke', priceCents: 4200,
  },
  {
    id: 'g2', manufacturer: 'Fuji', model: 'BNLG — N-Series',
    frameMaterial: 'Stainless', insertMaterial: 'SiC',
    count: 8, ringSizes: [10, 8, 7, 6, 5, 5, 4, 4],
    type: 'single-foot', finish: 'Black', priceCents: 5800,
  },
  {
    id: 'g3', manufacturer: 'American Tackle', model: 'MicroWave Spinning',
    frameMaterial: 'Titanium', insertMaterial: 'Zirconia',
    count: 10, ringSizes: [16, 12, 10, 8, 7, 6, 6, 5, 5, 4],
    type: 'double-foot', finish: 'Polished', priceCents: 6500,
  },
]

/* ============================================================
   Section step config
   ============================================================ */

type StepId = 'basics' | 'blank' | 'guides' | 'handle' | 'finish' | 'review'

interface Step {
  id: StepId
  label: string
  description: string
}

const STEPS: Step[] = [
  { id: 'basics',  label: 'Basics',      description: 'Name & rod type' },
  { id: 'blank',   label: 'Blank',       description: 'Select your blank' },
  { id: 'guides',  label: 'Guides',      description: 'Guide set & layout' },
  { id: 'handle',  label: 'Handle & Seat', description: 'Grip & reel seat' },
  { id: 'finish',  label: 'Wrap & Finish', description: 'Thread & epoxy' },
  { id: 'review',  label: 'Review',      description: 'Validate & save' },
]

const ROD_TYPE_OPTIONS = [
  { value: 'casting',  label: 'Casting' },
  { value: 'spinning', label: 'Spinning' },
  { value: 'fly',      label: 'Fly' },
  { value: 'surf',     label: 'Surf' },
  { value: 'trolling', label: 'Trolling' },
  { value: 'ice',      label: 'Ice' },
]

/* ============================================================
   Component
   ============================================================ */

export default function RodBuilder() {
  const [build, setBuild] = useState<RodBuild>(() => createEmptyBuild('user-1'))
  const [currentStep, setCurrentStep] = useState<StepId>('basics')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const updateBuild = useCallback((patch: Partial<RodBuild>) => {
    setBuild((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }))
    setSaved(false)
  }, [])

  const stepIndex    = STEPS.findIndex((s) => s.id === currentStep)
  const isFirstStep  = stepIndex === 0
  const isLastStep   = stepIndex === STEPS.length - 1
  const nextStep     = () => !isLastStep && setCurrentStep(STEPS[stepIndex + 1].id)
  const prevStep     = () => !isFirstStep && setCurrentStep(STEPS[stepIndex - 1].id)

  const weight   = calculateWeightBreakdown(build)
  const cost     = calculateCostBreakdown(build)
  const validation = validateBuild(build)

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopNav
        title="Rod Builder"
        actions={
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-success-dark">
                <CheckCircle className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              loading={saving}
              iconLeft={<Save className="h-3.5 w-3.5" />}
            >
              Save draft
            </Button>
            <Button size="sm" disabled={!validation.valid}>
              Mark complete
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Step sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border-subtle bg-surface-base p-4 gap-1">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2 px-2">
            Build steps
          </p>
          {STEPS.map((step, i) => {
            const isActive   = step.id === currentStep
            const isComplete = i < stepIndex
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  'flex items-start gap-3 px-3 py-2.5 rounded-lg text-left interactive',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'hover:bg-surface-sunken text-text-secondary hover:text-text-primary'
                )}
              >
                <span className={cn(
                  'mt-0.5 h-5 w-5 rounded-full shrink-0 flex items-center justify-center text-xs font-bold',
                  isActive   ? 'bg-brand-600 text-white' :
                  isComplete ? 'bg-success text-white' :
                               'bg-surface-sunken text-text-tertiary border border-border'
                )}>
                  {isComplete ? '✓' : i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium leading-none">{step.label}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">{step.description}</p>
                </div>
              </button>
            )
          })}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="p-6 max-w-3xl mx-auto space-y-6">

              {/* Mobile step indicator */}
              <div className="flex lg:hidden items-center gap-2 text-sm text-text-secondary">
                {STEPS.map((step, i) => (
                  <div key={step.id} className="flex items-center gap-1">
                    <span className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                      step.id === currentStep ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-text-tertiary'
                    )}>
                      {i + 1}
                    </span>
                    {i < STEPS.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-text-tertiary" />
                    )}
                  </div>
                ))}
                <span className="ml-2 font-medium text-text-primary">
                  {STEPS.find((s) => s.id === currentStep)?.label}
                </span>
              </div>

              {/* Step panels */}
              {currentStep === 'basics' && (
                <BasicsStep build={build} onUpdate={updateBuild} />
              )}
              {currentStep === 'blank' && (
                <BlankStep build={build} onUpdate={updateBuild} />
              )}
              {currentStep === 'guides' && (
                <GuidesStep build={build} onUpdate={updateBuild} />
              )}
              {currentStep === 'handle' && (
                <HandleStep />
              )}
              {currentStep === 'finish' && (
                <FinishStep />
              )}
              {currentStep === 'review' && (
                <ReviewStep
                  build={build}
                  weight={weight}
                  cost={cost}
                  validation={validation}
                />
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={isFirstStep}
                >
                  Previous
                </Button>
                {!isLastStep ? (
                  <Button size="sm" onClick={nextStep}>
                    Continue
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={!validation.valid}
                    onClick={handleSave}
                    loading={saving}
                  >
                    Save build
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Summary bar */}
          <div className="shrink-0 border-t border-border-subtle bg-surface-base px-6 py-3 flex items-center gap-6">
            <SummaryBadge label="Total weight" value={weight.totalG > 0 ? `${weight.totalG.toFixed(1)}g` : '—'} />
            <SummaryBadge label="Est. cost"    value={cost.totalCents > 0 ? formatCents(cost.totalCents) : '—'} />
            <SummaryBadge
              label="Status"
              value={build.status.replace('-', ' ')}
              className="capitalize"
            />
            {!validation.valid && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-danger">
                <AlertTriangle className="h-3.5 w-3.5" />
                {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Step sub-components
   ============================================================ */

function BasicsStep({
  build,
  onUpdate,
}: {
  build: RodBuild
  onUpdate: (patch: Partial<RodBuild>) => void
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        step="1"
        title="Rod Basics"
        description="Give your build a name and set the rod type."
      />
      <Card className="space-y-4">
        <Input
          label="Rod name"
          placeholder="e.g. Heavy Bass Cranker"
          value={build.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          required
        />
        <Select
          label="Rod type"
          options={ROD_TYPE_OPTIONS}
          value={build.type}
          onValueChange={(v) => onUpdate({ type: v as RodType })}
        />
        <Input
          label="Notes (optional)"
          placeholder="Intended use, inspiration, special instructions…"
        />
      </Card>
    </div>
  )
}

function BlankStep({
  build,
  onUpdate,
}: {
  build: RodBuild
  onUpdate: (patch: Partial<RodBuild>) => void
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        step="2"
        title="Select Blank"
        description="The blank is the foundation of your build. Filter by length, power, and action."
      />

      {/* Filter row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Select
          label="Rod type"
          options={ROD_TYPE_OPTIONS}
          value={build.type}
          onValueChange={(v) => onUpdate({ type: v as RodType })}
        />
        <Select
          label="Power"
          options={[
            { value: '', label: 'Any' },
            { value: 'light', label: 'Light' },
            { value: 'medium', label: 'Medium' },
            { value: 'medium-heavy', label: 'Medium Heavy' },
            { value: 'heavy', label: 'Heavy' },
          ]}
          placeholder="Any power"
        />
        <Select
          label="Action"
          options={[
            { value: '', label: 'Any' },
            { value: 'fast', label: 'Fast' },
            { value: 'moderate-fast', label: 'Moderate Fast' },
            { value: 'moderate', label: 'Moderate' },
          ]}
          placeholder="Any action"
        />
      </div>

      {/* Blank cards */}
      <div className="space-y-3">
        {MOCK_BLANKS.map((blank) => (
          <button
            key={blank.id}
            onClick={() => onUpdate({ blank })}
            className={cn(
              'w-full text-left rounded-xl border p-4 interactive',
              build.blank?.id === blank.id
                ? 'border-brand-500 bg-brand-50 shadow-sm ring-1 ring-brand-500/20'
                : 'border-border hover:border-border-strong hover:bg-surface-sunken'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {blank.manufacturer} {blank.model}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {formatLengthInches(blank.lengthIn)} · {blank.sections}pc ·{' '}
                  <span className="capitalize">{blank.power}</span> ·{' '}
                  <span className="capitalize">{blank.action}</span>
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  Line: {blank.lineWeight} · Lure: {blank.lureWeight} · Weight: {blank.weightG}g
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-text-primary">{formatCents(blank.priceCents)}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{blank.color}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function GuidesStep({
  build,
  onUpdate,
}: {
  build: RodBuild
  onUpdate: (patch: Partial<RodBuild>) => void
}) {
  const spacings = build.blank && build.guideSet
    ? calculateGuideSpacing(build.blank, build.guideSet.count)
    : []

  const handleGuideSetSelect = (guideSet: GuideSet) => {
    const positions = build.blank
      ? calculateGuideSpacing(build.blank, guideSet.count).map((distanceFromButtIn, guideIndex) => ({
          guideIndex,
          distanceFromButtIn,
        }))
      : []
    onUpdate({ guideSet, guidePositions: positions })
  }

  return (
    <div className="space-y-6">
      <StepHeader
        step="3"
        title="Guide Set"
        description="Select a guide set. Spacing is auto-calculated using the REC method."
      />

      {!build.blank && (
        <InfoBanner message="Select a blank first to enable guide spacing calculations." />
      )}

      <div className="space-y-3">
        {MOCK_GUIDE_SETS.map((gs) => (
          <button
            key={gs.id}
            onClick={() => handleGuideSetSelect(gs)}
            className={cn(
              'w-full text-left rounded-xl border p-4 interactive',
              build.guideSet?.id === gs.id
                ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20'
                : 'border-border hover:border-border-strong hover:bg-surface-sunken'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {gs.manufacturer} {gs.model}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {gs.count} guides · {gs.frameMaterial} frame · {gs.insertMaterial} insert · {gs.type}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  Sizes: {gs.ringSizes.join(', ')} · Finish: {gs.finish}
                </p>
              </div>
              <p className="text-sm font-bold text-text-primary shrink-0">
                {formatCents(gs.priceCents)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Guide spacing preview */}
      {build.guideSet && build.blank && (
        <Card>
          <CardHeader divided>
            <CardTitle>Auto-calculated spacing</CardTitle>
            <CardDescription>
              Based on REC method for {build.blank.manufacturer} {build.blank.model}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
              {spacings.map((dist, i) => (
                <div key={i} className="text-center p-2 rounded-lg bg-surface-sunken">
                  <p className="text-xs text-text-tertiary">Guide {i + 1}</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{dist}"</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function HandleStep() {
  return (
    <div className="space-y-6">
      <StepHeader step="4" title="Handle & Reel Seat" description="Choose grip and reel seat components." />
      <ComingSoon section="Handle & reel seat catalogue" />
    </div>
  )
}

function FinishStep() {
  return (
    <div className="space-y-6">
      <StepHeader step="5" title="Wrap & Finish" description="Thread colors, trim wraps, and epoxy." />
      <ComingSoon section="Thread colour picker & finish selector" />
    </div>
  )
}

function ReviewStep({
  build,
  weight,
  cost,
  validation,
}: {
  build: RodBuild
  weight: ReturnType<typeof calculateWeightBreakdown>
  cost: ReturnType<typeof calculateCostBreakdown>
  validation: ReturnType<typeof validateBuild>
}) {
  return (
    <div className="space-y-6">
      <StepHeader step="6" title="Review Build" description="Validate your configuration before saving." />

      {/* Validation */}
      {validation.errors.length > 0 && (
        <div className="rounded-lg border border-danger bg-danger-light p-4 space-y-1">
          <p className="text-sm font-semibold text-danger-dark flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Errors to fix
          </p>
          {validation.errors.map((e, i) => (
            <p key={i} className="text-sm text-danger-dark pl-6">{e.message}</p>
          ))}
        </div>
      )}
      {validation.warnings.length > 0 && (
        <div className="rounded-lg border border-warning bg-warning-light p-4 space-y-1">
          <p className="text-sm font-semibold text-warning-dark flex items-center gap-2">
            <Info className="h-4 w-4" /> Warnings
          </p>
          {validation.warnings.map((w, i) => (
            <p key={i} className="text-sm text-warning-dark pl-6">{w.message}</p>
          ))}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Weight breakdown
          </p>
          {[
            { label: 'Blank',     value: weight.blankG },
            { label: 'Guide set', value: weight.guideSetG },
            { label: 'Handle',    value: weight.handleG },
            { label: 'Reel seat', value: weight.reelSeatG },
            { label: 'Hardware',  value: weight.hardwareG },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-text-secondary">{label}</span>
              <span className="font-medium text-text-primary">{value.toFixed(1)}g</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold border-t border-border-subtle pt-2">
            <span>Total</span>
            <span>{weight.totalG.toFixed(1)}g</span>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Cost breakdown
          </p>
          {[
            { label: 'Blank',       value: cost.blankCents },
            { label: 'Guide set',   value: cost.guideSetCents },
            { label: 'Handle',      value: cost.handleCents },
            { label: 'Reel seat',   value: cost.reelSeatCents },
            { label: 'Thread',      value: cost.wrapThreadCents },
            { label: 'Finish',      value: cost.finishCents },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-text-secondary">{label}</span>
              <span className="font-medium text-text-primary">{formatCents(value)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold border-t border-border-subtle pt-2">
            <span>Total</span>
            <span>{formatCents(cost.totalCents)}</span>
          </div>
        </Card>
      </div>

      {/* Component summary */}
      <Card>
        <CardHeader divided>
          <CardTitle>Component Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mt-2">
            {[
              { label: 'Rod name', value: build.name || <span className="text-text-tertiary italic">Not set</span> },
              { label: 'Type', value: build.type },
              { label: 'Blank', value: build.blank ? `${build.blank.manufacturer} ${build.blank.model}` : <MissingValue /> },
              { label: 'Guide set', value: build.guideSet ? `${build.guideSet.manufacturer} ${build.guideSet.model}` : <MissingValue /> },
              { label: 'Handle', value: build.handle ? `${build.handle.manufacturer} ${build.handle.model}` : <MissingValue /> },
              { label: 'Reel seat', value: build.reelSeat ? `${build.reelSeat.manufacturer} ${build.reelSeat.model}` : <MissingValue /> },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4 py-1.5 border-b border-border-subtle last:border-0 text-sm">
                <span className="text-text-secondary shrink-0">{label}</span>
                <span className="font-medium text-text-primary text-right capitalize">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ============================================================
   Shared micro-components
   ============================================================ */

function StepHeader({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
        {step}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  )
}

function SummaryBadge({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className={cn('text-sm font-semibold text-text-primary', className)}>{value}</p>
    </div>
  )
}

function InfoBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-info bg-info-light px-4 py-3 text-sm text-info-dark">
      <Info className="h-4 w-4 shrink-0" />
      {message}
    </div>
  )
}

function ComingSoon({ section }: { section: string }) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="h-12 w-12 rounded-xl bg-surface-sunken flex items-center justify-center">
        <Info className="h-6 w-6 text-text-tertiary" />
      </div>
      <p className="text-base font-semibold text-text-primary">{section}</p>
      <p className="text-sm text-text-secondary max-w-xs">
        This section is on the roadmap. Save your draft and check back soon.
      </p>
    </Card>
  )
}

function MissingValue() {
  return <span className="text-text-tertiary italic font-normal">Not selected</span>
}
