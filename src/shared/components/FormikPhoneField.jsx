import { useField } from 'formik'
import { PhoneInput } from '@/shared/components/ui/PhoneInput'

/**
 * Formik-connected phone field.
 * Stores E.164 in the form value (e.g. +15551234567).
 */
export function FormikPhoneField({ name, defaultCountry = 'US', ...props }) {
  const [field, meta, helpers] = useField(name)
  const showError = meta.touched && meta.error

  return (
    <PhoneInput
      {...props}
      id={props.id || name}
      name={field.name}
      value={field.value ?? ''}
      defaultCountry={defaultCountry}
      error={showError ? meta.error : undefined}
      onChange={(e164) => {
        helpers.setValue(e164)
      }}
      onBlur={() => {
        helpers.setTouched(true)
      }}
    />
  )
}
