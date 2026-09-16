import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Landmark, Loader2, ExternalLink, ShieldCheck } from 'lucide-react'
import { AuthLayout } from '@/modules/auth/components/AuthLayout'
import { Button } from '@/shared/components/ui/Button'
import {
  useStripeConnectOnboard,
  useStripeConnectStatus,
} from '@/modules/billing/hooks/useBilling'
import { useCurrentUser } from '@/modules/auth/hooks/useAuth'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { selectUser } from '@/app/store/slices/authSlice'
import { setUser } from '@/app/store/slices/authSlice'
import { useLogout } from '@/modules/auth/hooks/useAuth'
import { isUserBankReady } from '@/shared/lib/tenantBank'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { APP_CONFIG } from '@/shared/constants/config'
import { setMockStripeConnectConnected } from '@/modules/billing/api/billing.api'

function connectUrls() {
  const origin = window.location.origin
  return {
    return_url: `${origin}/auth/connect-bank?status=success`,
    refresh_url: `${origin}/auth/connect-bank?status=refresh`,
  }
}

function applyBankFlagsToUser(user, connected) {
  if (!user) return user
  return {
    ...user,
    tenant: {
      ...(user.tenant || {}),
      bank_account_connected: Boolean(connected),
      payouts_enabled: Boolean(connected),
    },
  }
}

/** Normalize GET /api/billing/connect/status (flat or { data: {...} }). */
function normalizeConnectStatus(payload) {
  if (!payload || typeof payload !== 'object') return null
  if (
    payload.data &&
    typeof payload.data === 'object' &&
    ('connected' in payload.data || 'payouts_enabled' in payload.data)
  ) {
    return payload.data
  }
  return payload
}

function unwrapUser(payload) {
  if (!payload || typeof payload !== 'object') return null
  if (payload.tenant || payload.email || payload.id != null) return payload
  if (
    payload.data &&
    typeof payload.data === 'object' &&
    (payload.data.tenant || payload.data.email || payload.data.id != null)
  ) {
    return payload.data
  }
  return null
}

export default function ConnectBankPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const logout = useLogout()
  const user = useAppSelector(selectUser)
  const onboard = useStripeConnectOnboard()
  const {
    data: connectStatusRaw,
    refetch: refetchConnect,
    isFetching: statusFetching,
  } = useStripeConnectStatus()
  const connectStatus = normalizeConnectStatus(connectStatusRaw)
  const { refetch: refetchUser } = useCurrentUser({ enabled: false })

  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const statusParam = searchParams.get('status')

  const enterAppWithBankReady = (baseUser) => {
    const nextUser = applyBankFlagsToUser(baseUser || user, true)
    if (nextUser) dispatch(setUser(nextUser))
    navigate('/app', { replace: true })
  }

  const markReadyAndEnter = async () => {
    setChecking(true)
    setError('')
    try {
      if (APP_CONFIG.useMockApi) {
        setMockStripeConnectConnected(true)
        enterAppWithBankReady(user)
        return
      }

      const [statusRes, userRes] = await Promise.all([
        refetchConnect(),
        refetchUser().catch(() => ({ data: null })),
      ])
      const stripe = normalizeConnectStatus(statusRes.data)
      const freshUser = unwrapUser(userRes?.data)

      // Status API: connected === true → enter dashboard
      if (Boolean(stripe?.connected) || isUserBankReady(freshUser)) {
        enterAppWithBankReady(freshUser || user)
        return
      }

      if (freshUser) dispatch(setUser(freshUser))
      setError('Bank account is not ready yet. Finish Stripe onboarding, then try again.')
    } catch (err) {
      setError(getUserMessage(AppError.fromUnknown(err)))
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (isUserBankReady(user)) {
      navigate('/app', { replace: true })
    }
  }, [user, navigate])

  // Live status already shows connected (e.g. after return from Stripe)
  useEffect(() => {
    if (!connectStatus?.connected) return
    if (isUserBankReady(user)) return
    enterAppWithBankReady(user)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectStatus?.connected])

  useEffect(() => {
    if (statusParam !== 'success' && statusParam !== 'refresh') return
    let cancelled = false
    ;(async () => {
      await markReadyAndEnter()
      if (cancelled) return
      const next = new URLSearchParams(searchParams)
      next.delete('status')
      setSearchParams(next, { replace: true })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusParam])

  const startOnboard = async () => {
    setError('')
    try {
      const res = await onboard.mutateAsync(connectUrls())
      const url = res?.url
      if (!url) throw new AppError('No onboarding URL returned.')

      if (APP_CONFIG.useMockApi) {
        await markReadyAndEnter()
        return
      }

      window.location.assign(url)
    } catch (err) {
      setError(getUserMessage(AppError.fromUnknown(err)))
    }
  }

  const busy = onboard.isPending || checking || statusFetching

  return (
    <AuthLayout
      title="Connect your bank account"
      subtitle="Payouts require a Stripe Connect bank account before you can use AGE AI."
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-950">Required for payouts</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-900/80">
                After your business profile, connect the bank account where recovered invoice
                payments should land. You cannot use the app until your bank is connected and
                payouts are enabled.
              </p>
            </div>
          </div>
        </div>

        {(connectStatus?.connected || connectStatus?.payouts_enabled) && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Stripe: {connectStatus.connected ? 'details submitted' : 'pending'}
            {connectStatus.bank_name
              ? ` · ${connectStatus.bank_name}${
                  connectStatus.bank_last4 ? ` ••${connectStatus.bank_last4}` : ''
                }`
              : ''}
            {connectStatus.payouts_enabled ? ' · payouts on' : ' · payouts off'}
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        )}

        <Button type="button" className="w-full" disabled={busy} onClick={startOnboard}>
          {onboard.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Opening Stripe…
            </>
          ) : (
            <>
              Connect bank account
              <ExternalLink className="h-4 w-4" />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/auth', { replace: true })
          }}
          className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          Sign out
        </button>
      </div>
    </AuthLayout>
  )
}
