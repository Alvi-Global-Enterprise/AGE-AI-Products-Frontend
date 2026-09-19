import { AppError } from '@/shared/errors/AppError'

/**
 * Global error handling — log, map, and surface user-safe messages.
 */
export function handleError(error, { context = 'app', silent = false } = {}) {
  const appError = AppError.fromUnknown(error)

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, appError.code, appError.message, appError.details ?? '')
  }

  if (!silent && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('age:error', {
        detail: {
          message: getUserMessage(appError),
          code: appError.code,
          status: appError.status,
          context,
        },
      })
    )
  }

  return appError
}

export function getUserMessage(error) {
  const appError = AppError.fromUnknown(error)
  switch (appError.code) {
    case 'InvalidCredentialsException':
      return 'Invalid email or password.'
    case 'InvalidOtpException':
      return 'The verification code is invalid or has expired.'
    case 'InvalidTokenException':
      return 'Your session expired. Please sign in again.'
    case 'TooManyOtpRequestsException': {
      const sec = appError.details?.retry_after_seconds
      return sec
        ? `Too many OTP requests. Try again in ${sec}s.`
        : 'Too many OTP requests. Please wait a moment.'
    }
    case 'TrialExpiredException':
      return 'Your trial has ended. Please subscribe to continue.'
    case 'ProfileAlreadyCompletedException':
      return 'Your profile is already completed.'
    case 'ClientNotFoundException':
      return 'Client not found.'
    case 'TRIAL_INVOICE_LIMIT_EXCEEDED':
      return (
        appError.message ||
        'Trial accounts are limited to a maximum of 10 invoices. Please upgrade to the Base plan to create more invoices.'
      )
    case 'PLAN_INVOICE_LIMIT_EXCEEDED':
      return (
        appError.message ||
        'You have reached your invoice limit for this billing cycle. Please upgrade your plan.'
      )
    case 'TRIAL_CHANNEL_RESTRICTED':
      return (
        appError.message ||
        'SMS and WhatsApp reminders are not available on the free trial. Please upgrade to the Base plan to unlock multi-channel reminders.'
      )
    default:
      break
  }
  switch (appError.status) {
    case 401:
      return 'Your session expired. Please sign in again.'
    case 402:
      return 'Payment required — subscribe to continue using this product.'
    case 403:
      return appError.message || 'You do not have permission to do that.'
    case 404:
      return 'We could not find what you were looking for.'
    case 422:
      return appError.message || 'Please check your input and try again.'
    case 429:
      return appError.message || 'Too many requests. Please wait and retry.'
    case 500:
    case 502:
    case 503:
      return 'Something went wrong on our side. Please try again.'
    default:
      return appError.message || 'Something went wrong. Please try again.'
  }
}

export function isAuthError(error) {
  const appError = AppError.fromUnknown(error)
  return appError.status === 401 || appError.code === 'InvalidTokenException'
}
