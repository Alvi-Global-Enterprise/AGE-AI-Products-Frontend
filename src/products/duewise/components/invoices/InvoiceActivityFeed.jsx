import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Mail,
  MessageCircle,
  MessageSquare,
  MousePointerClick,
  Reply,
  Send,
  CheckCheck,
  Eye,
  Loader2,
  Check,
  X,
  BadgeDollarSign,
  Clock,
  Sparkles,
  CheckCircle2,
  CreditCard,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { timeAgo, formatCurrency } from '@/shared/lib/utils'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { useInvoiceActivity } from '@/products/duewise/hooks/useDuewise'
import { cn } from '@/lib/utils'

const CHANNEL_META = {
  email: { label: 'Email', icon: Mail, accent: 'text-sky-700 bg-sky-50 ring-sky-200' },
  sms: { label: 'SMS', icon: MessageSquare, accent: 'text-violet-700 bg-violet-50 ring-violet-200' },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageCircle,
    accent: 'text-emerald-700 bg-emerald-50 ring-emerald-200',
  },
}

function formatWhen(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function resolveReminderProgress(item) {
  const status = String(item.status || '').toLowerCase()
  const isPaid = status === 'paid' || Boolean(item.paid_at) || Boolean(item.metadata?.paid_at)
  const isPendingApproval = status === 'pending_approval'
  const failed = status === 'failed' || status === 'bounced'

  // If this reminder resulted in payment, show "Paid" as the final milestone step
  const steps = isPaid
    ? [
        { key: 'delivered_at', id: 'delivered', label: 'Delivered', short: 'Delivered', icon: CheckCheck },
        { key: 'opened_at', id: 'opened', label: 'Opened', short: 'Opened', icon: Eye },
        { key: 'clicked_at', id: 'clicked', label: 'Clicked Link', short: 'Clicked', icon: MousePointerClick },
        { key: 'paid_at', id: 'paid', label: 'Paid & Settled', short: 'Paid', icon: BadgeDollarSign },
      ]
    : [
        { key: 'delivered_at', id: 'delivered', label: 'Delivered', short: 'Delivered', icon: CheckCheck },
        { key: 'opened_at', id: 'opened', label: 'Opened', short: 'Opened', icon: Eye },
        { key: 'clicked_at', id: 'clicked', label: 'Clicked Link', short: 'Clicked', icon: MousePointerClick },
        { key: 'replied_at', id: 'replied', label: 'Replied', short: 'Replied', icon: Reply },
      ]

  let lastCompleted = -1

  if (!isPendingApproval && !failed) {
    if (isPaid) {
      lastCompleted = 3 // All steps completed including payment!
    } else if (item.replied_at || status === 'replied') {
      lastCompleted = 3
    } else if (item.clicked_at || status === 'clicked' || item.metadata?.clicks?.length > 0) {
      lastCompleted = 2
    } else if (item.opened_at || status === 'opened') {
      lastCompleted = 1
    } else if (
      item.delivered_at ||
      status === 'delivered' ||
      status === 'sent' ||
      (item.sent_at && status !== 'pending' && status !== 'queued')
    ) {
      lastCompleted = 0
    }
  }

  let activeIndex = -1
  if (!failed && !isPendingApproval) {
    if (lastCompleted < steps.length - 1) {
      activeIndex = lastCompleted + 1
    } else {
      activeIndex = steps.length - 1
    }
  }

  return { steps, lastCompleted, activeIndex, failed, isPendingApproval, isPaid }
}

function progressRatio(lastCompleted, failed, stepCount) {
  const max = Math.max(stepCount - 1, 1)
  if (failed && lastCompleted < 0) return 0
  if (lastCompleted < 0) return 0
  if (lastCompleted >= stepCount - 1) return 1
  return (lastCompleted + 0.55) / max
}

function getReminderBadge(item) {
  const status = String(item.status || '').toLowerCase()
  const isPaid = status === 'paid' || Boolean(item.paid_at) || Boolean(item.metadata?.paid_at)

  // 1. Check if paid first!
  if (isPaid) {
    return {
      label: 'Paid / Settled',
      className: 'bg-emerald-50 text-emerald-800 ring-emerald-300 font-semibold',
      icon: CheckCircle2,
    }
  }

  if (status === 'pending_approval') {
    return {
      label: 'Pending Approval',
      className: 'bg-amber-50 text-amber-800 ring-amber-200/90',
      icon: Clock,
    }
  }
  if (status === 'failed' || status === 'bounced') {
    return {
      label: status === 'bounced' ? 'Bounced' : 'Failed',
      className: 'bg-rose-50 text-rose-700 ring-rose-200',
      icon: X,
    }
  }
  if (status === 'clicked' || item.clicked_at || item.metadata?.clicks?.length > 0) {
    return {
      label: 'Clicked Link',
      className: 'bg-teal-50 text-teal-800 ring-teal-200',
      icon: MousePointerClick,
    }
  }
  if (status === 'opened' || item.opened_at) {
    return {
      label: 'Opened',
      className: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
      icon: Eye,
    }
  }
  if (status === 'replied' || item.replied_at) {
    return {
      label: 'Replied',
      className: 'bg-teal-50 text-teal-700 ring-teal-200',
      icon: Reply,
    }
  }
  if (status === 'delivered') {
    return {
      label: 'Delivered',
      className: 'bg-sky-50 text-sky-700 ring-sky-200',
      icon: CheckCheck,
    }
  }
  if (status === 'sent') {
    return {
      label: 'Sent',
      className: 'bg-sky-50 text-sky-700 ring-sky-200',
      icon: Send,
    }
  }

  return {
    label: item.status ? item.status.replace(/_/g, ' ') : 'Queued',
    className: 'bg-slate-50 text-slate-700 ring-slate-200',
    icon: Clock,
  }
}

function ActivityTracker({ item, index, onPreviewEmail }) {
  const channel = CHANNEL_META[String(item.channel || '').toLowerCase()] || {
    label: item.channel || 'Channel',
    icon: Send,
    accent: 'text-slate-700 bg-slate-50 ring-slate-200',
  }
  const ChannelIcon = channel.icon
  const { steps, lastCompleted, activeIndex, failed, isPendingApproval, isPaid } =
    resolveReminderProgress(item)
  const fill = progressRatio(lastCompleted, failed, steps.length)
  const badge = getReminderBadge(item)
  const BadgeIcon = badge.icon

  // Metadata attributes
  const meta = item.metadata || {}
  const daysOverdue = meta.days_overdue
  const stage = meta.stage || meta.milestone_stage
  const clicks = meta.clicks || []
  const paidAt = item.paid_at || meta.paid_at
  const paymentMethod = item.payment_method || meta.payment_method
  const paymentAmount = item.payment_amount || meta.payment_amount

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'overflow-hidden rounded-2xl border bg-white shadow-2xs',
        isPaid ? 'border-emerald-300/90 ring-1 ring-emerald-200' : 'border-slate-200/80'
      )}
    >
      {/* Header bar */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5',
          isPaid ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-100 bg-slate-50/50'
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
              channel.accent
            )}
          >
            <ChannelIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{channel.label}</p>
              {stage && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 uppercase tracking-wide">
                  {stage.replace(/_/g, ' ')}
                </span>
              )}
              {daysOverdue !== undefined && (
                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                  {daysOverdue === 0 ? 'Due Today' : `${daysOverdue}D overdue`}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-slate-500">
              {item.subject ? item.subject : item.recipient || '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {item.sent_at && (
            <span className="hidden text-[11px] text-slate-400 sm:inline">
              {timeAgo(item.sent_at)}
            </span>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1',
              badge.className
            )}
          >
            <BadgeIcon className="h-3 w-3 shrink-0" />
            {badge.label}
          </span>
        </div>
      </div>

      {/* Main tracker body */}
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        {/* Paid Conversion Spotlight Box */}
        {isPaid && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200/90 bg-emerald-50/90 p-3.5 text-xs text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-200">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <div>
                <p className="font-semibold text-emerald-950">Payment Converted via this Reminder</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-emerald-800">
                  <span>Settled on {formatWhen(paidAt)}</span>
                  {paymentMethod && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100/90 px-1.5 py-0.2 text-[10px] font-semibold uppercase text-emerald-900">
                      <CreditCard className="h-2.5 w-2.5" />
                      {paymentMethod.replace(/_/g, ' ')}
                    </span>
                  )}
                  {paymentAmount && (
                    <span className="font-semibold text-emerald-950">
                      {formatCurrency(paymentAmount, { currency: item.currency || 'PKR' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-semibold text-white">
              Paid
            </span>
          </div>
        )}

        {isPendingApproval ? (
          <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-3.5 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-950">Pending Manual Approval</p>
                <p className="mt-0.5 text-amber-800">
                  This reminder was drafted by Smart AI and is queued waiting for your approval
                  before dispatch.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical base track */}
            <div
              className="absolute bottom-3 left-[17px] top-3 w-1 -translate-x-1/2 rounded-full bg-slate-200/90 sm:left-[19px]"
              aria-hidden
            />
            {/* Animated vertical progress fill */}
            <motion.div
              className={cn(
                'absolute left-[17px] top-3 w-1 origin-top -translate-x-1/2 rounded-full sm:left-[19px]',
                failed
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-b from-sky-400 via-emerald-400 to-emerald-600'
              )}
              initial={{ height: 0 }}
              animate={{ height: `calc((100% - 1.5rem) * ${fill})` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              aria-hidden
            />

            <ol className="relative z-10 space-y-1">
              {steps.map((step, stepIndex) => {
                const done = stepIndex <= lastCompleted
                const current = !failed && stepIndex === activeIndex && lastCompleted < steps.length - 1
                const upcoming = stepIndex > lastCompleted && !current
                const Icon = step.icon

                // Timestamps resolution
                let timestamp = null
                if (step.id === 'delivered') {
                  timestamp = item.delivered_at || (!isPendingApproval && !failed ? item.sent_at : null)
                } else if (step.id === 'opened') {
                  timestamp = item.opened_at
                } else if (step.id === 'clicked') {
                  timestamp = item.clicked_at || clicks[0]?.clicked_at
                } else if (step.id === 'paid') {
                  timestamp = paidAt
                } else if (step.id === 'replied') {
                  timestamp = item.replied_at
                }

                const isFailHere = failed && stepIndex === Math.max(lastCompleted, 0) && !done

                return (
                  <li key={step.id} className="flex items-start gap-3.5 py-3 first:pt-1 last:pb-1">
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: 0.15 + stepIndex * 0.05,
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }}
                      className={cn(
                        'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-white sm:h-10 sm:w-10',
                        done &&
                          'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-200',
                        current &&
                          'border-sky-500 text-sky-600 shadow-[0_0_0_4px_rgba(14,165,233,0.18)]',
                        upcoming && 'border-slate-200 text-slate-300',
                        isFailHere && 'border-rose-500 bg-rose-500 text-white'
                      )}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                      ) : isFailHere ? (
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <Icon
                          className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', current && 'animate-pulse')}
                        />
                      )}
                    </motion.div>

                    <div className="min-w-0 flex-1 pt-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            done && 'text-emerald-700',
                            current && 'text-sky-700',
                            upcoming && 'text-slate-400',
                            isFailHere && 'text-rose-600'
                          )}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {timestamp
                            ? formatWhen(timestamp)
                            : current
                              ? 'Awaiting…'
                              : upcoming
                                ? '—'
                                : ''}
                        </p>
                      </div>

                      {/* Extra info for clicked step */}
                      {step.id === 'clicked' && clicks.length > 0 && done && (
                        <p className="mt-0.5 text-[11px] text-emerald-700">
                          Payment link opened {clicks.length > 1 ? `(${clicks.length} times)` : ''}
                        </p>
                      )}

                      {/* Extra info for paid step */}
                      {step.id === 'paid' && done && (
                        <p className="mt-0.5 text-[11px] text-emerald-800 font-medium">
                          Completed online payment {paymentMethod ? `via ${paymentMethod.replace(/_/g, ' ')}` : ''}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {/* Footer actions / Metadata pills */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            {meta.tone && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                <Sparkles className="h-3 w-3 text-slate-400" />
                Tone: {meta.tone}
              </span>
            )}
            {meta.approved_at && (
              <span className="text-[11px] text-emerald-700">
                Approved {formatWhen(meta.approved_at)}
              </span>
            )}
          </div>

          {meta.html && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onPreviewEmail(meta.html, item.subject)}
            >
              <Eye className="mr-1 h-3 w-3" />
              Preview Message
            </Button>
          )}
        </div>
      </div>
    </motion.li>
  )
}

export function InvoiceActivityFeed({
  invoiceId,
  invoiceStatus,
  paidAt,
  embedded = false,
  enabled = true,
}) {
  const [previewData, setPreviewData] = useState(null)

  const { data: items = [], isLoading, isError, error, refetch, isFetching } =
    useInvoiceActivity(invoiceId, { enabled: Boolean(invoiceId) && enabled })

  // Check if invoice or any reminder activity converted to paid
  const paidActivity = Array.isArray(items)
    ? items.find((a) => a.status === 'paid' || Boolean(a.paid_at) || Boolean(a.metadata?.paid_at))
    : null

  const isInvoiceSettled =
    String(invoiceStatus || '').toLowerCase() === 'paid' || Boolean(paidActivity)
  const settlementTimestamp = paidAt || paidActivity?.paid_at || paidActivity?.metadata?.paid_at
  const settlementMethod = paidActivity?.payment_method || paidActivity?.metadata?.payment_method

  const body = (
    <>
      <div
        className={cn(
          'flex items-start justify-between gap-3',
          !embedded && 'border-b border-slate-100 px-5 py-4'
        )}
      >
        <div className="flex items-center gap-2">
          {!embedded && <Activity className="h-4 w-4 text-slate-400" />}
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {embedded ? 'Delivery pipeline' : 'Activity tracking'}
            </p>
            <p className="text-xs text-slate-500">
              Delivered → Opened → Clicked → Paid (Individual reminder audit)
            </p>
          </div>
        </div>
        {!isLoading && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Refresh
          </Button>
        )}
      </div>

      <div className={cn('space-y-4', !embedded && 'px-4 py-4 sm:px-5', embedded && 'mt-4')}>
        {/* Overall Invoice Payment Banner */}
        {isInvoiceSettled && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <BadgeDollarSign className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-emerald-950">Invoice Status: Paid</p>
                <p className="text-emerald-700">
                  {settlementTimestamp
                    ? `Payment confirmed on ${formatWhen(settlementTimestamp)}${settlementMethod ? ` via ${settlementMethod.replace(/_/g, ' ')}` : ''}.`
                    : 'This invoice has been settled in full.'}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
              Settled
            </span>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
            <p>{getUserMessage(error)}</p>
            <button
              type="button"
              className="mt-2 text-xs font-medium underline"
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No activity yet for this invoice.
          </p>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <ul className="space-y-4">
            {items.map((item, i) => (
              <ActivityTracker
                key={item.id || item.tracking_token || i}
                item={item}
                index={i}
                onPreviewEmail={(html, subject) => setPreviewData({ html, subject })}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Email Preview Modal */}
      <Modal
        open={Boolean(previewData)}
        onClose={() => setPreviewData(null)}
        title={previewData?.subject || 'Email Reminder Preview'}
        description="Exact email template delivered to the client"
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
          {previewData?.html && (
            <iframe
              title="Email preview"
              srcDoc={previewData.html}
              className="h-[550px] w-full rounded-lg border-0 bg-white"
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </Modal>
    </>
  )

  if (embedded) return <div>{body}</div>

  return (
    <Card>
      <CardContent className="p-0">{body}</CardContent>
    </Card>
  )
}
