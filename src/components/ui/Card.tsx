import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

/* ============================================================
   Card — surface container with optional header/footer slots
   ============================================================ */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Extra depth via heavier shadow */
  elevated?: boolean
  /** No padding — useful when embedding full-bleed content */
  noPadding?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ elevated = false, noPadding = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-surface-base rounded-xl border border-border',
        elevated ? 'shadow-md' : 'shadow-sm',
        !noPadding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'

/* ---- CardHeader ---- */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Renders a bottom border separating header from body */
  divided?: boolean
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ divided = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-1',
        divided && 'pb-4 mb-4 border-b border-border-subtle',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
CardHeader.displayName = 'CardHeader'

/* ---- CardTitle ---- */
export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold text-text-primary leading-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
)
CardTitle.displayName = 'CardTitle'

/* ---- CardDescription ---- */
export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-text-secondary', className)}
      {...props}
    >
      {children}
    </p>
  )
)
CardDescription.displayName = 'CardDescription'

/* ---- CardContent ---- */
export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm text-text-primary', className)}
      {...props}
    >
      {children}
    </div>
  )
)
CardContent.displayName = 'CardContent'

/* ---- CardFooter ---- */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  divided?: boolean
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ divided = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3',
        divided && 'pt-4 mt-4 border-t border-border-subtle',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
CardFooter.displayName = 'CardFooter'
