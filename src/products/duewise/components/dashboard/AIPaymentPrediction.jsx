import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, AlertTriangle, AlertCircle } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { formatCurrency, cn } from '@/shared/lib/utils'
import { useDuewiseForecast } from '@/products/duewise/hooks/useDuewise'
import { getUserMessage } from '@/shared/errors/errorHandler'

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function riskColor(prob) {
  if (prob >= 70) return 'bg-rose-500'
  if (prob >= 50) return 'bg-amber-500'
  if (prob >= 35) return 'bg-sky-500'
  return 'bg-emerald-500'
}

function riskBadge(prob) {
  if (prob >= 70) return 'overdue'
  if (prob >= 50) return 'pending'
  if (prob >= 35) return 'unpaid'
  return 'paid'
}

function getPredictionStatus(item) {
  if (item.late_probability != null && item.late_probability !== '') {
    const late = Number(item.late_probability) || 0
    return {
      label: `${late}% late risk`,
      variant: riskBadge(late),
      color: riskColor(late),
      percent: Math.min(100, Math.max(5, late)),
      isHighRisk: late >= 70,
    }
  }

  if (item.confidence) {
    const raw = String(item.confidence).trim().toLowerCase()
    if (raw === 'high') {
      return {
        label: 'High confidence',
        variant: 'paid',
        color: 'bg-emerald-500',
        percent: 92,
        isHighRisk: false,
      }
    }
    if (raw === 'medium') {
      return {
        label: 'Medium confidence',
        variant: 'pending',
        color: 'bg-amber-500',
        percent: 60,
        isHighRisk: false,
      }
    }
    if (raw === 'low') {
      return {
        label: 'Low confidence',
        variant: 'overdue',
        color: 'bg-rose-500',
        percent: 25,
        isHighRisk: true,
      }
    }
    return {
      label: `${item.confidence} confidence`,
      variant: 'ai',
      color: 'bg-indigo-500',
      percent: 75,
      isHighRisk: false,
    }
  }

  return {
    label: 'Projected',
    variant: 'paid',
    color: 'bg-emerald-500',
    percent: 85,
    isHighRisk: false,
  }
}

function dateLabel(dateStr, isProjected = false) {
  if (!dateStr) return '—'
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  const prefix = isProjected ? 'Expected' : 'Due'
  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} overdue`
  if (diff === 0) return `${prefix} today`
  if (diff === 1) return `${prefix} tomorrow`
  return `${prefix} in ${diff} day${diff === 1 ? '' : 's'}`
}

function formatDay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function AIPaymentPrediction() {
  const { data: forecast, isLoading, isError, error, refetch } = useDuewiseForecast()
  const rawPayments = forecast?.upcoming_payments ?? forecast?.data?.upcoming_payments
  const payments = Array.isArray(rawPayments) ? rawPayments : []

  if (isLoading) {
    return <Skeleton className="h-[420px] w-full rounded-2xl" />
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="flex items-center gap-2 text-sm text-rose-600">
            <AlertCircle className="h-4 w-4" />
            {getUserMessage(error)}
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      className="flex h-full w-full min-h-0"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45 }}
    >
      <Card className="flex h-full w-full min-h-0 flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Upcoming payments</CardTitle>
              <Badge variant="secondary">{payments.length}</Badge>
            </div>
            <CardDescription>Predicted collections from the 30-day forecast</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pb-5">
          <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {payments.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No upcoming payments in this forecast window.
              </p>
            )}
            {payments.map((item, i) => {
              const name = item.client_name || 'Client'
              const status = getPredictionStatus(item)
              const projectedAmount =
                item.projected_amount ??
                item.expected_amount ??
                item.amount_due ??
                item.balance_due ??
                0
              const balanceDue = item.balance_due ?? item.amount_due
              const projectedDate = item.projected_date || item.predicted_date
              const targetDate = item.due_date || projectedDate
              const isProjectedOnly = !item.due_date && Boolean(projectedDate)

              return (
                <motion.div
                  key={item.invoice_id || item.invoice_number || i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                      {initials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">
                              {formatCurrency(projectedAmount)}
                            </span>
                            {balanceDue && balanceDue !== projectedAmount ? (
                              <span className="text-slate-400"> (of {formatCurrency(balanceDue)})</span>
                            ) : null}
                            {' · '}
                            <span>{dateLabel(targetDate, isProjectedOnly)}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.has_promise && (
                            <Badge variant="pending" className="text-[10px]">
                              Promise to pay
                            </Badge>
                          )}
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </div>

                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                          className={cn('h-full rounded-full', status.color)}
                          initial={{ width: 0 }}
                          animate={{ width: `${status.percent}%` }}
                          transition={{ delay: 0.35 + i * 0.05, duration: 0.5 }}
                        />
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          {status.isHighRisk ? (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                          ) : (
                            <Zap className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          )}
                          <span>
                            {item.invoice_number || (item.invoice_id ? `Invoice #${item.invoice_id}` : 'Invoice')}
                            {projectedDate
                              ? ` · predicted ${formatDay(projectedDate)}`
                              : ''}
                          </span>
                        </div>
                        {item.invoice_id && (
                          <Link
                            to={`/products/duewise/invoices/${item.invoice_id}`}
                            className="font-medium text-emerald-700 hover:text-emerald-800"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
