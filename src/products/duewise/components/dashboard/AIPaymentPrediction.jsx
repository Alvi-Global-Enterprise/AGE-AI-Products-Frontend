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

function dueLabel(dueDate) {
  if (!dueDate) return '—'
  const due = new Date(`${dueDate}T00:00:00`)
  if (Number.isNaN(due.getTime())) return dueDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} overdue`
  if (diff === 0) return 'Due today'
  return `Due in ${diff} day${diff === 1 ? '' : 's'}`
}

export function AIPaymentPrediction() {
  const { data: forecast, isLoading, isError, error, refetch } = useDuewiseForecast()
  const payments = Array.isArray(forecast?.upcoming_payments)
    ? forecast.upcoming_payments
    : []

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
              const late = Number(item.late_probability) || 0
              const name = item.client_name || 'Client'
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
                            {formatCurrency(item.amount_due ?? item.expected_amount)} ·{' '}
                            {dueLabel(item.due_date)}
                          </p>
                        </div>
                        <Badge variant={riskBadge(late)}>{late}% late risk</Badge>
                      </div>

                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                          className={cn('h-full rounded-full', riskColor(late))}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, late)}%` }}
                          transition={{ delay: 0.35 + i * 0.05, duration: 0.5 }}
                        />
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          {late >= 70 ? (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                          ) : (
                            <Zap className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                          )}
                          <span>
                            {item.invoice_number || `Invoice #${item.invoice_id}`}
                            {item.predicted_date
                              ? ` · predicted ${formatDay(item.predicted_date)}`
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

function formatDay(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
