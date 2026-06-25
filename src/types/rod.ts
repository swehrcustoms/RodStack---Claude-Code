/* ============================================================
   RodStack V2 — Rod Domain Types
   ============================================================ */

export type RodPower =
  | 'ultralight'
  | 'light'
  | 'medium-light'
  | 'medium'
  | 'medium-heavy'
  | 'heavy'
  | 'extra-heavy'

export type RodAction = 'slow' | 'moderate' | 'moderate-fast' | 'fast' | 'extra-fast'

export type RodStatus = 'draft' | 'in-progress' | 'complete' | 'archived'

/** Flat form data as strings — what the form manages before parsing */
export interface RodFormData {
  name: string
  rod_length: string        // stored as string in form, parsed to number on save
  power: string
  action: string
  line_rating: string
  lure_rating: string
  blank_material: string
  guide_notes: string
  build_notes: string
}

/** A saved rod build — matches the rod_builds DB table */
export interface RodBuild {
  id: string
  user_id: string
  name: string
  rod_length: number
  power: RodPower
  action: RodAction
  line_rating: string | null
  lure_rating: string | null
  blank_material: string | null
  guide_notes: string | null
  build_notes: string | null
  estimated_guide_count: number | null
  created_at: string
  updated_at: string
}

/** Derived display values computed from form state */
export interface DerivedRodValues {
  guideCount: number | null
  powerLabel: string
  actionLabel: string
  lengthDisplay: string
  buildSummary: string
}

/** Validation result for a RodFormData */
export interface RodFormValidation {
  valid: boolean
  errors: Partial<Record<keyof RodFormData, string>>
}
