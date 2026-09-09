import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Shield,
  Users,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  CURRENT_USER,
  PLATFORM,
  PLATFORM_STATS,
  PRODUCTS,
} from '@/data/mockData'

export default function PlatformDashboard() {
  const duewise = PRODUCTS[0]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="ai" className="mb-3">
          <Sparkles className="h-3 w-3" /> Shared platform · DueWise live
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {PLATFORM.name} Command Center
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
          Done-for-you outcomes for {CURRENT_USER.company}. Automation handles the bulk;
          {PLATFORM.operatorHub} handles exceptions. Tenant boundary is absolute.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLATFORM_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="h-full">
              <CardContent className="pt-5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

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
                    <Badge variant="default">Difficulty {duewise.difficulty}/10</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{duewise.detail}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Fee model:{' '}
                    <span className="font-medium text-slate-700">{duewise.feeModel}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {duewise.modules.slice(0, 4).map((m) => (
                      <Badge key={m} variant="default">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center lg:text-left">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {duewise.heroMetric}
                  </p>
                  <p className="text-xl font-semibold text-emerald-700">{duewise.heroValue}</p>
                </div>
                <Link to={duewise.path}>
                  <Button className="w-full">
                    Open {duewise.name}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
