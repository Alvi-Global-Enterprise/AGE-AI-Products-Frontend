import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Puzzle,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Landmark,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import {
  useQuickBooksConnect,
  useQuickBooksCallback,
  useQuickBooksDisconnect,
} from '@/products/duewise/hooks/useDuewise'
import {
  useAccountsStatus,
  useStripeConnectOnboard,
  useStripeConnectLoginLink,
} from '@/modules/billing/hooks/useBilling'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { timeAgo } from '@/shared/lib/utils'

function QuickBooksConnectButton({ isConnected, onChanged }) {
  const connect = useQuickBooksConnect()
  const disconnect = useQuickBooksDisconnect()
  const [error, setError] = useState('')
  const busy = connect.isPending || disconnect.isPending

  if (isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="danger"
          disabled={busy}
          onClick={async (event) => {
            event.preventDefault()
            event.stopPropagation()
            setError('')
            try {
              await disconnect.mutateAsync()
              await onChanged?.()
            } catch (err) {
              setError(getUserMessage(AppError.fromUnknown(err)))
            }
          }}
        >
          {disconnect.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Disconnecting…
            </>
          ) : (
            'Disconnect'
          )}
        </Button>
        {error && <p className="max-w-[10rem] text-right text-[10px] text-rose-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={async (event) => {
          event.preventDefault()
          event.stopPropagation()
          setError('')
          try {
            const url = await connect.mutateAsync()
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.target = '_blank'
            anchor.rel = 'noopener noreferrer'
            anchor.referrerPolicy = 'no-referrer'
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()
          } catch (err) {
            setError(getUserMessage(AppError.fromUnknown(err)))
          }
        }}
      >
        {connect.isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Connecting…
          </>
        ) : (
          <>
            Connect
            <ExternalLink className="h-3.5 w-3.5" />
          </>
        )}
      </Button>
      {error && <p className="max-w-[10rem] text-right text-[10px] text-rose-600">{error}</p>}
    </div>
  )
}

function StripeConnectButton({ stripe, onChanged }) {
  const onboard = useStripeConnectOnboard()
  const loginLink = useStripeConnectLoginLink()
  const [error, setError] = useState('')
  const busy = onboard.isPending || loginLink.isPending
  const connected = Boolean(stripe?.connected)
  const payoutsOn = Boolean(stripe?.payouts_enabled)

  const openUrl = (url) => {
    if (!url) throw new AppError('No Stripe URL returned.')
    window.location.assign(url)
  }

  if (connected && payoutsOn) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={async (event) => {
            event.preventDefault()
            event.stopPropagation()
            setError('')
            try {
              const res = await loginLink.mutateAsync()
              openUrl(res?.url)
            } catch (err) {
              setError(getUserMessage(AppError.fromUnknown(err)))
            }
          }}
        >
          {loginLink.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Opening…
            </>
          ) : (
            <>
              Manage payouts
              <ExternalLink className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
        {error && <p className="max-w-[10rem] text-right text-[10px] text-rose-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={async (event) => {
          event.preventDefault()
          event.stopPropagation()
          setError('')
          try {
            const origin = window.location.origin
            const res = await onboard.mutateAsync({
              return_url: `${origin}/products/duewise/integrations?stripe=success`,
              refresh_url: `${origin}/products/duewise/integrations?stripe=refresh`,
            })
            await onChanged?.()
            openUrl(res?.url)
          } catch (err) {
            setError(getUserMessage(AppError.fromUnknown(err)))
          }
        }}
      >
        {onboard.isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Connecting…
          </>
        ) : (
          <>
            {connected ? 'Finish setup' : 'Connect bank'}
            <ExternalLink className="h-3.5 w-3.5" />
          </>
        )}
      </Button>
      {error && <p className="max-w-[10rem] text-right text-[10px] text-rose-600">{error}</p>}
    </div>
  )
}

const qbCallbackJobs = new Map()

function QuickBooksOAuthCallbackHandler({ onSettled }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const callback = useQuickBooksCallback()
  const [status, setStatus] = useState('')
  const [message, setMessage] = useState('')

  const code = searchParams.get('code')
  const realmId = searchParams.get('realmId')
  const state = searchParams.get('state')

  useEffect(() => {
    if (!code || !realmId || !state) return

    const key = `${code}:${realmId}:${state}`
    let cancelled = false

    setStatus('pending')
    setMessage('Finishing QuickBooks connection…')

    let job = qbCallbackJobs.get(key)
    if (!job) {
      job = callback.mutateAsync({ code, realmId, state })
      qbCallbackJobs.set(key, job)
    }

    job
      .then(async () => {
        await onSettled?.()
        if (cancelled) return
        setStatus('success')
        setMessage('QuickBooks connected successfully.')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setMessage(getUserMessage(AppError.fromUnknown(err)))
      })
      .finally(() => {
        if (cancelled) return
        const next = new URLSearchParams(searchParams)
        next.delete('code')
        next.delete('state')
        next.delete('realmId')
        setSearchParams(next, { replace: true })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, realmId, state])

  if (!status) return null

  return (
    <div
      className={
        status === 'error'
          ? 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'
          : status === 'success'
            ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
            : 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'
      }
    >
      <div className="flex items-center gap-2">
        {status === 'pending' && <Loader2 className="h-4 w-4 animate-spin" />}
        {status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        <span>{message}</span>
      </div>
    </div>
  )
}

function StripeReturnHandler({ onSettled }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const stripe = searchParams.get('stripe')

  useEffect(() => {
    if (stripe !== 'success' && stripe !== 'refresh') return
    let cancelled = false
    ;(async () => {
      await onSettled?.()
      if (cancelled) return
      const next = new URLSearchParams(searchParams)
      next.delete('stripe')
      setSearchParams(next, { replace: true })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe])

  return null
}

export default function IntegrationsPage() {
  const { data, isLoading, refetch, isFetching } = useAccountsStatus()
  const qb = data?.quickbooks
  const stripe = data?.stripe
  const summary = data?.summary
  const qbConnected = Boolean(qb?.is_connected ?? summary?.quickbooks_connected)
  const stripeConnected = Boolean(stripe?.connected ?? summary?.stripe_connected)
  const payoutsEnabled = Boolean(stripe?.payouts_enabled ?? summary?.payouts_enabled)

  const cards = [
    {
      id: 'quickbooks',
      name: 'QuickBooks Online',
      description: 'Sync invoices & customers via Intuit OAuth.',
      connected: qbConnected,
      detail: qbConnected
        ? [
            qb?.sync_status ? `Sync: ${qb.sync_status}` : null,
            qb?.last_synced_at ? `Last sync ${timeAgo(qb.last_synced_at)}` : null,
            qb?.realm_id ? `Realm ${qb.realm_id}` : null,
          ]
            .filter(Boolean)
            .join(' · ')
        : 'Not connected',
    },
    {
      id: 'stripe',
      name: 'Stripe Connect',
      description: 'Bank account for direct invoice payouts.',
      connected: stripeConnected && payoutsEnabled,
      detail: stripeConnected
        ? [
            payoutsEnabled ? 'Payouts enabled' : 'Payouts pending',
            stripe?.bank_name
              ? `${stripe.bank_name}${stripe.bank_last4 ? ` ••${stripe.bank_last4}` : ''}`
              : null,
            stripe?.charges_enabled ? 'Charges on' : null,
          ]
            .filter(Boolean)
            .join(' · ')
        : 'Bank account not connected',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Puzzle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Integrations</h1>
            <p className="text-sm text-slate-500">
              QuickBooks and Stripe Connect status from a single accounts overview.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        <QuickBooksOAuthCallbackHandler onSettled={() => refetch()} />
        <StripeReturnHandler onSettled={() => refetch()} />

        {(isLoading || isFetching) && !data && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading integrations…
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-start justify-between gap-3 pt-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {item.id === 'stripe' ? (
                        <Landmark className="h-4 w-4 text-slate-400" />
                      ) : null}
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                    <Badge variant={item.connected ? 'live' : 'pending'} className="mt-2">
                      {isLoading
                        ? 'Checking…'
                        : item.connected
                          ? 'Connected'
                          : 'Not connected'}
                    </Badge>
                    <p className="mt-2 text-[11px] text-slate-400">{item.detail}</p>
                  </div>
                  {item.id === 'quickbooks' ? (
                    isLoading ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                    ) : (
                      <QuickBooksConnectButton
                        isConnected={qbConnected}
                        onChanged={() => refetch()}
                      />
                    )
                  ) : isLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                  ) : (
                    <StripeConnectButton stripe={stripe} onChanged={() => refetch()} />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
