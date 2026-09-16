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
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { Button } from '@/shared/components/ui/Button'
import { timeAgo } from '@/shared/lib/utils'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { useInvoiceActivity } from '@/products/duewise/hooks/useDuewise'

const CHANNEL_META = {
  email: { label: 'Email', icon: Mail },
  sms: { label: 'SMS', icon: MessageSquare },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
}

const EVENT_META = [
  { key: 'sent_at', label: 'Sent', icon: Send },
  { key: 'delivered_at', label: 'Delivered', icon: CheckCheck },
  { key: 'opened_at', label: 'Opened', icon: Eye },
  { key: 'clicked_at', label: 'Payment link clicked', icon: MousePointerClick },
  { key: 'replied_at', label: 'Client replied', icon: Reply },
]

function formatWhen(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function statusVariant(status) {
  const s = String(status || '').toLowerCase()
  if (['delivered', 'opened', 'clicked', 'replied', 'sent', 'pending'].includes(s)) return s
  if (s === 'failed' || s === 'bounced') return 'error'
  return 'default'
}

function activityEvents(item) {
  return EVENT_META.filter((e) => item[e.key]).map((e) => ({
    ...e,
    at: item[e.key],
  }))
}

export function InvoiceActivityFeed({ invoiceId }) {
  const { data: items = [], isLoading, isError, error, refetch, isFetching } =
    useInvoiceActivity(invoiceId)

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Activity</p>
              <p className="text-xs text-slate-500">
                Reminders, delivery, opens, clicks, and replies
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

        <div className="px-5 py-4">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
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
            <p className="py-6 text-center text-sm text-slate-500">
              No activity yet for this invoice.
            </p>
          )}

          {!isLoading && !isError && items.length > 0 && (
            <ul className="space-y-4">
              {items.map((item) => {
                const channel = CHANNEL_META[String(item.channel || '').toLowerCase()] || {
                  label: item.channel || 'Channel',
                  icon: Send,
                }
                const ChannelIcon = channel.icon
                const events = activityEvents(item)

                return (
                  <li
                    key={item.id || item.tracking_token}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900">
                        <ChannelIcon className="h-3.5 w-3.5 text-slate-500" />
                        {channel.label}
                      </span>
                      <Badge variant={statusVariant(item.status)} className="capitalize">
                        {item.status || 'unknown'}
                      </Badge>
                      {item.sent_at && (
                        <span className="text-[11px] text-slate-400">{timeAgo(item.sent_at)}</span>
                      )}
                    </div>
                    {item.recipient && (
                      <p className="mt-1 text-xs text-slate-500">{item.recipient}</p>
                    )}

                    {events.length > 0 && (
                      <ol className="relative mt-3 space-y-2 border-l border-slate-200 pl-4">
                        {events.map((ev) => {
                          const Icon = ev.icon
                          return (
                            <li key={`${item.id}-${ev.key}`} className="relative">
                              <span className="absolute -left-[21px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                                <Icon className="h-2.5 w-2.5 text-slate-500" />
                              </span>
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="text-xs font-medium text-slate-800">{ev.label}</p>
                                <p className="text-[11px] text-slate-400">{formatWhen(ev.at)}</p>
                              </div>
                            </li>
                          )
                        })}
                      </ol>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
