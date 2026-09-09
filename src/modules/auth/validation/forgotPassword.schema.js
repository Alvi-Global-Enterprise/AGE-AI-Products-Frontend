import * as Yup from 'yup'
import { emailField, strongPasswordField, otpField } from '@/shared/validation/fields'

export const DEMO_OTP = '123456'
export const OTP_LENGTH = 6

export const forgotEmailSchema = Yup.object({
  email: emailField,
})

export const forgotOtpSchema = Yup.object({
  otp: otpField(OTP_LENGTH).test(
    'demo-otp',
    `Invalid code. Try ${DEMO_OTP} for this demo.`,
    (value) => value === DEMO_OTP
  ),
})

export const forgotPasswordSchema = Yup.object({
  password: strongPasswordField,
  confirm: Yup.string()
    .required('Confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords do not match'),
})

export function getForgotPasswordSchema(step) {
  if (step === 1) return forgotOtpSchema
  if (step === 2) return forgotPasswordSchema
  return forgotEmailSchema
}
