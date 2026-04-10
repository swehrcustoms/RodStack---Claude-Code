/* ============================================================
   RodStack V2 — Rod Data Transforms
   Convert between form data, DB rows, and display shapes.
   ============================================================ */

import type { RodFormData, RodBuild } from '@/types/rod'
import { estimateGuideCount } from './calculations'

/** Convert a RodBuild DB row back to editable form data */
export function buildToFormData(build: RodBuild): RodFormData {
  return {
    name: build.name,
    rod_length: String(build.rod_length),
    power: build.power,
    action: build.action,
    line_rating: build.line_rating ?? '',
    lure_rating: build.lure_rating ?? '',
    blank_material: build.blank_material ?? '',
    guide_notes: build.guide_notes ?? '',
    build_notes: build.build_notes ?? '',
  }
}

/** Convert form data + optional id to a DB insert/update payload */
export function formDataToDbPayload(
  form: RodFormData,
  userId: string
): Omit<RodBuild, 'id' | 'created_at' | 'updated_at'> {
  const rodLength = parseFloat(form.rod_length) || 0

  return {
    user_id: userId,
    name: form.name.trim(),
    rod_length: rodLength,
    power: form.power as RodBuild['power'],
    action: form.action as RodBuild['action'],
    line_rating: form.line_rating.trim() || null,
    lure_rating: form.lure_rating.trim() || null,
    blank_material: form.blank_material.trim() || null,
    guide_notes: form.guide_notes.trim() || null,
    build_notes: form.build_notes.trim() || null,
    estimated_guide_count: rodLength > 0 ? estimateGuideCount(rodLength) : null,
  }
}

/** Return a human-readable status label */
export function buildStatusLabel(build: RodBuild): string {
  if (!build.power || !build.action) return 'Incomplete'
  return 'Saved'
}
