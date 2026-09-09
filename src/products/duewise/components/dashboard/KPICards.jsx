import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Shield,
  Wallet,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { formatCurrency, cn } from '@/lib/utils'
import { KPI_METRICS } from '@/data/mockData'

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

export function KPICards() {
  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_METRICS.map((metric, i) => {
        const style = ACCENT_STYLES[metric.accent]
        const Icon = style.Icon
        const isGoodDown = metric.trend === 'down-good'
        const isUp = metric.trend === 'up'

        return (
          <motion.div
            key={metric.id}
            className="h-full min-h-[180px]"
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
                    <div className="mt-2 flex items-baseline gap-1">
                      <p className="text-2xl font-semibold tracking-tight text-slate-900">
                        {metric.isScore
                          ? metric.value
                          : formatCurrency(metric.value, { compact: true })}
                      </p>
                      {metric.suffix && (
                        <span className="text-sm font-medium text-slate-400">{metric.suffix}</span>
                      )}
                    </div>
                  </div>
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', style.iconBg)}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  {isUp || isGoodDown ? (
                    isGoodDown ? (
                      <TrendingDown className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    )
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                  )}
                  <span
                    className={cn(
                      'shrink-0 text-xs font-semibold',
                      isUp || isGoodDown ? 'text-emerald-700' : 'text-rose-600'
                    )}
                  >
                    {metric.change}
                  </span>
                  <span className="truncate text-xs text-slate-400">{metric.changeLabel}</span>
                </div>

                {/* Reserved footer slot keeps all KPI cards equal height */}
                <div className="mt-auto pt-3">
                  {metric.highlight ? (
                    <div className="flex min-h-[32px] items-center gap-1.5 rounded-lg bg-teal-50/80 px-2.5 py-1.5">
                      <Sparkles className="h-3 w-3 shrink-0 text-teal-600" />
                      <span className="text-[11px] font-medium text-teal-800">
                        15% fee only on recovered overdue
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
