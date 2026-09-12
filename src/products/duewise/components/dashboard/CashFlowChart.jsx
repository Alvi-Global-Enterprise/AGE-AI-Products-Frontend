import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, AlertCircle } from 'lucide-react'
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

const CHART_HEIGHT = 248

function formatDayLabel(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildChartPoints(forecast) {
  const daily = Array.isArray(forecast?.daily_projections)
    ? forecast.daily_projections
    : []
  const summary = forecast?.summary || {}
  const expectedTotal = Number(summary.total_expected) || 0
  const optimisticTotal = Number(summary.total_optimistic) || expectedTotal
  const ratio = expectedTotal > 0 ? optimisticTotal / expectedTotal : 1

  // Prefer days with activity; otherwise sample every other day for readability
  const withActivity = daily.filter((d) => Number(d.expected_amount) > 0)
  const source =
    withActivity.length >= 4
      ? withActivity
      : daily.filter((_, i) => i % 2 === 0 || Number(daily[i]?.expected_amount) > 0)

  return source.map((d, i) => {
    const expected = Number(d.expected_amount) || 0
    return {
      id: d.date || i,
      label: formatDayLabel(d.date),
      date: d.date,
      expected,
      optimistic: Math.round(expected * ratio),
      invoiceCount: Number(d.invoice_count) || 0,
    }
  })
}

function niceMax(values) {
  const peak = Math.max(...values, 1)
  const step = Math.pow(10, Math.floor(Math.log10(peak)))
  return Math.ceil(peak / step) * step
}

export function CashFlowChart() {
  const { data: forecast, isLoading, isError, error, refetch } = useDuewiseForecast()
  const [hovered, setHovered] = useState(null)

  const points = useMemo(() => buildChartPoints(forecast), [forecast])
  const summary = forecast?.summary || {}

  const { maxVal, yTicks, peakIndex, uplift } = useMemo(() => {
    const vals = points.flatMap((p) => [p.expected, p.optimistic])
    const maxVal = niceMax(vals)
    const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal]
    let peakIndex = 0
    points.forEach((p, i) => {
      if (p.optimistic > (points[peakIndex]?.optimistic || 0)) peakIndex = i
    })
    const expected = Number(summary.total_expected) || 0
    const optimistic = Number(summary.total_optimistic) || 0
    return {
      maxVal,
      yTicks,
      peakIndex,
      uplift: optimistic - expected,
    }
  }, [points, summary])

  const barHeight = (value) =>
    Math.max(Math.round((value / maxVal) * CHART_HEIGHT), value > 0 ? 8 : 2)

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

  const active = hovered != null ? points[hovered] : null
  const period = forecast?.forecast_period
  const xLabels = points.filter((_, i) =>
    [0, Math.floor(points.length / 3), Math.floor((points.length * 2) / 3), points.length - 1].includes(i)
  )

  return (
    <motion.div
      className="flex h-full w-full"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45 }}
    >
      <Card className="flex h-full w-full flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>30-Day Cash Flow Forecast</CardTitle>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {period?.days || 30} days
              </Badge>
            </div>
            <CardDescription>
              Expected collections vs optimistic scenario
              {period?.start && period?.end
                ? ` · ${formatDayLabel(period.start)} – ${formatDayLabel(period.end)}`
                : ''}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {uplift > 0 && (
              <Badge className="bg-emerald-50 text-emerald-700">
                <TrendingUp className="h-3 w-3" />
                +{formatCurrency(uplift, { compact: true })} upside
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col pt-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-slate-300 ring-2 ring-slate-100" />
                Expected
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-2.5 py-1 text-emerald-800 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                Optimistic
              </span>
            </div>

            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm"
                >
                  <span className="text-xs font-semibold text-slate-800">{active.label}</span>
                  <span className="h-3 w-px bg-slate-200" />
                  <span className="text-xs tabular-nums text-slate-500">
                    {formatCurrency(active.expected)}
                  </span>
                  <span className="text-xs tabular-nums font-semibold text-emerald-700">
                    {formatCurrency(active.optimistic)}
                  </span>
                </motion.div>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-slate-400"
                >
                  Hover a day to inspect
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {points.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
              No forecast projections yet.
            </p>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/90 via-white to-emerald-50/30 p-4 sm:p-5">
              <div className="relative flex gap-3 sm:gap-4">
                <div
                  className="flex w-9 shrink-0 flex-col justify-between text-right sm:w-10"
                  style={{ height: CHART_HEIGHT }}
                >
                  {[...yTicks].reverse().map((tick) => (
                    <span
                      key={tick}
                      className="text-[10px] font-medium tabular-nums leading-none text-slate-400"
                    >
                      {tick === 0 ? '$0' : formatCurrency(tick, { compact: true })}
                    </span>
                  ))}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="relative" style={{ height: CHART_HEIGHT }}>
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                      {yTicks.map((tick, i) => (
                        <div
                          key={tick}
                          className={cn(
                            'w-full border-t',
                            i === yTicks.length - 1
                              ? 'border-slate-200'
                              : 'border-dashed border-slate-200/70'
                          )}
                        />
                      ))}
                    </div>

                    <div className="relative z-[1] flex h-full items-end gap-1 sm:gap-1.5">
                      {points.map((point, i) => {
                        const isHovered = hovered === i
                        const isPeak = i === peakIndex && point.optimistic > 0
                        const dimmed = hovered !== null && !isHovered

                        return (
                          <div
                            key={point.id}
                            className="relative flex h-full flex-1 items-end justify-center"
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <div
                              className={cn(
                                'relative z-[1] flex items-end justify-center gap-[3px] transition-opacity duration-200',
                                dimmed && 'opacity-35'
                              )}
                            >
                              <motion.div
                                className={cn(
                                  'w-2.5 rounded-t-md bg-slate-300/90 sm:w-3',
                                  isHovered && 'bg-slate-400'
                                )}
                                initial={{ height: 0 }}
                                animate={{ height: barHeight(point.expected) }}
                                transition={{ delay: 0.1 + i * 0.02, duration: 0.45 }}
                              />
                              <motion.div
                                className={cn(
                                  'relative w-3 rounded-t-md bg-gradient-to-t from-emerald-700 via-emerald-500 to-teal-400 shadow-sm shadow-emerald-600/20 sm:w-3.5',
                                  isPeak &&
                                    'ring-2 ring-emerald-300/70 ring-offset-1 ring-offset-white'
                                )}
                                initial={{ height: 0 }}
                                animate={{ height: barHeight(point.optimistic) }}
                                transition={{ delay: 0.14 + i * 0.02, duration: 0.45 }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-[10px] font-medium text-slate-400">
                    {xLabels.map((point) => (
                      <span key={point.id}>{point.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[
              {
                label: 'Expected',
                value: formatCurrency(summary.total_expected || 0, { compact: true }),
                tone: 'text-slate-800',
                chip: 'bg-slate-100',
              },
              {
                label: 'Optimistic',
                value: formatCurrency(summary.total_optimistic || 0, { compact: true }),
                tone: 'text-emerald-700',
                chip: 'bg-emerald-50',
              },
              {
                label: 'Conservative',
                value: formatCurrency(summary.total_conservative || 0, { compact: true }),
                tone: 'text-sky-700',
                chip: 'bg-sky-50',
              },
              {
                label: 'At risk',
                value: formatCurrency(summary.total_at_risk || 0, { compact: true }),
                tone: 'text-amber-700',
                chip: 'bg-amber-50',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn('rounded-xl border border-slate-100 px-3 py-2.5', stat.chip)}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
                <p className={cn('mt-0.5 text-base font-semibold tabular-nums sm:text-lg', stat.tone)}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
