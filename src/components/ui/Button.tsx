import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Renders as child element (e.g. wrapping an <a>) */
  asChild?: boolean
  /** Shows a loading spinner and disables the button */
  loading?: boolean
  /** Icon placed before label */
  iconLeft?: React.ReactNode
  /** Icon placed after label */
  iconRight?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--interactive-primary)] text-[var(--text-on-brand)] ' +
    'hover:bg-[var(--interactive-primary-hover)] active:bg-[var(--interactive-primary-active)] ' +
    'shadow-xs',
  secondary:
    'bg-[var(--interactive-secondary)] text-text-primary border border-border ' +
    'hover:bg-[var(--interactive-secondary-hover)] active:bg-neutral-200',
  outline:
    'bg-transparent text-text-primary border border-border ' +
    'hover:bg-surface-sunken active:bg-neutral-100',
  ghost:
    'bg-transparent text-text-secondary ' +
    'hover:bg-surface-sunken hover:text-text-primary active:bg-neutral-100',
  danger:
    'bg-danger text-white ' +
    'hover:bg-danger-dark active:bg-danger-dark ' +
    'shadow-xs',
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7  px-2.5 text-xs  gap-1.5 rounded-sm',
  sm: 'h-8  px-3   text-sm  gap-1.5 rounded-md',
  md: 'h-9  px-4   text-sm  gap-2   rounded-md',
  lg: 'h-11 px-5   text-base gap-2  rounded-lg',
}

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7  w-7  p-0 rounded-sm',
  sm: 'h-8  w-8  p-0 rounded-md',
  md: 'h-9  w-9  p-0 rounded-md',
  lg: 'h-11 w-11 p-0 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      asChild = false,
      loading = false,
      iconLeft,
      iconRight,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isIconOnly = !children && (iconLeft || iconRight)

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-medium select-none',
          'interactive focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          // Variant + size
          variantStyles[variant],
          isIconOnly ? iconSizeStyles[size] : sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size={size} />
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {iconLeft && <span className="shrink-0">{iconLeft}</span>}
            {children && <span>{children}</span>}
            {iconRight && <span className="shrink-0">{iconRight}</span>}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

/* ---- Spinner ---- */
function Spinner({ size }: { size: ButtonSize }) {
  const dim: Record<ButtonSize, string> = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }
  return (
    <svg
      className={cn('animate-spin shrink-0', dim[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
