/* ============================================================
   RodStack — Core Rod Domain Types
   ============================================================ */

export type RodType = 'casting' | 'spinning' | 'fly' | 'surf' | 'trolling' | 'ice'
export type RodPower = 'ultralight' | 'light' | 'medium-light' | 'medium' | 'medium-heavy' | 'heavy' | 'extra-heavy'
export type RodAction = 'slow' | 'moderate' | 'moderate-fast' | 'fast' | 'extra-fast'
export type RodStatus = 'draft' | 'in-progress' | 'complete' | 'archived'

/* ---- Component Interfaces ---- */

export interface RodBlank {
  id: string
  manufacturer: string
  model: string
  /** Total length in inches */
  lengthIn: number
  sections: number
  power: RodPower
  action: RodAction
  type: RodType
  /** Line weight range e.g. "10-17lb" */
  lineWeight: string
  /** Lure weight range e.g. "3/8-1oz" */
  lureWeight: string
  /** Tip diameter in mm */
  tipDiameterMm: number
  /** Butt diameter in mm */
  buttDiameterMm: number
  /** Weight in grams */
  weightG: number
  color: string
  /** Unit price in cents */
  priceCents: number
}

export interface GuideSet {
  id: string
  manufacturer: string
  model: string
  /** Frame material e.g. "Stainless", "Titanium" */
  frameMaterial: string
  /** Insert material e.g. "SiC", "Alconite", "Zirconia" */
  insertMaterial: string
  /** Total guides in the set */
  count: number
  /** Ring sizes array e.g. [6, 5, 5, 4, 4, ...] */
  ringSizes: number[]
  type: 'single-foot' | 'double-foot' | 'mixed'
  finish: string
  /** Unit price in cents */
  priceCents: number
}

export interface RodHandle {
  id: string
  manufacturer: string
  model: string
  material: 'cork' | 'eva' | 'cork-tape' | 'winn-grip' | 'hybrid'
  /** Length in inches */
  lengthIn: number
  /** Inside diameter in mm (to fit blank) */
  insideDiameterMm: number
  type: RodType
  color: string
  /** Unit price in cents */
  priceCents: number
}

export interface ReelSeat {
  id: string
  manufacturer: string
  model: string
  material: 'graphite' | 'aluminum' | 'titanium' | 'wood' | 'carbon'
  type: 'spinning' | 'casting' | 'fly' | 'trigger'
  /** Inside diameter in mm */
  insideDiameterMm: number
  finish: string
  /** Unit price in cents */
  priceCents: number
}

export interface WrapThread {
  id: string
  brand: string
  color: string
  colorCode: string
  /** Thread size A, C, D, E */
  size: 'A' | 'C' | 'D' | 'E'
  /** Denier */
  denier: number
  /** Price per yard in cents */
  pricePerYardCents: number
}

export interface Finish {
  id: string
  brand: string
  product: string
  type: 'epoxy' | 'uv-cure' | 'flex-coat'
  /** Ounces */
  volumeOz: number
  /** Price per oz in cents */
  pricePerOzCents: number
}

/* ---- Build Assembly ---- */

export interface GuidePosition {
  guideIndex: number
  /** Distance from butt in inches */
  distanceFromButtIn: number
  /** Wrap color (thread id) */
  wrapThreadId?: string
  /** Trim color (thread id) */
  trimThreadId?: string
  notes?: string
}

export interface RodBuild {
  id: string
  userId: string
  name: string
  status: RodStatus
  type: RodType

  /* Components */
  blank?: RodBlank
  guideSet?: GuideSet
  handle?: RodHandle
  reelSeat?: ReelSeat
  wrapThread?: WrapThread
  trimThread?: WrapThread
  finish?: Finish

  /* Guide layout */
  guidePositions: GuidePosition[]

  /* Builder notes */
  notes?: string

  /* Metadata */
  createdAt: string   // ISO 8601
  updatedAt: string   // ISO 8601
  completedAt?: string
}

/* ---- Calculation Result Types ---- */

export interface WeightBreakdown {
  blankG: number
  guideSetG: number
  handleG: number
  reelSeatG: number
  hardwareG: number
  totalG: number
}

export interface CostBreakdown {
  blankCents: number
  guideSetCents: number
  handleCents: number
  reelSeatCents: number
  wrapThreadCents: number
  finishCents: number
  totalCents: number
}

export interface BuildValidation {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: keyof RodBuild | string
  message: string
}

export interface ValidationWarning {
  field: keyof RodBuild | string
  message: string
}

/* ---- Form State ---- */

export type RodBuildDraft = Omit<RodBuild, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
