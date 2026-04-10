import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'accent' | 'muted'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-slate-700 text-slate-300 border-slate-600',
  success:  'bg-green-500/10 text-green-400 border-green-500/20',
  warning:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error:    'bg-red-500/10 text-red-400 border-red-500/20',
  accent:   'bg-amber-500/10 text-amber-500 border-amber-500/20',
  muted:    'bg-slate-800 text-slate-500 border-slate-700',
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
