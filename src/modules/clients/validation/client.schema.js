import * as Yup from 'yup'
import { optionalPhoneField } from '@/shared/validation/phone'

export const clientSchema = Yup.object({
  name: Yup.string().trim().required('Client name is required').max(255),
  company_name: Yup.string().trim().max(255).nullable(),
  email: Yup.string()
    .trim()
    .email('Enter a valid email')
    .nullable()
    .transform((v) => (v === '' ? null : v)),
  phone: optionalPhoneField,
  whatsapp_phone: optionalPhoneField,
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
