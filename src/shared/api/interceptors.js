import { AppError } from '@/shared/errors/AppError'
import { handleError, isAuthError } from '@/shared/errors/errorHandler'
import {
  getActiveToken,
  clearAllTokens,
} from '@/shared/api/tokenStorage'

/**
 * Request/response interceptors — two-token auth + domain redirects.
 */
export function attachInterceptors(client) {
  client.interceptors.request.use(
    (config) => {
      const token = getActiveToken()
      if (token) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(AppError.fromUnknown(error))
  )

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const appError = handleError(error, {
        context: 'axios',
        silent: true,
      })

      if (typeof window === 'undefined') {
        return Promise.reject(appError)
      }

      const path = window.location.pathname
      const code = appError.code
      const status = appError.status

      if (isAuthError(appError)) {
        // clearAllTokens()
        // if (!path.startsWith('/auth')) {
        //   window.location.assign('/auth')
        // }
      } else if (status === 403 && code === 'InvalidTokenException') {
        if (!path.includes('verify-otp')) {
          window.location.assign('/auth/verify-otp')
        }
      } else if (status === 402 || code === 'TrialExpiredException') {
        if (!path.includes('/app/billing')) {
          window.location.assign('/app/billing/subscribe')
        }
      }

      return Promise.reject(appError)
    }
  )
}
