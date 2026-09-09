import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, cn } from '@/lib/utils'
import { CASH_FLOW_FORECAST } from '@/data/mockData'

const CHART_HEIGHT = 248
const MAX_VAL = 22000
const Y_TICKS = [0, 5500, 11000, 16500, 22000]

function barHeight(value) {
  return Math.max(Math.round((value / MAX_VAL) * CHART_HEIGHT), 10)
}

export function CashFlowChart() {
  const [hovered, setHovered] = useState(null)

  const { totalOptimized, totalExpected, uplift, peakIndex } = useMemo(() => {
    const totalOptimized = CASH_FLOW_FORECAST.reduce((s, d) => s + d.optimized, 0)
    const totalExpected = CASH_FLOW_FORECAST.reduce((s, d) => s + d.expected, 0)
    let peakIndex = 0
    CASH_FLOW_FORECAST.forEach((d, i) => {
      if (d.optimized > CASH_FLOW_FORECAST[peakIndex].optimized) peakIndex = i
    })
    return {
      totalOptimized,
      totalExpected,
      uplift: totalOptimized - totalExpected,
      peakIndex,
    }
  }, [])

  const active = hovered !== null ? CASH_FLOW_FORECAST[hovered] : null
  const activeDelta = active
    ? Math.round(((active.optimized - active.expected) / active.expected) * 100)
    : null

  return (
    <motion.div
      className="flex h-full w-full"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.45 }}
    >
      <Card className="flex h-full w-full flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>30-Day Cash Flow Forecast</CardTitle>
              <Badge variant="ai" className="hidden sm:inline-flex">
                <Sparkles className="h-3 w-3" /> AI model
              </Badge>
            </div>
            <CardDescription>
              Expected collections vs AI-optimized recovery path
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">94% confidence</Badge>
            <Badge variant="paid">
              <TrendingUp className="h-3 w-3" />
              +{formatCurrency(uplift, { compact: true })} uplift
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col pt-2">
          {/* Live readout + legend */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-slate-300 ring-2 ring-slate-100" />
                Expected
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-2.5 py-1 text-emerald-800 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                AI Optimized
              </span>
            </div>

            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key={active.day}
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
                    {formatCurrency(active.optimized)}
                  </span>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    +{activeDelta}%
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

          {/* Chart well */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/90 via-white to-emerald-50/30 p-4 sm:p-5">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.18) 1px, transparent 0)',
                backgroundSize: '16px 16px',
              }}
            />

            <div className="relative flex gap-3 sm:gap-4">
              {/* Y-axis */}
              <div
                className="flex w-9 shrink-0 flex-col justify-between text-right sm:w-10"
                style={{ height: CHART_HEIGHT }}
              >
                {[...Y_TICKS].reverse().map((tick) => (
                  <span
                    key={tick}
                    className="text-[10px] font-medium tabular-nums leading-none text-slate-400"
                  >
                    {tick === 0 ? '$0' : `$${tick / 1000}k`}
                  </span>
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <div className="relative" style={{ height: CHART_HEIGHT }}>
                  {/* Horizontal guides */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                    {Y_TICKS.map((tick, i) => (
                      <div
                        key={tick}
                        className={cn(
                          'w-full border-t',
                          i === Y_TICKS.length - 1
                            ? 'border-slate-200'
                            : 'border-dashed border-slate-200/70'
                        )}
                      />
                    ))}
                  </div>

                  {/* Soft area silhouette behind bars (optimized trend) */}
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                    preserveAspectRatio="none"
                    viewBox={`0 0 ${CASH_FLOW_FORECAST.length - 1} ${MAX_VAL}`}
                  >
                    <defs>
                      <linearGradient id="optFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d={
                        `M 0 ${MAX_VAL - CASH_FLOW_FORECAST[0].optimized} ` +
                        CASH_FLOW_FORECAST.slice(1)
                          .map((p, i) => `L ${i + 1} ${MAX_VAL - p.optimized}`)
                          .join(' ') +
                        ` L ${CASH_FLOW_FORECAST.length - 1} ${MAX_VAL} L 0 ${MAX_VAL} Z`
                      }
                      fill="url(#optFill)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                    />
                    <motion.polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth="0.08"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={CASH_FLOW_FORECAST.map(
                        (p, i) => `${i},${MAX_VAL - p.optimized}`
                      ).join(' ')}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.55 }}
                      transition={{ delay: 0.45, duration: 0.9, ease: 'easeOut' }}
                    />
                  </svg>

                  {/* Bars */}
                  <div className="relative z-[1] flex h-full items-end gap-1 sm:gap-1.5">
                    {CASH_FLOW_FORECAST.map((point, i) => {
                      const isHovered = hovered === i
                      const isPeak = i === peakIndex
                      const optH = barHeight(point.optimized)
                      const expH = barHeight(point.expected)
                      const dimmed = hovered !== null && !isHovered

                      return (
                        <div
                          key={point.day}
                          className="relative flex h-full flex-1 items-end justify-center"
                          onMouseEnter={() => setHovered(i)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          {/* Column hover wash */}
                          <div
                            className={cn(
                              'absolute inset-x-0 bottom-0 rounded-t-lg transition-colors duration-200',
                              isHovered ? 'bg-emerald-500/5' : 'bg-transparent'
                            )}
                            style={{ height: CHART_HEIGHT }}
                          />

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
                              animate={{ height: expH }}
                              transition={{
                                delay: 0.18 + i * 0.03,
                                duration: 0.55,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            />
                            <motion.div
                              className={cn(
                                'relative w-3 rounded-t-md bg-gradient-to-t from-emerald-700 via-emerald-500 to-teal-400 shadow-sm shadow-emerald-600/20 sm:w-3.5',
                                isHovered && 'shadow-md shadow-emerald-500/30',
                                isPeak && 'ring-2 ring-emerald-300/70 ring-offset-1 ring-offset-white'
                              )}
                              initial={{ height: 0 }}
                              animate={{ height: optH }}
                              transition={{
                                delay: 0.22 + i * 0.03,
                                duration: 0.55,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            >
                              {isPeak && (
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
                                  Peak
                                </span>
                              )}
                            </motion.div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* X-axis */}
                <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-[10px] font-medium text-slate-400">
                  {CASH_FLOW_FORECAST.filter((_, i) => [0, 3, 7, 11, 14].includes(i)).map(
                    (point) => (
                      <span key={point.day}>{point.label}</span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary metrics */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              {
                label: 'Expected total',
                value: formatCurrency(totalExpected, { compact: true }),
                tone: 'text-slate-800',
                chip: 'bg-slate-100',
              },
              {
                label: 'AI optimized',
                value: formatCurrency(totalOptimized, { compact: true }),
                tone: 'text-emerald-700',
                chip: 'bg-emerald-50',
              },
              {
                label: 'Net uplift',
                value: `+${formatCurrency(uplift, { compact: true })}`,
                tone: 'text-teal-700',
                chip: 'bg-teal-50',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  'rounded-xl border border-slate-100 px-3 py-2.5',
                  stat.chip
                )}
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
