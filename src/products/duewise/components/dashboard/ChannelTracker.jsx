import { motion } from 'framer-motion'
import { AlertCircle, Building2 } from 'lucide-react'
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
import { formatCurrency } from '@/shared/lib/utils'
import { useDuewiseDashboard } from '@/products/duewise/hooks/useDuewise'
import { getUserMessage } from '@/shared/errors/errorHandler'

const AGING_ORDER = ['current', '1-30', '31-60', '61-90', '90+']

export function ChannelTracker() {
  const { data, isLoading, isError, error, refetch } = useDuewiseDashboard()
  const clients = Array.isArray(data?.top_overdue_clients) ? data.top_overdue_clients : []
  const aging = data?.aging_buckets || {}

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-2xl" />
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.45 }}
    >
      <Card className="h-full">
        <CardHeader>
          <div>
            <CardTitle>Aging & top overdue</CardTitle>
            <CardDescription>
              Bucket breakdown and highest-risk clients from the dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-5">
            {AGING_ORDER.map((key) => {
              const bucket = aging[key] || { count: 0, amount: 0 }
              return (
                <div
                  key={key}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {key === 'current' ? 'Current' : `${key} days`}
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                    {formatCurrency(bucket.amount || 0, { compact: true })}
                  </p>
                  <p className="text-[11px] text-slate-500">{bucket.count || 0} inv</p>
                </div>
              )
            })}
          </div>

          <ul className="space-y-1">
            {clients.length === 0 && (
              <li className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                No overdue clients right now.
              </li>
            )}
            {clients.map((item, i) => (
              <motion.li
                key={item.client_id || i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-slate-50"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {item.client_name || item.company_name || 'Client'}
                    </p>
                    <Badge className="bg-rose-50 text-rose-700">
                      {item.max_days_overdue ?? 0}d overdue
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.overdue_count ?? 0} invoice
                    {(item.overdue_count ?? 0) === 1 ? '' : 's'} ·{' '}
                    {formatCurrency(item.overdue_amount || 0)}
                    {item.company_name && item.company_name !== item.client_name
                      ? ` · ${item.company_name}`
                      : ''}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  )
}
