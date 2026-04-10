'use client'

import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  prefix?: ReactNode
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, prefix, suffix, className, id: externalId, ...props }, ref) => {
    const generatedId = useId()
    const id = externalId ?? generatedId
    const hasError = Boolean(error)

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-slate-300">
            {label}
            {props.required && (
              <span className="ml-0.5 text-red-400" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {prefix && (
            <div className="absolute left-3 flex items-center text-slate-500 pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            aria-invalid={hasError}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={cn(
              'h-9 w-full rounded-md border bg-slate-900 px-3 text-sm text-slate-100',
              'placeholder:text-slate-600 transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
              hasError
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-700 hover:border-slate-600',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              prefix && 'pl-9',
              suffix && 'pr-9',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 flex items-center text-slate-500 pointer-events-none">
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <p id={`${id}-error`} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${id}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
