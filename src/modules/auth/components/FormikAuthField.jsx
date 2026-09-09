import { useField } from 'formik'
import { AuthField } from '@/modules/auth/components/AuthLayout'

/**
 * Formik-connected AuthField — wires name, value, blur, and touched errors.
 */
export function FormikAuthField({ name, onChange, ...props }) {
  const [field, meta] = useField(name)
  const showError = meta.touched && meta.error

  return (
    <AuthField
      {...props}
      id={props.id || name}
      name={field.name}
      value={field.value ?? ''}
      onBlur={field.onBlur}
      onChange={onChange || field.onChange}
      error={showError ? meta.error : undefined}
    />
  )
}
