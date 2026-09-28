import { useState } from 'react'
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
  const urgency = insight.urgency || 'info'

  const config = {
    high: {
      border: 'border-rose-200 bg-rose-50/70 text-rose-950',
      badge: 'border-rose-300 bg-rose-100 text-rose-800',
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
    },
    medium: {
      border: 'border-amber-200 bg-amber-50/70 text-amber-950',
      badge: 'border-amber-300 bg-amber-100 text-amber-800',
      icon: Zap,
      iconColor: 'text-amber-600',
    },
    low: {
      border: 'border-sky-200 bg-sky-50/70 text-sky-950',
      badge: 'border-sky-300 bg-sky-100 text-sky-800',
      icon: Clock,
      iconColor: 'text-sky-600',
    },
    info: {
      border: 'border-emerald-200 bg-emerald-50/70 text-emerald-950',
      badge: 'border-emerald-300 bg-emerald-100 text-emerald-800',
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
    },
  }[urgency] || {
    border: 'border-slate-200 bg-slate-50 text-slate-900',
    badge: 'border-slate-300 bg-slate-100 text-slate-700',
    icon: Info,
    iconColor: 'text-slate-600',
  }

  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover:shadow-sm',
        config.border
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
              config.badge
            )}
          >
            <IconComponent className="h-3 w-3 shrink-0" />
            {urgency} urgency
          </span>

          {insight.metric_label && insight.metric_value && (
            <span className="text-xs font-semibold text-slate-700">
              {insight.metric_label}: <strong className="text-slate-900">{insight.metric_value}</strong>
            </span>
          )}
        </div>

        <h4 className="mt-2.5 text-sm font-semibold tracking-tight text-slate-900">
          {insight.title}
        </h4>

        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          {insight.description}
        </p>
      </div>

      {(insight.client_name || insight.invoice_number) && (
        <div className="mt-3 flex items-center gap-2 border-t border-slate-200/60 pt-2 text-[11px] text-slate-500">
          {insight.client_name && <span className="font-medium text-slate-700">{insight.client_name}</span>}
          {insight.client_name && insight.invoice_number && <span>•</span>}
          {insight.invoice_number && <span>{insight.invoice_number}</span>}
        </div>
      )}
    </motion.div>
  )
}

export function AIDailyBriefingCard() {
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
    setActiveActionId(action.id)
    try {
      const res = await executeAction.mutateAsync(action)
      const msg = res?.message || `AI recommendation executed: ${action.button_text}`
      showToast(msg)
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
      <div className="h-1.5 w-full bg-gradient-to-r from-green-300 via-green-400 to-emerald-500" />

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

          {/* AI Natural Language Briefing reading card */}
          <div className="space-y-4 lg:col-span-8 lg:pl-3">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-800">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Executive Intelligence Summary</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed font-normal text-slate-700">
                {briefing.executive_summary}
              </p>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                Behavioral Velocity & Risk Insights
              </h3>
              <span className="text-xs text-slate-400">
                {insights.length} insight{insights.length === 1 ? '' : 's'} identified
              </span>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
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
                  action.button_text?.toLowerCase().includes('whatsapp')

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
                              : 'bg-indigo-100 text-indigo-800'
                          )}
                        >
                          {action.badge || action.priority}
                        </span>

                        {action.amount != null && (
                          <span className="text-xs font-bold text-slate-900">
                            {formatCurrency(action.amount, { currency: action.currency || currency })}
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2 text-sm font-semibold text-slate-900">
                        {action.title}
                      </h4>

                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {action.description}
                      </p>

                      {(action.client_name || action.invoice_number) && (
                        <p className="mt-2 text-[11px] font-medium text-slate-600">
                          {action.client_name} {action.invoice_number ? `· ${action.invoice_number}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isLoadingThis || executeAction.isPending}
                        onClick={() => handleActionClick(action)}
                        className={cn(
                          'w-full shadow-sm font-semibold',
                          isWhatsApp
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : isCriticalAction
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        )}
                      >
                        {isLoadingThis ? (
                          <>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Dispatching…
                          </>
                        ) : (
                          <>
                            {isWhatsApp ? (
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
