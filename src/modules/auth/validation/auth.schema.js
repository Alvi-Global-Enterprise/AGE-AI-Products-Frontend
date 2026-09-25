import * as Yup from 'yup'
import {
  emailField,
  passwordField,
  strongPasswordField,
  nameField,
  otpField,
} from '@/shared/validation/fields'
import { optionalPhoneField } from '@/shared/validation/phone'

export { optionalPhoneField }

export const checkEmailSchema = Yup.object({
  email: emailField,
})

export const loginSchema = Yup.object({
  email: emailField,
  password: passwordField,
})

export const registerSchema = Yup.object({
  email: emailField,
  password: strongPasswordField,
  password_confirmation: Yup.string()
    .required('Confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords do not match'),
})

export const verifyOtpSchema = Yup.object({
  otp: otpField(6),
})

export function getAuthSchema(step) {
  if (step === 'signin') return loginSchema
  if (step === 'register') return registerSchema
  return checkEmailSchema
}

export const profilePersonalSchema = Yup.object({
  name: nameField.max(255),
  phone: optionalPhoneField,
})

export const profileBusinessSchema = Yup.object({
  business_name: Yup.string().trim().required('Business name is required').max(255),
  business_type: Yup.string().required('Select a business type'),
  business_category: Yup.string().required('Select a business category'),
  business_tone: Yup.string()
    .oneOf(['polite', 'professional', 'firm'], 'Select a valid business tone')
    .required('Select a business tone'),
  business_phone: optionalPhoneField,
})

export const profileDetailsSchema = Yup.object({
  country: Yup.string().trim().max(100),
  currency: Yup.string().trim().max(3),
  timezone: Yup.string().trim().max(100),
  website: Yup.string()
    .trim()
    .url('Enter a valid URL (https://...)')
    .nullable()
    .transform((v) => (v === '' ? null : v)),
  tax_id: Yup.string().trim().max(100).nullable(),
})

export const completeProfileSchema = profilePersonalSchema
  .concat(profileBusinessSchema)
  .concat(profileDetailsSchema)

export function getCompleteProfileSchema(step) {
  if (step === 0) return profilePersonalSchema
  if (step === 1) return profileBusinessSchema
  return profileDetailsSchema
}
