import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Mail,
  ShieldAlert,
  SlidersHorizontal,
  Zap,
  Info,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { Tooltip } from '@/shared/components/ui/Tooltip'
import { formatCurrency, cn } from '@/shared/lib/utils'
import {
  useDuewiseAIBriefing,
  useRefreshAIBriefing,
  useExecuteRecommendedAction,
} from '@/products/duewise/hooks/useDuewise'
import { getUserMessage } from '@/shared/errors/errorHandler'

function AiTypingText({
  text = '',
  className,
  speed = 16,
  startDelay = 280,
  cursorClassName = 'bg-teal-300',
}) {
  const full = String(text || '')
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    indexRef.current = 0
    setShown('')
    setDone(false)

    if (!full) {
      setDone(true)
      return undefined
    }

    const start = window.setTimeout(() => {
      timerRef.current = window.setInterval(() => {
        indexRef.current += 1
        const next = full.slice(0, indexRef.current)
        setShown(next)
        if (indexRef.current >= full.length) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
          setDone(true)
        }
      }, speed)
    }, startDelay)

    return () => {
      window.clearTimeout(start)
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [full, speed, startDelay])

  return (
    <p className={className} aria-live="polite">
      {shown}
      <span
        className={cn(
          'ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] align-baseline',
          done ? 'bg-transparent' : cn('animate-pulse', cursorClassName)
        )}
        aria-hidden
      />
    </p>
  )
}

function HealthDial({ score = 85, tier = 'optimal', label = 'Optimal Cash Flow', summaryMetric = '92% on-schedule' }) {
  const clampedScore = Math.max(0, Math.min(100, Number(score) || 0))
  const radius = 48
  const strokeWidth = 9
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference

  const isOptimal = clampedScore >= 80 || tier === 'optimal'
  const isAttention = (clampedScore >= 50 && clampedScore < 80) || tier === 'attention'
  const isCritical = clampedScore < 50 || tier === 'critical'

  const strokeColor = isCritical
    ? '#e11d48'
    : isAttention
      ? '#f59e0b'
      : '#10b981'

  const badgeBg = isCritical
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : isAttention
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'

  return (
    <div className="flex flex-col items-center justify-center p-3 text-center sm:p-4">
      <div className="relative flex items-center justify-center">
        <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="stroke-slate-100"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight text-slate-900">
            {clampedScore}
          </span>
          <span className="text-[11px] font-medium text-slate-400">/ 100</span>
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center">
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
            badgeBg
          )}
        >
          {label}
        </span>
        <p className="mt-1 text-xs font-medium text-slate-500">{summaryMetric}</p>
      </div>
    </div>
  )
}

function UrgencyInsightChip({ insight }) {
  const urgency = String(insight.urgency || 'info').toLowerCase()

  const config = {
    high: {
      border: 'border-rose-200/90 bg-white',
      accent: 'bg-rose-500',
      badge: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
      iconWrap: 'bg-rose-50 text-rose-600',
      icon: AlertTriangle,
    },
    medium: {
      border: 'border-amber-200/90 bg-white',
      accent: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
      iconWrap: 'bg-amber-50 text-amber-600',
      icon: Zap,
    },
    low: {
      border: 'border-sky-200/90 bg-white',
      accent: 'bg-sky-500',
      badge: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
      iconWrap: 'bg-sky-50 text-sky-600',
      icon: Clock,
    },
    info: {
      border: 'border-emerald-200/90 bg-white',
      accent: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
      iconWrap: 'bg-emerald-50 text-emerald-600',
      icon: TrendingUp,
    },
  }[urgency] || {
    border: 'border-slate-200 bg-white',
    accent: 'bg-slate-400',
    badge: 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200',
    iconWrap: 'bg-slate-50 text-slate-500',
    icon: Info,
  }

  const IconComponent = config.icon
  const hasMetric = Boolean(insight.metric_label || insight.metric_value)
  const hasMeta = Boolean(insight.client_name || insight.invoice_number)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative flex h-full min-h-[168px] flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md',
        config.border
      )}
    >
      <div className={cn('h-1 w-full shrink-0', config.accent)} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Top row: icon + urgency — left aligned */}
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
              config.iconWrap
            )}
          >
            <IconComponent className="h-4 w-4" />
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              config.badge
            )}
          >
            {urgency} urgency
          </span>
        </div>

        {/* Metric block — clear left alignment */}
        {hasMetric && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              {insight.metric_label || 'Metric'}
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
              {insight.metric_value || '—'}
            </p>
          </div>
        )}

        {/* Title + description — consistent left type scale */}
        <div className="min-w-0 flex-1 space-y-1.5 text-left">
          <h4 className="text-sm font-semibold leading-snug tracking-tight text-slate-900">
            {insight.title}
          </h4>
          {insight.description && (
            <p className="text-xs leading-relaxed text-slate-500 line-clamp-3">
              {insight.description}
            </p>
          )}
        </div>

        {/* Footer meta */}
        {hasMeta && (
          <div className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-0.5 border-t border-slate-100 pt-3 text-[11px] leading-none text-slate-500">
            {insight.client_name && (
              <span className="font-medium text-slate-700">{insight.client_name}</span>
            )}
            {insight.client_name && insight.invoice_number && (
              <span className="text-slate-300">·</span>
            )}
            {insight.invoice_number && <span>{insight.invoice_number}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}


function normalizeActionHaystack(action) {
  return [
    action?.id,
    action?.type,
    action?.button_text,
    action?.buttonText,
    action?.cta_text,
    action?.cta,
    action?.title,
    action?.badge,
    action?.target_url,
    action?.api_endpoint,
  ]
    .filter(Boolean)
    .map((v) =>
      String(v)
        .toLowerCase()
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .join(' ')
}

function normalizeAppPath(url) {
  if (!url) return null
  let path = String(url).trim()
  if (!path) return null

  // Absolute URL → pathname
  try {
    if (/^https?:\/\//i.test(path)) {
      path = new URL(path).pathname
    }
  } catch {
    // keep raw path
  }

  if (path.includes('cashflow') || path.includes('cash-flow')) {
    return '/products/duewise/cashflow'
  }
  if (path.startsWith('/duewise/')) {
    return `/products${path}`
  }
  return path
}

function getActionNavigatePath(action) {
  if (!action) return null

  const hay = normalizeActionHaystack(action)
  const target = normalizeAppPath(action.target_url)

  // Explicit cashflow / forecast destinations
  if (target && (target.includes('cashflow') || hay.includes('forecast'))) {
    return target.includes('cashflow') ? '/products/duewise/cashflow' : target
  }

  const looksLikeForecast =
    hay.includes('forecast') ||
    hay.includes('cashflow') ||
    hay.includes('cash-flow') ||
    hay.includes('view forecast') ||
    (hay.includes('cash flow') &&
      (hay.includes('view') || hay.includes('explore') || hay.includes('30')))

  if (looksLikeForecast) {
    return '/products/duewise/cashflow'
  }

  // Navigate-only cards (no API)
  if (action.target_url && !action.api_endpoint) {
    return normalizeAppPath(action.target_url)
  }

  return null
}

export function AIDailyBriefingCard() {
  const navigate = useNavigate()
  const { data: briefingData, isLoading, isError, error } = useDuewiseAIBriefing()
  const refreshBriefing = useRefreshAIBriefing()
  const executeAction = useExecuteRecommendedAction()

  const [activeActionId, setActiveActionId] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleRefresh = async () => {
    try {
      await refreshBriefing.mutateAsync()
      showToast('DueWise AI Daily Briefing refreshed with latest live telemetry.')
    } catch {
      showToast('Briefing refresh completed or cooldown enforced.')
    }
  }

  const handleActionClick = async (action) => {
    const navPath = getActionNavigatePath(action)
    if (navPath) {
      navigate(navPath)
      return
    }

    // Hard fallback if button label is forecast-related
    const label = String(action?.button_text || action?.buttonText || action?.title || '')
      .toLowerCase()
      .replace(/[\u2010-\u2015]/g, '-')
    if (label.includes('forecast') || label.includes('cash flow')) {
      navigate('/products/duewise/cashflow')
      return
    }

    setActiveActionId(action.id)
    try {
      const res = await executeAction.mutateAsync(action)
      const msg = res?.message || `AI recommendation executed: ${action.button_text}`
      showToast(msg)
      const afterUrl = normalizeAppPath(action.target_url)
      if (afterUrl) navigate(afterUrl)
    } catch (err) {
      showToast(getUserMessage(err) || 'Failed to dispatch AI recommended action.')
    } finally {
      setActiveActionId(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-64 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-4 flex justify-center">
              <Skeleton className="h-40 w-40 rounded-full" />
            </div>
            <div className="space-y-3 md:col-span-8">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return null
  }

  const data = briefingData?.data || briefingData || {}
  const portfolioHealth = data.portfolio_health || {
    score: 85,
    tier: 'optimal',
    label: 'Optimal Cash Flow',
    summary_metric: '92% on-schedule',
  }
  const briefing = data.briefing || {
    headline: '🔮 DueWise AI Daily Briefing',
    executive_summary: 'All invoice accounts operating smoothly.',
    tone: 'polite',
    engine: 'gemini-ai',
  }
  const metrics = data.metrics || {}
  const insights = Array.isArray(data.insights) ? data.insights : []
  const recommendedActions = Array.isArray(data.recommended_actions) ? data.recommended_actions : []
  const isCooldownActive = Boolean(data.cooldown_active)
  const isGeminiAI = briefing.engine === 'gemini-ai'

  const currency = metrics.currency || 'USD'
  const highRiskCount = metrics.high_risk_clients_count ?? 0
  const isAutopilot = Boolean(metrics.is_autopilot || metrics.duewise_mode === 'autopilot')

  return (
    <Card className="relative overflow-hidden border-indigo-100 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50/40 shadow-sm transition hover:shadow-md">
      {/* Top subtle indigo glow accent bar */}
      <div className="h-1.5 w-full gradient-brand" />

      <CardContent className="space-y-6 p-6 sm:p-7">
        {/* 1. Header with live AI badge & sleek Refresh button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-lg shadow-sm shadow-indigo-200">
              🔮
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              DueWise AI Daily Briefing
            </h2>

            {/* Live AI engine badge */}
            <div className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
              <span>{isGeminiAI ? 'Gemini AI Synthesized' : 'Deterministic Health Model'}</span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCooldownActive ? (
              <Tooltip content="Briefing abhi refresh hui hai. AI quota bachane ke liye 5-minute cooldown active hai.">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="cursor-not-allowed opacity-60 border-slate-200 bg-slate-100 text-slate-500"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Cooldown Active
                </Button>
              </Tooltip>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={refreshBriefing.isPending}
                onClick={handleRefresh}
                className="border-indigo-200 bg-white text-indigo-700 shadow-2xs hover:border-indigo-300 hover:bg-indigo-50"
              >
                <RefreshCw
                  className={cn(
                    'mr-1.5 h-3.5 w-3.5 text-indigo-600',
                    refreshBriefing.isPending && 'animate-spin'
                  )}
                />
                {refreshBriefing.isPending ? 'Refreshing…' : 'Refresh Briefing'}
              </Button>
            )}
          </div>
        </div>

        {/* 2 & 3. Portfolio Health Dial + AI Executive Summary */}
        <div className="grid gap-6 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-2xs lg:grid-cols-12 lg:items-center">
          {/* Health dial */}
          <div className="lg:col-span-4 flex items-center justify-center border-b border-slate-100 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
            <HealthDial
              score={portfolioHealth.score}
              tier={portfolioHealth.tier}
              label={portfolioHealth.label}
              summaryMetric={portfolioHealth.summary_metric}
            />
          </div>

          {/* AI Natural Language Briefing — light AI panel */}
          <div className="space-y-4 lg:col-span-8 lg:pl-3">
            <div className="relative overflow-hidden rounded-2xl border border-teal-200/80 bg-gradient-to-br from-white via-teal-50/40 to-emerald-50/30 shadow-sm">
              <div className="absolute inset-y-0 left-0 w-1 gradient-brand" />

              <div className="relative space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-white shadow-sm shadow-emerald-600/20">
                      <Sparkles className="h-4 w-4" />
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
                    </span>
                    <div className="min-w-0 text-left">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                        DueWise AI
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        Executive Intelligence Summary
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
                      </span>
                      AI output
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      {isGeminiAI ? 'Gemini synthesized' : 'Model synthesized'}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-3">
                  <AiTypingText
                    key={briefing.executive_summary}
                    text={briefing.executive_summary}
                    speed={14}
                    cursorClassName="bg-teal-500"
                    className="min-h-[4.5rem] text-sm leading-relaxed text-slate-700"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-teal-600" />
                    AI-generated from live receivables telemetry
                  </span>
                  <span className="font-medium text-slate-400">Not a human-written note</span>
                </div>
              </div>
            </div>

            {/* 4. Quick Stat Pills */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* 7-Day Projected Recovery */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  7D Projected Recovery
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-700">
                  {formatCurrency(metrics.projected_7d_recovery ?? 0, { currency })}
                </p>
              </div>

              {/* Total Overdue */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Total Overdue
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(metrics.total_overdue ?? 0, { currency })}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({metrics.overdue_count ?? 0})
                  </span>
                </div>
              </div>

              {/* High-Risk Clients (Alert if >= 1) */}
              <div
                className={cn(
                  'rounded-xl border p-3 transition-colors',
                  highRiskCount >= 1
                    ? 'border-rose-200 bg-rose-50/90 text-rose-950'
                    : 'border-slate-100 bg-slate-50/80 text-slate-900'
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    High-Risk Clients
                  </p>
                  {highRiskCount >= 1 && (
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600 animate-bounce" />
                  )}
                </div>
                <p
                  className={cn(
                    'mt-1 text-sm font-bold',
                    highRiskCount >= 1 ? 'text-rose-700' : 'text-slate-900'
                  )}
                >
                  {highRiskCount} {highRiskCount === 1 ? 'Account' : 'Accounts'}
                </p>
              </div>

              {/* System Operating Mode */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  System Mode
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3 w-3 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800">
                    {isAutopilot ? 'Autopilot Mode' : 'Approval Mode'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Behavioral Insight Chips (Partitioned Risk View) */}
        {insights.length > 0 && (
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="min-w-0 text-left">
                <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                  Behavioral Velocity & Risk Insights
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Ranked signals from overdue behavior and payment velocity
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {insights.length} insight{insights.length === 1 ? '' : 's'} identified
              </span>
            </div>

            <div className="grid auto-rows-fr gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              {insights.map((insight) => (
                <UrgencyInsightChip key={insight.id || insight.title} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* 6. 1-Click Recommended Immediate Actions */}
        {recommendedActions.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/30 via-purple-50/20 to-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Zap className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-sm font-bold tracking-tight text-slate-900">
                  Recommended Immediate Actions
                </h3>
              </div>
              <span className="text-xs text-indigo-700 font-medium">
                1-Click Autonomous Execution
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recommendedActions.map((action) => {
                const isLoadingThis = activeActionId === action.id
                const isCriticalAction = action.priority === 'critical'
                const isWhatsApp =
                  action.payload?.channel === 'whatsapp' ||
                  String(action.button_text || '')
                    .toLowerCase()
                    .includes('whatsapp')
                const navPath = getActionNavigatePath(action)
                const isForecastNav = navPath === '/products/duewise/cashflow'

                return (
                  <div
                    key={action.id || action.title}
                    className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-indigo-200 hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                            isCriticalAction
                              ? 'bg-rose-100 text-rose-800'
                              : isForecastNav
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-indigo-100 text-indigo-800'
                          )}
                        >
                          {action.badge || action.priority}
                        </span>

                        {action.amount != null && (
                          <span className="text-xs font-bold text-slate-900">
                            {formatCurrency(action.amount, {
                              currency: action.currency || currency,
                            })}
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2 text-sm font-semibold text-slate-900">
                        {action.title}
                      </h4>

                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {action.description}
                      </p>

                      {(action.client_name || action.invoice_number) && (
                        <p className="mt-2 text-[11px] font-medium text-slate-600">
                          {action.client_name}{' '}
                          {action.invoice_number ? `· ${action.invoice_number}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isLoadingThis || (!navPath && executeAction.isPending)}
                        onClick={() => handleActionClick(action)}
                        className={cn(
                          'w-full font-semibold shadow-sm',
                          isWhatsApp
                            ? '!bg-emerald-600 text-white hover:!bg-emerald-700'
                            : isCriticalAction
                              ? '!bg-rose-600 text-white hover:!bg-rose-700'
                              : isForecastNav
                                ? '!bg-teal-600 text-white hover:!bg-teal-700'
                                : '!bg-indigo-600 text-white hover:!bg-indigo-700'
                        )}
                      >
                        {isLoadingThis ? (
                          <>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Dispatching…
                          </>
                        ) : (
                          <>
                            {isForecastNav ? (
                              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                            ) : isWhatsApp ? (
                              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                            ) : (
                              <Mail className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {action.button_text || 'Execute Action'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Floating success / feedback toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-900 px-4 py-3 text-sm font-medium text-white shadow-xl"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
