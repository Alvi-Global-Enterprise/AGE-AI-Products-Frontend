import { useField } from 'formik'
import { FormSelect } from '@/shared/components/ui/FormSelect'

export function FormikSelect({ name, children, ...props }) {
  const [field, meta] = useField(name)
  const showError = meta.touched && meta.error
  return (
    <FormSelect
      {...props}
      id={props.id || name}
      name={field.name}
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={showError ? meta.error : undefined}
    >
      {children}
    </FormSelect>
  )
}
