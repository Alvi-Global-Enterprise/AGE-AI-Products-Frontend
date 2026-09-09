export const authFormInitialValues = {
  email: '',
  password: '',
  password_confirmation: '',
}

export const verifyOtpInitialValues = {
  otp: '',
}

export const completeProfileInitialValues = {
  name: '',
  phone: '',
  business_name: '',
  business_type: '',
  business_category: '',
  business_phone: '',
  country: 'US',
  currency: 'USD',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  website: '',
  tax_id: '',
}
