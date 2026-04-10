import { forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'

/* ============================================================
   Input — labelled text field with addon support
   ============================================================ */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  /** Icon or text prepended inside the input */
  prefix?: React.ReactNode
  /** Icon or text appended inside the input */
  suffix?: React.ReactNode
  /** Full-width block layout */
  block?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      prefix,
      suffix,
      block = true,
      className,
      id: externalId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = externalId ?? generatedId
    const hasError = Boolean(error)

    return (
      <div className={cn('flex flex-col gap-1.5', block && 'w-full')}>
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-text-primary"
          >
            {label}
            {props.required && (
              <span className="ml-0.5 text-danger" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className={cn('relative flex items-center', block && 'w-full')}>
          {prefix && (
            <div className="absolute left-3 flex items-center text-text-tertiary pointer-events-none select-none">
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${id}-error` : hint ? `${id}-hint` : undefined
            }
            className={cn(
              // Base
              'h-9 w-full rounded-md border bg-surface-base px-3 text-sm text-text-primary',
              'placeholder:text-text-tertiary',
              'interactive',
              // Border states
              hasError
                ? 'border-border-danger focus-visible:border-border-danger focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]'
                : 'border-border focus-visible:border-brand-500 focus-visible:shadow-[var(--focus-ring)]',
              // Disabled
              'disabled:bg-surface-sunken disabled:text-text-disabled disabled:cursor-not-allowed',
              // Padding adjustments for addons
              prefix && 'pl-9',
              suffix && 'pr-9',
              className
            )}
            {...props}
          />

          {suffix && (
            <div className="absolute right-3 flex items-center text-text-tertiary pointer-events-none select-none">
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <p id={`${id}-error`} className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${id}-hint`} className="text-xs text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

/* ============================================================
   Textarea — same API as Input but multiline
   ============================================================ */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  block?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, block = true, className, id: externalId, disabled, ...props }, ref) => {
    const generatedId = useId()
    const id = externalId ?? generatedId
    const hasError = Boolean(error)

    return (
      <div className={cn('flex flex-col gap-1.5', block && 'w-full')}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-primary">
            {label}
            {props.required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            'min-h-[80px] w-full rounded-md border bg-surface-base px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-tertiary resize-y',
            'interactive',
            hasError
              ? 'border-border-danger focus-visible:border-border-danger focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]'
              : 'border-border focus-visible:border-brand-500 focus-visible:shadow-[var(--focus-ring)]',
            'disabled:bg-surface-sunken disabled:text-text-disabled disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />

        {error && (
          <p id={`${id}-error`} className="text-xs text-danger" role="alert">{error}</p>
        )}
        {!error && hint && (
          <p id={`${id}-hint`} className="text-xs text-text-tertiary">{hint}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
