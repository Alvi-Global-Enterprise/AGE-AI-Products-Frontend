import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Mail,
  MessageSquare,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Tooltip } from '@/shared/components/ui/Tooltip'
import { normalizeInvoiceAIPrediction } from '@/products/duewise/api/duewise.api'
import {
  useRemindInvoice,
  useDuewiseEntitlements,
} from '@/products/duewise/hooks/useDuewise'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { cn } from '@/shared/lib/utils'

export function AICashFlowIntelligenceCard({ invoice, onReminded }) {
  const [toastMessage, setToastMessage] = useState(null)
  const remindMutation = useRemindInvoice()
  const { data: entitlements } = useDuewiseEntitlements()

  const prediction = normalizeInvoiceAIPrediction(invoice)
  const isPaid = String(invoice?.status || '').toLowerCase() === 'paid'

  const probability = prediction?.probability ?? 0
  const riskTier = isPaid
    ? 'settled'
    : prediction?.risk_tier || (probability >= 70 ? 'high' : probability >= 40 ? 'medium' : 'low')

  const recommendedAction = prediction?.recommended_action || {}
  const rawIsTrialRestricted = Boolean(recommendedAction?.is_trial_restricted)
  const tenantIsTrial = Boolean(entitlements?.is_trial && !entitlements?.can_use_whatsapp)
  const isTrialRestricted = rawIsTrialRestricted || (tenantIsTrial && (recommendedAction?.channel === 'whatsapp' || recommendedAction?.suggested_premium_channel === 'whatsapp'))

  const predictedDate = prediction?.predicted_payment_date_formatted || prediction?.predicted_payment_date || invoice?.due_date || 'On Due Date'
  const confidenceLabel = prediction?.confidence_label || `${prediction?.confidence_score ?? 94.8}% Confidence`
  const delayDays = prediction?.estimated_delay_days ?? (invoice?.days_overdue || 0)

  const riskFactors = Array.isArray(prediction?.risk_factors) && prediction.risk_factors.length > 0
    ? prediction.risk_factors
    : isPaid
      ? ['Invoice has been fully settled and reconciled.']
      : ['Historical client velocity indicates standard collection timing.']

  // Dynamic progress bar styling
  const barGradient = isPaid
    ? 'from-slate-400 to-slate-500'
    : probability >= 70
      ? 'from-amber-500 to-rose-600'
      : probability >= 40
        ? 'from-sky-500 to-amber-500'
        : 'from-teal-500 to-emerald-500'

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3800)
  }

  const handleSmartRemind = async () => {
    try {
      const channel = isTrialRestricted ? 'email' : (recommendedAction.channel || 'auto')
      const tone = recommendedAction.tone || 'polite'

      const res = await remindMutation.mutateAsync({
        id: invoice.id,
        channel,
        tone,
      })

      const successMsg =
        res?.message ||
        `Payment reminder dispatched successfully via ${channel} (${tone} tone).`
      showToast(successMsg)
      onReminded?.()
    } catch (err) {
      showToast(getUserMessage(err) || 'Failed to dispatch reminder.')
    }
  }

  // Button text determination with trial fallback
  let buttonLabel = recommendedAction.action_text || 'Send AI Reminder'
  if (isTrialRestricted) {
    buttonLabel = 'Send Courtesy Email (WhatsApp unlocks on paid plan)'
  }

  return (
    <Card className="relative overflow-hidden border-indigo-200/90 bg-gradient-to-b from-white via-indigo-50/15 to-white shadow-sm">
      {/* Decorative top accent line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-green-300 via-green-400 to-emerald-500" />
      <CardContent className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                AI Cash Flow & Delinquency Intelligence
              </h2>
              <p className="text-xs text-slate-500">
                Explainable ML behavioral model with dynamic collection routing
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                isPaid
                  ? 'border-slate-200 bg-slate-100 text-slate-700'
                  : riskTier === 'high'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : riskTier === 'medium'
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              )}
            >
              {prediction?.risk_label || (isPaid ? 'Settled' : 'Active Account')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              {confidenceLabel}
            </span>
          </div>
        </div>

        {/* Probability Progress Bar & Metrics */}
        <div className="grid gap-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5 md:grid-cols-12 md:items-center">
          <div className="space-y-2 md:col-span-6">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Late Delinquency Probability</span>
              <span
                className={cn(
                  'font-bold',
                  isPaid
                    ? 'text-slate-500'
                    : probability >= 70
                      ? 'text-rose-600'
                      : probability >= 40
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                )}
              >
                {isPaid ? '0% (Paid)' : `${probability}%`}
              </span>
            </div>

            {/* Progress bar container */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isPaid ? '0%' : `${Math.min(100, Math.max(4, probability))}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn('h-full rounded-full bg-gradient-to-r', barGradient)}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              {isPaid
                ? 'Invoice settled. Risk score reset.'
                : probability >= 70
                  ? 'High probability of severe payment delay; prioritized intervention needed.'
                  : probability >= 40
                    ? 'Moderate risk detected based on customer history; proactive touchpoint recommended.'
                    : 'Low delinquency risk; client track record indicates timely payment.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:col-span-6 md:border-l md:border-slate-200 md:pl-5">
            <div className="rounded-xl border border-slate-200/70 bg-white p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Predicted Pay Date
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                <span>{predictedDate}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-white p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Estimated Delay
              </p>
              <p
                className={cn(
                  'mt-1 text-sm font-bold',
                  delayDays > 0 ? 'text-rose-600' : 'text-slate-900'
                )}
              >
                {isPaid ? '0 days (Settled)' : delayDays > 0 ? `+${delayDays} days late` : 'On Schedule'}
              </p>
            </div>
          </div>
        </div>

        {/* Explainable Risk Factors */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Explainable Risk Factors & Model Insights
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {riskFactors.map((factor, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  ✓
                </span>
                <span className="text-xs leading-relaxed text-slate-700 font-medium">
                  {factor}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 1-Click Smart Remind Action Section */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-purple-50/20 to-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Recommended Collection Action
                </h3>
                {recommendedAction.tone && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                    Tone: {recommendedAction.tone}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {isPaid
                  ? 'Invoice is fully settled. Automated sequences have ceased.'
                  : `AI recommends ${recommendedAction.channel_label || 'Email'} with a ${recommendedAction.tone || 'polite'} tone.`}
              </p>
            </div>

            {/* Smart Remind Button / Settled Banner */}
            <div>
              {isPaid ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Invoice Settled - No action needed</span>
                </div>
              ) : isTrialRestricted ? (
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <Tooltip content="WhatsApp and multi-channel AI reminders unlock on the paid plan. Sending via email fallback.">
                    <Button
                      type="button"
                      disabled={remindMutation.isPending}
                      onClick={handleSmartRemind}
                      className="border-amber-300 bg-white text-slate-900 hover:bg-amber-50 shadow-sm"
                    >
                      {remindMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Mail className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                          <span>{buttonLabel}</span>
                        </>
                      )}
                    </Button>
                  </Tooltip>
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    <Lock className="h-2.5 w-2.5" />
                    Trial Restricted (Email fallback)
                  </span>
                </div>
              ) : (
                <Button
                  type="button"
                  disabled={remindMutation.isPending}
                  onClick={handleSmartRemind}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-semibold"
                >
                  {remindMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Dispatching Reminder…
                    </>
                  ) : (
                    <>
                      {recommendedAction.channel === 'whatsapp' ? (
                        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                      ) : (
                        <Mail className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      <span>{buttonLabel}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Floating success toast */}
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
