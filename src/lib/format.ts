/* ============================================================
   RodStack V2 — Formatting Utilities
   ============================================================ */

/** Format a number as USD currency */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Format rod length in feet — e.g. 7.5 → "7'6\"" */
export function formatRodLength(feet: number): string {
  if (!feet || feet <= 0) return '—'
  const wholeFeet = Math.floor(feet)
  const inches = Math.round((feet - wholeFeet) * 12)
  if (inches === 0) return `${wholeFeet}'0"`
  return `${wholeFeet}'${inches}"`
}

/** Format a date string to a readable format */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString))
}

/** Format a date string as relative time (e.g. "3 days ago") */
export function formatRelativeDate(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diff = now - then

  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(dateString)
}

/** Capitalize first letter of each word */
export function titleCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Format a quantity with optional unit */
export function formatQuantity(qty: number, unit?: string): string {
  const formatted = new Intl.NumberFormat('en-US').format(qty)
  return unit ? `${formatted} ${unit}` : formatted
}
