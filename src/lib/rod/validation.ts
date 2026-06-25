/* ============================================================
   RodStack V2 — Rod Form Validation
   ============================================================ */

import type { RodFormData, RodFormValidation } from '@/types/rod'

export function validateRodSpec(form: RodFormData): RodFormValidation {
  const errors: Partial<Record<keyof RodFormData, string>> = {}

  if (!form.name.trim()) {
    errors.name = 'Build name is required.'
  } else if (form.name.trim().length < 2) {
    errors.name = 'Build name must be at least 2 characters.'
  }

  if (!form.rod_length) {
    errors.rod_length = 'Rod length is required.'
  } else {
    const len = parseFloat(form.rod_length)
    if (isNaN(len) || len <= 0) {
      errors.rod_length = 'Enter a valid length (e.g. 7 or 7.5).'
    } else if (len < 1 || len > 20) {
      errors.rod_length = 'Length must be between 1 and 20 feet.'
    }
  }

  if (!form.power) {
    errors.power = 'Power rating is required.'
  }

  if (!form.action) {
    errors.action = 'Action is required.'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
