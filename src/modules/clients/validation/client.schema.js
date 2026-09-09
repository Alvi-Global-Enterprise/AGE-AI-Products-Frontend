import * as Yup from 'yup'
import { isValidPhoneNumber } from 'libphonenumber-js'

const optionalPhone = Yup.string()
  .trim()
  .max(50)
  .nullable()
  .transform((v) => (v === '' ? null : v))
  .test('phone', 'Enter a valid phone number', (value) => {
    if (!value) return true
    return isValidPhoneNumber(value)
  })

export const clientSchema = Yup.object({
  name: Yup.string().trim().required('Client name is required').max(255),
  company_name: Yup.string().trim().max(255).nullable(),
  email: Yup.string().trim().email('Enter a valid email').nullable(),
  phone: optionalPhone,
  whatsapp_phone: optionalPhone,
  currency: Yup.string().trim().max(3).nullable(),
  tax_number: Yup.string().trim().max(100).nullable(),
  address: Yup.string().trim().max(1000).nullable(),
  preferred_channel: Yup.string()
    .oneOf(['email', 'sms', 'whatsapp', 'call', ''], 'Invalid channel')
    .nullable(),
  risk_tier: Yup.string().oneOf(['low', 'medium', 'high', ''], 'Invalid risk').nullable(),
})

export const clientInitialValues = {
  name: '',
  company_name: '',
  email: '',
  phone: '',
  whatsapp_phone: '',
  currency: 'USD',
  tax_number: '',
  address: '',
  preferred_channel: 'email',
  risk_tier: 'low',
}
