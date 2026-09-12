import { motion } from 'framer-motion'
import {
  TrendingUp,
  ArrowUpRight,
  Shield,
  Wallet,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { formatCurrency, cn } from '@/shared/lib/utils'
import { useDuewiseDashboard } from '@/products/duewise/hooks/useDuewise'
import { getUserMessage } from '@/shared/errors/errorHandler'

const ACCENT_STYLES = {
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    bar: 'from-emerald-500 to-teal-500',
    Icon: Wallet,
  },
  teal: {
    iconBg: 'bg-teal-50 text-teal-600',
    bar: 'from-teal-500 to-cyan-500',
    Icon: ArrowUpRight,
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600',
    bar: 'from-indigo-500 to-sky-500',
    Icon: TrendingUp,
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600',
    bar: 'from-amber-500 to-orange-500',
    Icon: Shield,
  },
}

function buildKpis(dashboard) {
  const counts = dashboard?.counts || {}
  return [
    {
      id: 'total-invoiced',
      label: 'Total Invoiced',
      value: Number(dashboard?.total_invoiced) || 0,
      accent: 'emerald',
      changeLabel: `${counts.total ?? 0} invoices`,
    },
    {
      id: 'recovered',
      label: 'Recovered',
      value: Number(dashboard?.total_recovered) || 0,
      accent: 'teal',
      highlight: true,
      changeLabel: `${counts.paid ?? 0} paid`,
    },
    {
      id: 'outstanding',
      label: 'Outstanding',
      value: Number(dashboard?.total_outstanding) || 0,
      accent: 'indigo',
      changeLabel: `${(counts.open ?? 0) + (counts.partially_paid ?? 0)} open`,
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: Number(dashboard?.total_overdue) || 0,
      accent: 'amber',
      changeLabel: `${counts.overdue ?? 0} overdue`,
    },
  ]
}

export function KPICards() {
  const { data, isLoading, isError, error, refetch } = useDuewiseDashboard()

  if (isLoading) {
    return (
      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    )
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

  const metrics = buildKpis(data)

  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, i) => {
        const style = ACCENT_STYLES[metric.accent]
        const Icon = style.Icon

        return (
          <motion.div
            key={metric.id}
            className="h-full min-h-[160px]"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
            whileHover={{ y: -3, scale: 1.01 }}
          >
            <Card
              className={cn(
                'relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md',
                metric.highlight && 'ring-1 ring-teal-200/80'
              )}
            >
              <div className={cn('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', style.bar)} />
              <CardContent className="flex h-full flex-col pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      {formatCurrency(metric.value, { compact: true })}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      style.iconBg
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="mt-3 truncate text-xs text-slate-400">{metric.changeLabel}</p>

                <div className="mt-auto pt-3">
                  {metric.highlight ? (
                    <div className="flex min-h-[32px] items-center gap-1.5 rounded-lg bg-teal-50/80 px-2.5 py-1.5">
                      <Sparkles className="h-3 w-3 shrink-0 text-teal-600" />
                      <span className="text-[11px] font-medium text-teal-800">
                        Recovered overdue collections
                      </span>
                    </div>
                  ) : (
                    <div className="min-h-[32px]" aria-hidden />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
