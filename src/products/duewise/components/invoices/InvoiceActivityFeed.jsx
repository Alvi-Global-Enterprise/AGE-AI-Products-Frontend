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
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { Button } from '@/shared/components/ui/Button'
import { timeAgo } from '@/shared/lib/utils'
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

/** Fixed delivery pipeline — starts at Delivered; final step becomes Paid when invoice is paid. */
const STEPS = [
  { key: 'delivered_at', id: 'delivered', label: 'Delivered', short: 'Delivered', icon: CheckCheck },
  { key: 'opened_at', id: 'opened', label: 'Opened', short: 'Opened', icon: Eye },
  {
    key: 'clicked_at',
    id: 'clicked',
    label: 'Clicked',
    short: 'Clicked',
    icon: MousePointerClick,
  },
  { key: 'replied_at', id: 'final', label: 'Replied', short: 'Replied', icon: Reply },
]

const PAID_STEP = {
  key: 'paid_at',
  id: 'paid',
  label: 'Paid',
  short: 'Paid',
  icon: BadgeDollarSign,
}

const STATUS_STEP_INDEX = {
  pending: -1,
  queued: -1,
  sent: -1,
  delivered: 0,
  opened: 1,
  clicked: 2,
  replied: 3,
  paid: 3,
  failed: -1,
  bounced: -1,
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

function buildSteps(invoicePaid) {
  if (!invoicePaid) return STEPS
  return [...STEPS.slice(0, 3), PAID_STEP]
}

function resolveProgress(item, invoicePaid) {
  const steps = buildSteps(invoicePaid)
  const status = String(item.status || '').toLowerCase()
  const failed = status === 'failed' || status === 'bounced'

  let lastCompleted = -1
  steps.forEach((step, i) => {
    const hasTs =
      item[step.key] || (step.id === 'delivered' && item.sent_at)
    if (hasTs) lastCompleted = i
  })

  const fromStatus = STATUS_STEP_INDEX[status]
  if (typeof fromStatus === 'number' && fromStatus > lastCompleted) {
    lastCompleted = fromStatus
  }

  if (invoicePaid) {
    lastCompleted = steps.length - 1
  }

  let activeIndex = lastCompleted + 1
  if (lastCompleted >= steps.length - 1) activeIndex = steps.length - 1
  if (failed) activeIndex = Math.max(lastCompleted, 0)

  return { steps, lastCompleted, activeIndex, failed }
}

function progressRatio(lastCompleted, failed, stepCount) {
  const max = Math.max(stepCount - 1, 1)
  if (failed && lastCompleted < 0) return 0
  if (lastCompleted < 0) return 0
  if (lastCompleted >= stepCount - 1) return 1
  return (lastCompleted + (failed ? 0 : 0.55)) / max
}

function ActivityTracker({ item, index, invoicePaid, paidAt }) {
  const channel = CHANNEL_META[String(item.channel || '').toLowerCase()] || {
    label: item.channel || 'Channel',
    icon: Send,
    accent: 'text-slate-700 bg-slate-50 ring-slate-200',
  }
  const ChannelIcon = channel.icon
  const { steps, lastCompleted, activeIndex, failed } = resolveProgress(item, invoicePaid)
  const fill = progressRatio(lastCompleted, failed, steps.length)
  const statusLabel = failed
    ? String(item.status)
    : invoicePaid
      ? 'Paid'
      : lastCompleted >= steps.length - 1
        ? 'Complete'
        : steps[Math.max(activeIndex, 0)]?.label || item.status

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
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
            <p className="text-sm font-semibold text-slate-900">{channel.label}</p>
            <p className="truncate text-xs text-slate-500">{item.recipient || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.sent_at && (
            <span className="hidden text-[11px] text-slate-400 sm:inline">{timeAgo(item.sent_at)}</span>
          )}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
              failed
                ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                : invoicePaid || lastCompleted >= steps.length - 1
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
            )}
          >
            {failed && <X className="mr-1 h-3 w-3" />}
            {!failed && (invoicePaid || lastCompleted >= steps.length - 1) && (
              <Check className="mr-1 h-3 w-3" />
            )}
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
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
                ? 'bg-gradient-to-b from-rose-400 to-rose-500'
                : invoicePaid
                  ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-500'
                  : 'bg-gradient-to-b from-emerald-400 via-teal-500 to-sky-500'
            )}
            initial={{ height: 0 }}
            animate={{ height: `calc((100% - 1.5rem) * ${fill})` }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.15 + index * 0.05 }}
            aria-hidden
          />
          {!failed && fill > 0 && fill < 1 && (
            <motion.span
              className="absolute left-[17px] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_0_4px_rgba(56,189,248,0.25)] sm:left-[19px]"
              initial={{ top: '0.75rem', opacity: 0 }}
              animate={{
                top: `calc(0.75rem + (100% - 1.5rem) * ${fill})`,
                opacity: [0.55, 1, 0.55],
                scale: [0.9, 1.15, 0.9],
              }}
              transition={{
                top: { duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.15 + index * 0.05 },
                opacity: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
              }}
              aria-hidden
            />
          )}

          <ol className="relative z-10 space-y-1">
            {steps.map((step, stepIndex) => {
              const done = stepIndex <= lastCompleted
              const current =
                !failed &&
                !invoicePaid &&
                stepIndex === activeIndex &&
                lastCompleted < steps.length - 1
              const upcoming = stepIndex > lastCompleted && !current
              const Icon = step.icon
              const at =
                step.id === 'paid'
                  ? paidAt || item.paid_at || item.clicked_at || item.delivered_at || item.sent_at
                  : step.id === 'delivered'
                    ? item.delivered_at || item.sent_at
                    : item[step.key]
              const isFailHere = failed && stepIndex === Math.max(lastCompleted, 0) && !done

              return (
                <li key={step.id} className="flex items-start gap-3.5 py-4 first:pt-1 last:pb-1">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.2 + stepIndex * 0.08,
                      type: 'spring',
                      stiffness: 320,
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
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.35 + stepIndex * 0.08, type: 'spring' }}
                      >
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                      </motion.span>
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
                      <p className="text-[11px] text-slate-400">
                        {at ? formatWhen(at) : current ? 'In progress' : upcoming ? '—' : ''}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
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
  const invoicePaid = String(invoiceStatus || '').toLowerCase() === 'paid'
  const { data: items = [], isLoading, isError, error, refetch, isFetching } =
    useInvoiceActivity(invoiceId, { enabled: Boolean(invoiceId) && enabled })

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
              {invoicePaid
                ? 'Delivery complete — invoice marked Paid'
                : 'Delivered → Opened → Clicked → Replied'}
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
                invoicePaid={invoicePaid}
                paidAt={paidAt}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  )

  if (embedded) return <div>{body}</div>

  return (
    <Card>
      <CardContent className="p-0">{body}</CardContent>
    </Card>
  )
}
