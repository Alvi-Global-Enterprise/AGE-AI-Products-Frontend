import { APP_CONFIG } from '@/shared/constants/config'
import { delay } from '@/shared/lib/delay'
import axiosClient from '@/shared/api/axiosClient'
import { AppError } from '@/shared/errors/AppError'
import { getTempToken } from '@/shared/api/tokenStorage'

const EXISTING = new Set(['sarah@northstar.io', 'demo@age.ai', 'admin@age.ai'])

function mockUser(overrides = {}) {
  return {
    id: 1,
    name: null,
    email: 'sarah@acmelaw.com',
    phone: null,
    tenant_id: 'tenant-demo',
    roles: ['client_owner'],
    email_verified_at: null,
    is_profile_complete: false,
    tenant: {
      id: 'tenant-demo',
      name: null,
      business_type: null,
      business_category: null,
      phone: null,
      country: 'US',
      currency: 'usd',
      timezone: 'UTC',
      website: null,
      tax_id: null,
      trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      on_trial: true,
    },
    ...overrides,
  }
}

/**
 * Auth API — AGE AI backend contract (docs/API_DOCUMENTATION.md)
 */
export const authApi = {
  async checkEmail(email) {
    const normalized = String(email || '').trim().toLowerCase()
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      const is_registered = EXISTING.has(normalized)
      return {
        email: normalized,
        is_registered,
        message: is_registered
          ? 'Email is already registered.'
          : 'Email is available for registration.',
      }
    }
    const { data } = await axiosClient.post('/api/check-email', { email: normalized })
    return data
  },

  async register({ email, password, password_confirmation }) {
    if (APP_CONFIG.useMockApi) {
      await delay(600)
      return {
        user: mockUser({ email }),
        token: 'mock|temp_token',
        token_type: 'Bearer',
        is_temporary: true,
      }
    }
    const { data } = await axiosClient.post('/api/register', {
      email,
      password,
      password_confirmation: password_confirmation ?? password,
    })
    return data
  },

  async login({ email, password, device_name }) {
    if (APP_CONFIG.useMockApi) {
      await delay(500)
      if (!password || password.length < 8) {
        throw new AppError('Invalid credentials.', {
          code: 'InvalidCredentialsException',
          status: 400,
        })
      }
      return {
        user: mockUser({
          email,
          name: 'Sarah Chen',
          email_verified_at: new Date().toISOString(),
          is_profile_complete: true,
          tenant: {
            ...mockUser().tenant,
            name: 'Northstar Labs',
            business_type: 'llc',
            business_category: 'technology',
          },
        }),
        token: 'mock|permanent_token',
        token_type: 'Bearer',
        is_temporary: false,
      }
    }
    const { data } = await axiosClient.post('/api/login', {
      email,
      password,
      device_name: device_name || navigator.userAgent?.slice(0, 80) || 'web',
    })
    return data
  },

  async verifyOtp({ otp, email, token }) {
    if (APP_CONFIG.useMockApi) {
      await delay(500)
      if (String(otp) !== '123456') {
        throw new AppError('The provided verification code is invalid or has expired.', {
          code: 'InvalidOtpException',
          status: 422,
        })
      }
      return {
        message: 'Email verified successfully.',
        verified: true,
        user: mockUser({
          email: email || 'sarah@acmelaw.com',
          email_verified_at: new Date().toISOString(),
          is_profile_complete: false,
        }),
        token: 'mock|permanent_token',
        token_type: 'Bearer',
        is_temporary: false,
      }
    }
    const body = { otp }
    if (email) body.email = email
    if (token) body.token = token
    const { data } = await axiosClient.post('/api/verify-otp', body, {
      headers: token || getTempToken()
        ? { Authorization: `Bearer ${token || getTempToken()}` }
        : undefined,
    })
    return data
  },

  async resendOtp(email) {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      return { message: 'Verification code sent successfully to your email.' }
    }
    const { data } = await axiosClient.post('/api/resend-otp', { email })
    return data
  },

  async getUser() {
    if (APP_CONFIG.useMockApi) {
      await delay(300)
      return {
        data: mockUser({
          name: 'Sarah Chen',
          email_verified_at: new Date().toISOString(),
          is_profile_complete: true,
          tenant: { ...mockUser().tenant, name: 'Northstar Labs' },
        }),
      }
    }
    const { data } = await axiosClient.get('/api/user')
    return data
  },

  async completeProfile(payload) {
    if (APP_CONFIG.useMockApi) {
      await delay(700)
      return {
        data: mockUser({
          name: payload.name,
          phone: payload.phone ?? null,
          email_verified_at: new Date().toISOString(),
          is_profile_complete: true,
          tenant: {
            ...mockUser().tenant,
            name: payload.business_name,
            business_type: payload.business_type,
            business_category: payload.business_category,
            phone: payload.business_phone ?? null,
            country: payload.country || 'US',
            currency: payload.currency || 'usd',
            timezone: payload.timezone || 'UTC',
            website: payload.website ?? null,
            tax_id: payload.tax_id ?? null,
          },
        }),
        message: 'Business profile completed successfully.',
      }
    }
    const { data } = await axiosClient.post('/api/complete-profile', payload)
    return data
  },
}

export const authKeys = {
  all: ['auth'],
  user: () => [...authKeys.all, 'user'],
  checkEmail: (email) => [...authKeys.all, 'check-email', email],
}
