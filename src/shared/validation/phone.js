import * as Yup from 'yup'
import { isValidPhoneNumber } from 'react-phone-number-input'

export function isEmptyPhone(value) {
  return value == null || String(value).trim() === ''
}

/** True only for a complete, valid E.164 phone number. */
export function isValidE164Phone(value) {
  if (isEmptyPhone(value)) return false
  try {
    return isValidPhoneNumber(String(value).trim())
  } catch {
    return false
  }
}

/**
 * Optional phone — empty OK; otherwise must be a real valid number (E.164).
 * Keeps '' in Formik (avoids null quirks with string fields).
 */
export const optionalPhoneField = Yup.string()
  .transform((value) => (isEmptyPhone(value) ? '' : String(value).trim()))
  .max(50, 'Phone number is too long')
  .test('phone', 'Enter a valid phone number', (value) => {
    if (isEmptyPhone(value)) return true
    return isValidE164Phone(value)
  })

/** Required phone — must be present and valid. */
export const requiredPhoneField = Yup.string()
  .transform((value) => (isEmptyPhone(value) ? '' : String(value).trim()))
  .required('Phone number is required')
  .max(50, 'Phone number is too long')
  .test('phone', 'Enter a valid phone number', (value) => isValidE164Phone(value))
