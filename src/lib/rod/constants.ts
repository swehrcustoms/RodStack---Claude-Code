/* ============================================================
   RodStack V2 — Rod Building Constants
   Canonical option sets for all rod-building domain selectors.
   ============================================================ */

import type { RodPower, RodAction } from '@/types/rod'

export const POWER_OPTIONS: { value: RodPower; label: string }[] = [
  { value: 'ultralight',   label: 'Ultralight'    },
  { value: 'light',        label: 'Light'         },
  { value: 'medium-light', label: 'Medium-Light'  },
  { value: 'medium',       label: 'Medium'        },
  { value: 'medium-heavy', label: 'Medium-Heavy'  },
  { value: 'heavy',        label: 'Heavy'         },
  { value: 'extra-heavy',  label: 'Extra Heavy'   },
]

export const ACTION_OPTIONS: { value: RodAction; label: string }[] = [
  { value: 'slow',          label: 'Slow'          },
  { value: 'moderate',      label: 'Moderate'      },
  { value: 'moderate-fast', label: 'Moderate-Fast' },
  { value: 'fast',          label: 'Fast'          },
  { value: 'extra-fast',    label: 'Extra-Fast'    },
]

export const BLANK_MATERIAL_OPTIONS: { value: string; label: string }[] = [
  { value: 'graphite',          label: 'Graphite'           },
  { value: 'fiberglass',        label: 'Fiberglass'         },
  { value: 'composite',         label: 'Composite'          },
  { value: 'high-modulus-graphite', label: 'High-Modulus Graphite' },
  { value: 'nano-carbon',       label: 'Nano Carbon'        },
  { value: 'boron',             label: 'Boron'              },
]

export const INVENTORY_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'blank',      label: 'Blanks'       },
  { value: 'guides',     label: 'Guides'       },
  { value: 'reel-seat',  label: 'Reel Seats'   },
  { value: 'handle',     label: 'Handles'      },
  { value: 'thread',     label: 'Thread'       },
  { value: 'finish',     label: 'Finish'       },
  { value: 'hardware',   label: 'Hardware'     },
  { value: 'other',      label: 'Other'        },
]

/** Guide count estimation divisor — rod_length_ft / GUIDE_DIVISOR, rounded */
export const GUIDE_COUNT_DIVISOR = 5.5

/** Minimum and maximum guide counts regardless of formula */
export const GUIDE_COUNT_MIN = 5
export const GUIDE_COUNT_MAX = 20
