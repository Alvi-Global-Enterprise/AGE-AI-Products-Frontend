import { useEffect, useMemo, useState } from 'react'
import {
  AsYouType,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js'
import examples from 'libphonenumber-js/mobile/examples'
import { cn } from '@/shared/lib/utils'
import { COUNTRIES } from '@/shared/constants/config'

/** Dial-code options derived from app COUNTRIES list */
export const PHONE_COUNTRIES = COUNTRIES.map((c) => {
  let dial = ''
  try {
    dial = `+${getCountryCallingCode(c.value)}`
  } catch {
    dial = ''
  }
  return {
    iso: c.value,
    label: c.label,
    dial,
    optionLabel: dial ? `${c.value} ${dial}` : c.value,
  }
}).filter((c) => c.dial)

function examplePlaceholder(iso) {
  try {
    const example = getExampleNumber(iso, examples)
    return example?.formatNational() || 'Phone number'
  } catch {
    return 'Phone number'
  }
}

function toE164(iso, nationalInput) {
  const digits = String(nationalInput || '').replace(/\D/g, '')
  if (!digits) return ''

  const formatter = new AsYouType(iso)
  formatter.input(digits)
  const number = formatter.getNumber()
  if (number) return number.format('E.164')

  try {
    const cc = getCountryCallingCode(iso)
    return `+${cc}${digits}`
  } catch {
    return digits
  }
}

function formatNational(iso, input) {
  return new AsYouType(iso).input(String(input || '').replace(/[^\d+()\-\s]/g, ''))
}

/**
 * Phone input with country dial-code select + national number formatting (AsYouType).
 * Controlled `value` is E.164 (e.g. +15551234567) or empty string.
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
  const initial = useMemo(() => {
    const parsed = value ? parsePhoneNumberFromString(value) : null
    const iso = parsed?.country || defaultCountry
    const national = parsed
      ? new AsYouType(iso).input(parsed.nationalNumber)
      : ''
    return { iso, national }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- mount only

  const [country, setCountry] = useState(initial.iso)
  const [national, setNational] = useState(initial.national)

  // Sync when parent value changes (e.g. Formik enableReinitialize)
  useEffect(() => {
    if (!value) {
      setNational('')
      return
    }
    const parsed = parsePhoneNumberFromString(value)
    if (!parsed) return
    const iso = parsed.country || country
    if (parsed.country && parsed.country !== country) setCountry(parsed.country)
    setNational(new AsYouType(iso).input(parsed.nationalNumber))
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const placeholder = examplePlaceholder(country)

  const emit = (iso, nextNational) => {
    const formatted = formatNational(iso, nextNational)
    setNational(formatted)
    onChange?.(toE164(iso, formatted))
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex overflow-hidden rounded-2xl border bg-white transition',
          'focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20',
          error
            ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-500/15'
            : 'border-slate-200 hover:border-slate-300',
          disabled && 'opacity-60'
        )}
      >
        <label className="sr-only" htmlFor={id ? `${id}-country` : undefined}>
          Country code
        </label>
        <select
          id={id ? `${id}-country` : undefined}
          disabled={disabled}
          value={country}
          aria-label="Country code"
          className="max-w-[7.5rem] shrink-0 cursor-pointer border-0 border-r border-slate-200 bg-slate-50 px-2 py-3.5 text-sm font-medium text-slate-700 outline-none sm:max-w-[8.5rem]"
          onChange={(e) => {
            const nextIso = e.target.value
            setCountry(nextIso)
            emit(nextIso, national)
          }}
          onBlur={onBlur}
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.optionLabel}
            </option>
          ))}
        </select>

        <input
          id={id}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          value={national}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(e) => emit(country, e.target.value)}
          onBlur={onBlur}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
