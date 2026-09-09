import * as Yup from 'yup'

/** Shared Yup field builders — reuse across modules/products */

export const emailField = Yup.string()
  .trim()
  .required('Enter a valid work email')
  .email('Enter a valid work email')

export const passwordField = Yup.string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')

export const strongPasswordField = Yup.string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .matches(/[A-Z]/, 'Include an uppercase letter')
  .matches(/[0-9]/, 'Include a number')

export const nameField = Yup.string()
  .trim()
  .required('Full name is required')
  .min(2, 'Name must be at least 2 characters')

export const otpField = (length = 6) =>
  Yup.string()
    .required(`Enter the ${length}-digit code`)
    .matches(new RegExp(`^\\d{${length}}$`), `Enter the ${length}-digit code`)
