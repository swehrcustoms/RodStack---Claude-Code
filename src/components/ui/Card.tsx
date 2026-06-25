import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/* ---- Card (surface container) ---- */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-slate-700 bg-slate-800', className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

/* ---- CardHeader ---- */
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pb-4', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

/* ---- CardTitle ---- */
export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold text-slate-50 leading-tight', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

/* ---- CardDescription ---- */
export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-slate-400 mt-1', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

/* ---- CardContent ---- */
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 pb-6', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

/* ---- CardFooter ---- */
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 pb-6 flex items-center gap-3 pt-4 border-t border-slate-700', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'
