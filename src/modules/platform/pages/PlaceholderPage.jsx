import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  TrendingUp,
  Puzzle,
  Settings,
  GitBranch,
  CreditCard,
  Building2,
  Loader2,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { AIPaymentPrediction } from '@/products/duewise/components/dashboard/AIPaymentPrediction'
import { CashFlowChart } from '@/products/duewise/components/dashboard/CashFlowChart'
import { QuickBooksBanner } from '@/products/duewise/components/dashboard/QuickBooksBanner'
import { ChannelTracker } from '@/products/duewise/components/dashboard/ChannelTracker'
import {
  useQuickBooksConnect,
  useQuickBooksCallback,
  useQuickBooksStatus,
} from '@/products/duewise/hooks/useDuewise'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'

const PLACEHOLDERS = {
  insights: {
    title: 'AI Insights',
    description:
      'Payment propensity, risk scores, and recovery playbooks — evidence-logged for automation %.',
    Icon: Sparkles,
  },
  cashflow: {
    title: 'Cash Flow',
    description: '30-day forecast vs AI-optimized recovery path. Never invent a number.',
    Icon: TrendingUp,
  },
  integrations: {
    title: 'Integrations',
    description:
      'Shared adapter layer — accounting, channels, voice. Source of truth stays with the source.',
    Icon: Puzzle,
  },
  settings: {
    title: 'DueWise Settings',
    description: 'Client rules: do-not-contact, tone, escalation, approval-mode toggle.',
    Icon: Settings,
  },
  sequences: {
    title: 'Sequences',
    description:
      'Multi-step journeys with revalidation-before-dispatch, quiet hours, STOP, and approval gates.',
    Icon: GitBranch,
  },
  billing: {
    title: 'Platform Billing',
    description:
      'Subscriptions, performance fees from recorded outcomes, dunning, monthly statements. Billing ships first.',
    Icon: CreditCard,
  },
  'tenant-settings': {
    title: 'Tenant Settings',
    description: 'Roles, MFA, companies inside tenant, isolation boundary.',
    Icon: Building2,
  },
}

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
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS delivery adapter.',
    connectable: false,
  },
  {
    id: 'postmark',
    name: 'Postmark',
    description: 'Transactional email.',
    connectable: false,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'WhatsApp sequences.',
    connectable: false,
  },
  {
    id: 'retell',
    name: 'Retell',
    description: 'Voice collection calls.',
    connectable: false,
  },
]

function QuickBooksConnectButton({ isConnected }) {
  const connect = useQuickBooksConnect()
  const [error, setError] = useState('')

  if (isConnected) {
    return (
      <Badge variant="live" className="shrink-0">
        <CheckCircle2 className="h-3 w-3" />
        Connected
      </Badge>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        disabled={connect.isPending}
        onClick={async (event) => {
          event.preventDefault()
          event.stopPropagation()
          setError('')
          try {
            const url = await connect.mutateAsync()
            // Open ONLY via <a target="_blank"> — never window.open / location.*
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
 * When Intuit redirects to /app/integrations?code=…&realmId=…&state=…,
 * GET callback with those params — only if all three are present.
 * On success, status query is invalidated (Connect button hides when is_connected).
 */
const qbCallbackJobs = new Map()

function QuickBooksOAuthCallbackHandler({ onSettled }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const callback = useQuickBooksCallback()
  const [status, setStatus] = useState('') // '', 'pending', 'success', 'error'
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
        // Status API after callback — drives Connect show/hide
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

function IntegrationsSection() {
  const { data: qbStatus, isLoading, refetch } = useQuickBooksStatus()
  const isConnected = Boolean(qbStatus?.is_connected)

  return (
    <div className="space-y-4">
      <QuickBooksOAuthCallbackHandler onSettled={() => refetch()} />
      <QuickBooksBanner />
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
                ) : item.connectable ? (
                  <QuickBooksConnectButton isConnected={false} />
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
  )
}

export function PlaceholderPage({ type }) {
  const meta = PLACEHOLDERS[type] || PLACEHOLDERS.settings
  const Icon = meta.Icon

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {meta.title}
            </h1>
            <p className="text-sm text-slate-500">{meta.description}</p>
          </div>
        </div>
      </motion.div>

      {type === 'insights' && <AIPaymentPrediction />}
      {type === 'cashflow' && <CashFlowChart />}
      {type === 'sequences' && <ChannelTracker />}
      {type === 'integrations' && <IntegrationsSection />}
      {(type === 'settings' || type === 'tenant-settings') && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            {(type === 'settings'
              ? [
                  { label: 'Recovery fee rate', value: '15% of overdue recovered' },
                  { label: 'Approval mode', value: 'On · first 30 days' },
                  { label: 'Default channel ladder', value: 'WhatsApp → SMS → Email' },
                  { label: 'Quiet hours', value: '9pm–8am local' },
                ]
              : [
                  { label: 'Tenant ID', value: 'northstar-labs' },
                  { label: 'Billing mode', value: 'Stripe subscription + performance fee' },
                  { label: 'Operator hub', value: 'Karachi Ops' },
                  { label: 'MFA', value: 'Required on all company identities' },
                ]
            ).map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"
              >
                <p className="text-sm text-slate-600">{row.label}</p>
                <p className="text-sm font-medium text-slate-900">{row.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {type === 'billing' && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            {[
              { label: 'DueWise recovered (month)', value: '$87,420' },
              { label: 'Platform fee (15%)', value: '$13,113' },
              { label: 'Subscription tier', value: 'Growth · free first month used' },
              { label: 'Next statement', value: 'Apr 1, 2026' },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"
              >
                <p className="text-sm text-slate-600">{row.label}</p>
                <p className="text-sm font-medium text-slate-900">{row.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
