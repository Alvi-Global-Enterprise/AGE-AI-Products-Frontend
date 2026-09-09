import { motion } from 'framer-motion'
import { MessageSquare, Mail, Smartphone, Zap, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { formatCurrency, cn } from '@/lib/utils'
import { AI_PREDICTIONS } from '@/data/mockData'

const CHANNEL_ICON = {
  email: Mail,
  sms: Smartphone,
  whatsapp: MessageSquare,
}

function riskColor(prob) {
  if (prob >= 70) return 'bg-rose-500'
  if (prob >= 50) return 'bg-amber-500'
  if (prob >= 35) return 'bg-sky-500'
  return 'bg-emerald-500'
}

function riskBadge(status) {
  const map = {
    critical: 'overdue',
    warning: 'pending',
    moderate: 'unpaid',
    low: 'paid',
  }
  return map[status] || 'default'
}

export function AIPaymentPrediction() {
  return (
    <motion.div
      className="flex h-full w-full min-h-0"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.45 }}
    >
      <Card className="flex h-full w-full min-h-0 flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>AI Payment Predictions</CardTitle>
              <Badge variant="ai" pulse>
                Live
              </Badge>
            </div>
            <CardDescription>Client risk radar & smart channel actions</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pb-5">
          {/* Scrollable prediction list — keeps card height matched to cash flow chart */}
          <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {AI_PREDICTIONS.map((item, i) => {
              const ChannelIcon = CHANNEL_ICON[item.channel]
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  whileHover={{ scale: 1.01 }}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <Avatar initials={item.avatar} size="md" colorIndex={i} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.client}</p>
                          <p className="text-xs text-slate-500">
                            {formatCurrency(item.amount)} · {item.dueIn}
                          </p>
                        </div>
                        <Badge variant={riskBadge(item.status)}>
                          {item.lateProbability}% late risk
                        </Badge>
                      </div>

                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                          className={cn('h-full rounded-full', riskColor(item.lateProbability))}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.lateProbability}%` }}
                          transition={{ delay: 0.6 + i * 0.08, duration: 0.6 }}
                        />
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          {item.status === 'critical' ? (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                          ) : (
                            <Zap className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                          )}
                          <span>{item.action}</span>
                        </div>
                        <Badge variant={item.channel}>
                          <ChannelIcon className="h-3 w-3" />
                          {item.channel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="shrink-0 pt-3">
            <Button variant="ai" className="w-full">
              <Zap className="h-4 w-4" /> Run AI Recovery Sweep
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
