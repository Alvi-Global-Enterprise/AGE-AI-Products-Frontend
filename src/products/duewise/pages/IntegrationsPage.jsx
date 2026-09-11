import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Puzzle, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import {
  useQuickBooksConnect,
  useQuickBooksCallback,
  useQuickBooksStatus,
  useQuickBooksDisconnect,
} from '@/products/duewise/hooks/useDuewise'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'

const INTEGRATIONS = [
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Sync invoices & customers via Intuit OAuth.',
    connectable: true,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Billing & payment methods.',
    connectable: false,
  },
]

function QuickBooksConnectButton({ isConnected }) {
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

/**
 * When Intuit redirects to /products/duewise/integrations?code=&realmId=&state=,
 * GET callback with those params — only if all three are present.
 */
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

export default function IntegrationsPage() {
  const { data: qbStatus, isLoading, refetch } = useQuickBooksStatus()
  const isConnected = Boolean(qbStatus?.is_connected)

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
              Connect accounting and billing so DueWise stays in sync with your source of truth.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        <QuickBooksOAuthCallbackHandler onSettled={() => refetch()} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-start justify-between gap-3 pt-5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                    <Badge
                      variant={
                        item.id === 'quickbooks' && isConnected
                          ? 'live'
                          : item.connectable
                            ? 'pending'
                            : 'default'
                      }
                      className="mt-2"
                    >
                      {item.id === 'quickbooks' && isLoading
                        ? 'Checking…'
                        : item.id === 'quickbooks' && isConnected
                          ? 'Connected'
                          : item.connectable
                            ? 'Ready to connect'
                            : 'Adapter ready'}
                    </Badge>
                  </div>
                  {item.id === 'quickbooks' ? (
                    isLoading ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                    ) : (
                      <QuickBooksConnectButton isConnected={isConnected} />
                    )
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      Soon
                    </Button>
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
