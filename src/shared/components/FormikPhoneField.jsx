import { useField } from 'formik'
import { PhoneInput } from '@/shared/components/ui/PhoneInput'

/**
 * Formik-connected phone field (react-phone-number-input).
 * Stores E.164 in the form value (e.g. +12025551234) or '' when empty.
 */
export function FormikPhoneField({ name, defaultCountry = 'US', className, ...props }) {
  const [field, meta, helpers] = useField(name)
  const showError = Boolean(meta.touched && meta.error)

  return (
    <PhoneInput
      {...props}
      id={props.id || name}
      name={field.name}
      className={className}
      value={field.value ?? ''}
      defaultCountry={defaultCountry}
      error={showError ? meta.error : undefined}
      onChange={(e164) => {
        helpers.setValue(e164 || '')
      }}
      onBlur={() => {
        helpers.setTouched(true, true)
      }}
    />
  )
}
