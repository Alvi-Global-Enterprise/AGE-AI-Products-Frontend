import { useState } from 'react'
import { cn } from '@/lib/utils'

const ALWAYS_FLOAT_TYPES = new Set(['date', 'datetime-local', 'time', 'month', 'week'])

export function Input({
  label,
  id,
  type = 'text',
  error,
  hint,
  className,
  containerClassName,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  ...props
}) {
  const [focused, setFocused] = useState(false)
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue
  const isDateLike = ALWAYS_FLOAT_TYPES.has(type)
  const hasValue = currentValue !== undefined && String(currentValue).length > 0
  // Date-like inputs always show browser chrome — keep label pinned up
  const floated = isDateLike || focused || hasValue || Boolean(props.placeholder)

  return (
    <div className={cn('relative w-full', containerClassName)}>
      <input
        id={id}
        type={type}
        value={isControlled ? value : undefined}
        defaultValue={!isControlled ? defaultValue : undefined}
        className={cn(
          'peer w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition-all duration-200',
          'placeholder:text-transparent',
          'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15',
          floated ? 'pb-2.5 pt-5' : 'py-3.5',
          isDateLike && [
            'min-h-[52px] pr-3',
            // Keep native date text readable; empty state softer
            !hasValue && !focused && 'text-slate-400',
            hasValue && 'text-slate-900',
            // Calendar icon alignment (Chromium)
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
            '[&::-webkit-calendar-picker-indicator]:rounded-md',
            '[&::-webkit-calendar-picker-indicator]:p-1',
            '[&::-webkit-calendar-picker-indicator]:opacity-60',
            '[&::-webkit-calendar-picker-indicator]:hover:opacity-100',
            '[&::-webkit-calendar-picker-indicator]:hover:bg-slate-100',
            '[&::-webkit-datetime-edit]:min-h-[1.25rem]',
            '[&::-webkit-datetime-edit-fields-wrapper]:p-0',
          ],
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
            : 'border-slate-200 hover:border-slate-300',
          className
        )}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        onChange={(e) => {
          if (!isControlled) setInternalValue(e.target.value)
          onChange?.(e)
        }}
        {...props}
      />
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute left-3.5 z-[1] origin-left transition-all duration-200',
            floated
              ? 'top-1.5 translate-y-0 text-[10px] font-medium uppercase tracking-wide'
              : 'top-1/2 -translate-y-1/2 text-sm',
            error
              ? 'text-rose-500'
              : focused
                ? 'text-emerald-600'
                : floated
                  ? 'text-slate-400'
                  : 'text-slate-400'
          )}
        >
          {label}
        </label>
      )}
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
