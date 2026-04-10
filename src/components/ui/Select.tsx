import { forwardRef, useId } from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ============================================================
   Select — Radix-based accessible dropdown
   ============================================================ */

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectGroupDef {
  label: string
  options: SelectOption[]
}

export interface SelectProps {
  /** Option list (flat) */
  options?: SelectOption[]
  /** Option list (grouped) */
  groups?: SelectGroupDef[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  hint?: string
  error?: string
  block?: boolean
  required?: boolean
  name?: string
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      groups,
      value,
      defaultValue,
      onValueChange,
      placeholder = 'Select…',
      disabled,
      label,
      hint,
      error,
      block = true,
      required,
      name,
    },
    ref
  ) => {
    const hintId = useId()
    const hasError = Boolean(error)

    const renderOptions = (opts: SelectOption[]) =>
      opts.map((opt) => (
        <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </SelectItem>
      ))

    return (
      <div className={cn('flex flex-col gap-1.5', block && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-text-primary">
            {label}
            {required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
          </label>
        )}

        <RadixSelect.Root
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
          disabled={disabled}
          name={name}
          required={required}
        >
          <RadixSelect.Trigger
            ref={ref}
            aria-describedby={error ? `${hintId}-error` : hint ? hintId : undefined}
            aria-invalid={hasError}
            className={cn(
              'inline-flex items-center justify-between gap-2',
              'h-9 rounded-md border bg-surface-base px-3 text-sm text-text-primary',
              'interactive',
              block && 'w-full',
              hasError
                ? 'border-border-danger focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]'
                : 'border-border focus-visible:border-brand-500 focus-visible:shadow-[var(--focus-ring)]',
              'disabled:bg-surface-sunken disabled:text-text-disabled disabled:cursor-not-allowed',
              'data-[placeholder]:text-text-tertiary'
            )}
          >
            <RadixSelect.Value placeholder={placeholder} />
            <RadixSelect.Icon asChild>
              <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>

          <RadixSelect.Portal>
            <RadixSelect.Content
              position="popper"
              sideOffset={4}
              className={cn(
                'z-dropdown min-w-[var(--radix-select-trigger-width)]',
                'bg-surface-overlay rounded-lg border border-border shadow-lg',
                'overflow-hidden',
                // Animation
                'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1'
              )}
            >
              <RadixSelect.Viewport className="p-1">
                {groups
                  ? groups.map((group) => (
                      <RadixSelect.Group key={group.label}>
                        <RadixSelect.Label className="px-2 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                          {group.label}
                        </RadixSelect.Label>
                        {renderOptions(group.options)}
                      </RadixSelect.Group>
                    ))
                  : renderOptions(options ?? [])}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>

        {hasError && (
          <p id={`${hintId}-error`} className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {!hasError && hint && (
          <p id={hintId} className="text-xs text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

/* ---- SelectItem (internal) ---- */
const SelectItem = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ children, className, ...props }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={cn(
      'relative flex items-center gap-2 pl-8 pr-3 py-2',
      'text-sm text-text-primary rounded-md cursor-default select-none',
      'data-[highlighted]:bg-surface-sunken data-[highlighted]:text-text-primary',
      'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
      'interactive outline-none',
      className
    )}
    {...props}
  >
    <RadixSelect.ItemIndicator className="absolute left-2 flex items-center justify-center">
      <Check className="h-3.5 w-3.5 text-brand-600" />
    </RadixSelect.ItemIndicator>
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
))
SelectItem.displayName = 'SelectItem'
