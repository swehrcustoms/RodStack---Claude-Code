/* ============================================================
   RodStack V2 — Rod Calculation Engine
   All domain formulas live here. Easy to replace/extend.
   ============================================================ */

import { GUIDE_COUNT_DIVISOR, GUIDE_COUNT_MIN, GUIDE_COUNT_MAX } from './constants'
import type { RodFormData, DerivedRodValues } from '@/types/rod'
import { titleCase } from '@/lib/format'

/**
 * Estimate guide count from rod length.
 *
 * Formula: Math.round(rodLengthFt / 5.5)
 * Clamped between GUIDE_COUNT_MIN and GUIDE_COUNT_MAX.
 *
 * This is the base estimation rule. Replace with a more precise
 * formula (power/action aware, tip-top included, etc.) in V2.1+.
 */
export function estimateGuideCount(rodLengthFt: number): number {
  if (rodLengthFt <= 0) return 0
  const raw = Math.round(rodLengthFt / GUIDE_COUNT_DIVISOR)
  return Math.min(Math.max(raw, GUIDE_COUNT_MIN), GUIDE_COUNT_MAX)
}

/**
 * Compute all derived display values from form state.
 * Called in real-time as the user fills out the rod builder form.
 */
export function derivedRodValues(form: RodFormData): DerivedRodValues {
  const rodLength = parseFloat(form.rod_length) || 0
  const guideCount = rodLength > 0 ? estimateGuideCount(rodLength) : null

  const powerLabel = form.power ? titleCase(form.power) : '—'
  const actionLabel = form.action ? titleCase(form.action) : '—'

  const lengthDisplay =
    rodLength > 0 ? formatLengthDisplay(rodLength) : '—'

  const buildSummary = buildSummaryString(form, rodLength, guideCount)

  return { guideCount, powerLabel, actionLabel, lengthDisplay, buildSummary }
}

/**
 * Format a rod length in feet to a display string.
 * e.g. 7.5 → "7'6\""
 */
export function formatLengthDisplay(feet: number): string {
  const wholeFeet = Math.floor(feet)
  const inches = Math.round((feet - wholeFeet) * 12)
  if (inches === 0) return `${wholeFeet}'0"`
  return `${wholeFeet}'${inches}"`
}

/**
 * Build a one-line summary string for a rod spec.
 * e.g. "7'0\" · Medium · Fast · Graphite"
 */
function buildSummaryString(
  form: RodFormData,
  rodLength: number,
  guideCount: number | null
): string {
  const parts: string[] = []

  if (rodLength > 0) parts.push(formatLengthDisplay(rodLength))
  if (form.power) parts.push(titleCase(form.power))
  if (form.action) parts.push(titleCase(form.action))
  if (form.blank_material) parts.push(titleCase(form.blank_material))

  return parts.length > 0 ? parts.join(' · ') : 'Fill in rod details above'
}
