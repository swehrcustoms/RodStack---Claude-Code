import type {
  RodBuild,
  RodBlank,
  GuideSet,
  GuidePosition,
  WeightBreakdown,
  CostBreakdown,
  BuildValidation,
} from '@/types/rod'

/* ============================================================
   Weight Calculations
   ============================================================ */

/** Estimated guide-set weight in grams (per-guide lookup table approx.) */
const GUIDE_FRAME_WEIGHT_G: Record<number, number> = {
  4: 0.8, 5: 0.9, 6: 1.0, 7: 1.1, 8: 1.3,
  10: 1.6, 12: 2.0, 16: 2.8, 20: 3.8, 25: 5.2, 30: 7.0,
}

function guideWeightG(ringSize: number): number {
  const sizes = Object.keys(GUIDE_FRAME_WEIGHT_G).map(Number).sort((a, b) => a - b)
  for (let i = sizes.length - 1; i >= 0; i--) {
    if (ringSize >= sizes[i]) return GUIDE_FRAME_WEIGHT_G[sizes[i]]
  }
  return 1.0
}

export function estimateGuideSetWeightG(guideSet: GuideSet): number {
  return guideSet.ringSizes.reduce((sum, size) => sum + guideWeightG(size), 0)
}

export function calculateWeightBreakdown(build: RodBuild): WeightBreakdown {
  const blankG       = build.blank?.weightG ?? 0
  const guideSetG    = build.guideSet ? estimateGuideSetWeightG(build.guideSet) : 0
  // Handle + reel seat estimates if no weight property
  const handleG      = build.handle ? (build.handle.lengthIn * 8) : 0  // ~8g/in estimate
  const reelSeatG    = build.reelSeat ? 28 : 0                          // ~1oz average
  const hardwareG    = 5                                                 // tip-top, keeper, etc.

  return {
    blankG,
    guideSetG,
    handleG,
    reelSeatG,
    hardwareG,
    totalG: blankG + guideSetG + handleG + reelSeatG + hardwareG,
  }
}

/* ============================================================
   Cost Calculations
   ============================================================ */

/** Estimate wrap thread yardage needed */
function estimateWrapYards(guideSet: GuideSet): number {
  // ~6 inches per wrap foot for a single-foot guide, 12 for double
  const yardsPerGuide = guideSet.type === 'double-foot' ? 0.5 : 0.25
  return guideSet.count * yardsPerGuide + 2 // 2yd extra for handle wraps
}

export function calculateCostBreakdown(build: RodBuild): CostBreakdown {
  const blankCents      = build.blank?.priceCents ?? 0
  const guideSetCents   = build.guideSet?.priceCents ?? 0
  const handleCents     = build.handle?.priceCents ?? 0
  const reelSeatCents   = build.reelSeat?.priceCents ?? 0

  const wrapYards       = build.guideSet ? estimateWrapYards(build.guideSet) : 0
  const wrapThreadCents = build.wrapThread
    ? Math.ceil(wrapYards * build.wrapThread.pricePerYardCents)
    : 0

  const finishCents     = build.finish ? build.finish.pricePerOzCents * 2 : 0 // ~2oz per build

  return {
    blankCents,
    guideSetCents,
    handleCents,
    reelSeatCents,
    wrapThreadCents,
    finishCents,
    totalCents: blankCents + guideSetCents + handleCents + reelSeatCents + wrapThreadCents + finishCents,
  }
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

/* ============================================================
   Guide Spacing — Common Formulas
   ============================================================ */

/**
 * Calculates guide positions using the REC Spacing Calculator method.
 * Guide placement is measured from the tip.
 *
 * @param blank   Rod blank definition
 * @param count   Number of guides (excluding tip-top)
 * @returns       Array of distances from butt in inches
 */
export function calculateGuideSpacing(blank: RodBlank, count: number): number[] {
  const lengthIn = blank.lengthIn

  // REC method: geometric progression from tip
  // First guide is ~8-10% of blank length from tip
  const firstFromTip = lengthIn * 0.08
  // Each subsequent guide is ~1.15x farther from tip
  const multiplier = 1.18

  const distancesFromTip: number[] = []
  let dist = firstFromTip
  for (let i = 0; i < count; i++) {
    distancesFromTip.push(dist)
    dist *= multiplier
  }

  // Convert to distance from butt
  return distancesFromTip.map((d) => Math.round((lengthIn - d) * 10) / 10).reverse()
}

/**
 * Validates that guide positions are within blank length and in ascending order.
 */
export function validateGuidePositions(
  positions: GuidePosition[],
  blank: RodBlank
): { valid: boolean; message?: string } {
  if (positions.length === 0) return { valid: true }

  const sorted = [...positions].sort((a, b) => a.distanceFromButtIn - b.distanceFromButtIn)

  for (const pos of sorted) {
    if (pos.distanceFromButtIn < 0 || pos.distanceFromButtIn > blank.lengthIn) {
      return {
        valid: false,
        message: `Guide at ${pos.distanceFromButtIn}" is outside blank length (${blank.lengthIn}")`,
      }
    }
  }

  return { valid: true }
}

/* ============================================================
   Build Validation
   ============================================================ */

export function validateBuild(build: Partial<RodBuild>): BuildValidation {
  const errors = []
  const warnings = []

  if (!build.name?.trim()) {
    errors.push({ field: 'name', message: 'Rod name is required' })
  }

  if (!build.blank) {
    errors.push({ field: 'blank', message: 'A blank must be selected to complete the build' })
  }

  if (!build.guideSet) {
    warnings.push({ field: 'guideSet', message: 'No guide set selected — add guides before finalizing' })
  }

  if (!build.handle) {
    warnings.push({ field: 'handle', message: 'No handle selected' })
  }

  if (!build.reelSeat) {
    warnings.push({ field: 'reelSeat', message: 'No reel seat selected' })
  }

  if (build.blank && build.guideSet) {
    const guidesPlaced = build.guidePositions?.length ?? 0
    if (guidesPlaced < build.guideSet.count) {
      warnings.push({
        field: 'guidePositions',
        message: `${build.guideSet.count - guidesPlaced} guide(s) not yet positioned`,
      })
    }
  }

  if (build.blank && build.handle) {
    const handleOD = build.handle.insideDiameterMm
    const blankButt = build.blank.buttDiameterMm
    if (handleOD < blankButt - 2) {
      errors.push({
        field: 'handle',
        message: `Handle ID (${handleOD}mm) may be too small for blank butt (${blankButt}mm)`,
      })
    }
  }

  if (build.blank && build.reelSeat) {
    const seatOD = build.reelSeat.insideDiameterMm
    const blankMid = build.blank.buttDiameterMm * 0.7 // rough mid-point estimate
    if (seatOD < blankMid - 2) {
      warnings.push({
        field: 'reelSeat',
        message: `Reel seat ID may require shimming to fit blank at mounting point`,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/* ============================================================
   Serialization helpers (save-ready)
   ============================================================ */

export function buildToSavePayload(build: RodBuild): RodBuild {
  return {
    ...build,
    updatedAt: new Date().toISOString(),
    guidePositions: build.guidePositions.map((gp, i) => ({
      ...gp,
      guideIndex: i,
    })),
  }
}

export function createEmptyBuild(userId: string): RodBuild {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    userId,
    name: '',
    status: 'draft',
    type: 'casting',
    guidePositions: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function formatLengthInches(inches: number): string {
  const feet = Math.floor(inches / 12)
  const remaining = inches % 12
  if (remaining === 0) return `${feet}'0"`
  return `${feet}'${remaining}"`
}
