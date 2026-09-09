/**
 * Normalized application error — maps Laravel-style API errors.
 */
export class AppError extends Error {
  constructor(
    message,
    { code = 'UNKNOWN', status = 0, details = null, fieldErrors = null, cause = null } = {}
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.details = details
    this.fieldErrors = fieldErrors
    this.cause = cause
  }

  static fromUnknown(error) {
    if (error instanceof AppError) return error
    if (error?.isAxiosError) {
      const status = error.response?.status ?? 0
      const data = error.response?.data
      const fieldErrors = data?.errors
        ? Object.fromEntries(
            Object.entries(data.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])
          )
        : null
      const message =
        data?.message ||
        (fieldErrors && Object.values(fieldErrors)[0]) ||
        error.message ||
        'Network request failed'
      return new AppError(message, {
        code: data?.error || data?.code || `HTTP_${status || 'NETWORK'}`,
        status,
        details: data ?? null,
        fieldErrors,
        cause: error,
      })
    }
    if (error instanceof Error) {
      return new AppError(error.message, { code: 'RUNTIME', cause: error })
    }
    return new AppError(String(error ?? 'Unknown error'), { code: 'UNKNOWN' })
  }

  /** Apply Laravel validation errors onto a Formik helpers.setErrors */
  applyToFormik(setErrors) {
    if (this.fieldErrors && typeof setErrors === 'function') {
      setErrors(this.fieldErrors)
    }
  }
}
