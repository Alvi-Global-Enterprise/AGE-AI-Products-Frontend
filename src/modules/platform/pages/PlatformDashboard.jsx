import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Shield,
  Users,
  AlertTriangle,
  Sparkles,
  Wallet,
  TrendingUp,
  Clock3,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { useClientStats } from '@/modules/clients/hooks/useClients'
import { useAppSelector } from '@/app/store/hooks'
import { selectUser } from '@/app/store/slices/authSlice'
import { PRODUCTS, PLATFORM } from '@/modules/platform/data/platformData'
import { formatCurrency, cn } from '@/shared/lib/utils'
import { getUserMessage } from '@/shared/errors/errorHandler'

export default function PlatformDashboard() {
  const duewise = PRODUCTS[0]
  const user = useAppSelector(selectUser)
  const company = user?.tenant?.name || user?.email || 'your tenant'
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClientStats()

  const risk = stats?.risk_breakdown || {}
  const channels = stats?.channel_breakdown || {}
  const topRisk = stats?.top_high_risk_clients || []

  const summaryCards = [
    {
      label: 'Total clients',
      value: stats?.total_clients ?? '—',
      hint: 'Tenant CRM roster',
      Icon: Users,
    },
    {
      label: 'Outstanding',
      value: stats ? formatCurrency(stats.total_outstanding || 0) : '—',
      hint: 'Open AR across clients',
      Icon: Wallet,
    },
    {
      label: 'Recovered',
      value: stats ? formatCurrency(stats.total_recovered || 0) : '—',
      hint: 'Collections to date',
      Icon: TrendingUp,
    },
    {
      label: 'Avg days to pay',
      value: stats?.average_days_to_pay ?? '—',
      hint: 'Payment velocity',
      Icon: Clock3,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="ai" className="mb-3">
          <Sparkles className="h-3 w-3" /> Shared platform · DueWise live
        </Badge>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {PLATFORM.name} Command Center
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
              Live client health for {company}. Stats from{' '}
              <code className="text-xs">GET /api/clients/stats</code>.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            Refresh stats
          </Button>
        </div>
      </motion.div>

      {isError && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-rose-600">{getUserMessage(error)}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="h-full">
              <CardContent className="pt-5">
                {isLoading ? (
                  <Skeleton className="h-20 rounded-xl" />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        {stat.label}
                      </p>
                      <stat.Icon className="h-4 w-4 text-slate-300" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Risk breakdown</h2>
              <Link to="/app/clients" className="text-xs font-medium text-emerald-700 hover:text-emerald-800">
                View clients
              </Link>
            </div>
            {isLoading ? (
              <Skeleton className="h-28 rounded-xl" />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'low', label: 'Low', className: 'bg-emerald-50 text-emerald-800' },
                  { key: 'medium', label: 'Medium', className: 'bg-amber-50 text-amber-800' },
                  { key: 'high', label: 'High', className: 'bg-rose-50 text-rose-800' },
                ].map((tier) => (
                  <div
                    key={tier.key}
                    className={cn('rounded-xl px-3 py-3 text-center', tier.className)}
                  >
                    <p className="text-2xl font-semibold">{risk[tier.key] ?? 0}</p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide opacity-80">
                      {tier.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Channel mix</h2>
            {isLoading ? (
              <Skeleton className="h-28 rounded-xl" />
            ) : (
              <div className="space-y-2">
                {Object.entries(channels).map(([channel, count]) => {
                  const total = Object.values(channels).reduce((s, n) => s + Number(n || 0), 0) || 1
                  const pct = Math.round((Number(count || 0) / total) * 100)
                  return (
                    <div key={channel}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium capitalize text-slate-700">{channel}</span>
                        <span className="text-slate-500">
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {!Object.keys(channels).length && (
                  <p className="text-sm text-slate-500">No channel data yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">High-risk clients</h2>
              <p className="text-xs text-slate-500">From clients stats · prioritize collections</p>
            </div>
            <Link to="/app/clients?risk_tier=high">
              <Button variant="secondary" size="sm">
                Open CRM
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : topRisk.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No high-risk clients flagged right now.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
              {topRisk.map((client) => (
                <div
                  key={client.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{client.name}</p>
                      <Badge className="bg-rose-50 text-rose-700">
                        Risk {client.ai_late_risk_score ?? '—'}
                      </Badge>
                      {client.effective_channel && (
                        <Badge variant="secondary">{client.effective_channel}</Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {client.company_name || '—'}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Outstanding
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(client.total_outstanding || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-emerald-100">
        <CardContent className="grid gap-0 p-0 md:grid-cols-3">
          {[
            {
              Icon: Shield,
              title: 'Tenant isolation',
              text: 'Client A never sees Client B — proven by release tests.',
            },
            {
              Icon: AlertTriangle,
              title: 'Fail closed',
              text: 'Re-validate before every send. Money & reputation in the code.',
            },
            {
              Icon: Users,
              title: 'Human-in-the-loop',
              text: 'Confidence gates, review queues, first-30-day approval mode.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-3 border-b border-slate-100 p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <item.Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.text}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Active product</h2>
          <Badge variant="live" pulse>
            Live
          </Badge>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
        >
          <Card className="overflow-hidden ring-1 ring-emerald-100">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-600/25">
                  {duewise.code}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{duewise.name}</h3>
                    <Badge variant="live" pulse>
                      Live
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{duewise.detail}</p>
                </div>
              </div>
              <Link to={duewise.path}>
                <Button className="w-full sm:w-auto">
                  Open {duewise.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
