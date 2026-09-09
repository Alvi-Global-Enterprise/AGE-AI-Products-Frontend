import { motion } from 'framer-motion'
import { Headphones, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Skeleton'
import { PLATFORM } from '@/data/mockData'

const QUEUE = [
  {
    id: 1,
    product: 'DueWise',
    code: 'AR',
    item: 'Acme Corp INV-2048 — low confidence WhatsApp send',
    reason: 'Confidence 61% · approval mode',
    age: '4m',
  },
  {
    id: 2,
    product: 'DueWise',
    code: 'AR',
    item: 'Orbit Media — QuickBooks sync error retry',
    reason: 'Integration adapter failure',
    age: '18m',
  },
  {
    id: 3,
    product: 'DueWise',
    code: 'AR',
    item: 'Nova Retail — STOP keyword received',
    reason: 'Do-not-contact gate',
    age: '1h',
  },
]

export default function OperatorQueuePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Operator Queue
            </h1>
            <p className="text-sm text-slate-500">
              {PLATFORM.operatorHub} workspace — exceptions, approvals, reason codes
            </p>
          </div>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Open exceptions</CardTitle>
            <CardDescription>
              Automation pauses here. Humans decide. Evidence log records the outcome.
            </CardDescription>
          </div>
          <Badge variant="pending">{QUEUE.length} open</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {QUEUE.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:bg-white hover:shadow-sm"
            >
              <Avatar initials={row.code} size="sm" colorIndex={i} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="ai">{row.product}</Badge>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3" /> {row.age}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-900">{row.item}</p>
                <p className="text-xs text-slate-500">{row.reason}</p>
              </div>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-700 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
              </button>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
