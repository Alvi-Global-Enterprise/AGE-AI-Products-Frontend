import PhoneInputWithCountry from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'
import 'react-phone-number-input/style.css'
import { cn } from '@/shared/lib/utils'

/**
 * Phone input via react-phone-number-input (libphonenumber-js).
 * Controlled `value` is E.164 (e.g. +12025551234) or ''.
 */
export function PhoneInput({
  id,
  label,
  error,
  value = '',
  onChange,
  onBlur,
  defaultCountry = 'US',
  className,
  disabled,
  name,
}) {
  return (
    <div className={cn('w-full min-w-0', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <PhoneInputWithCountry
        id={id}
        name={name}
        flags={flags}
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={value || undefined}
        disabled={disabled}
        onChange={(next) => onChange?.(next || '')}
        onBlur={onBlur}
        className={cn('PhoneInputApp', error && 'PhoneInputApp--error')}
        numberInputProps={{
          className: 'PhoneInputApp-input',
          autoComplete: 'tel',
        }}
      />
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
