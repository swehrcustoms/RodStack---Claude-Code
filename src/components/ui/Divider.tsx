import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  label?: string
}

export function Divider({ label, className, ...props }: DividerProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)} {...props}>
        <div className="flex-1 border-t border-slate-700" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className="flex-1 border-t border-slate-700" />
      </div>
    )
  }

  return (
    <div
      className={cn('border-t border-slate-700', className)}
      role="separator"
      {...props}
    />
  )
}
