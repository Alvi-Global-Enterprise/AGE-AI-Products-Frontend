import { motion } from 'framer-motion'
import {
  Sparkles,
  TrendingUp,
  Settings,
  GitBranch,
  CreditCard,
  Building2,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { AIPaymentPrediction } from '@/products/duewise/components/dashboard/AIPaymentPrediction'
import { CashFlowChart } from '@/products/duewise/components/dashboard/CashFlowChart'
import { ChannelTracker } from '@/products/duewise/components/dashboard/ChannelTracker'

const PLACEHOLDERS = {
  insights: {
    title: 'AI Insights',
    description:
      'Payment propensity, risk scores, and recovery playbooks — evidence-logged for automation %.',
    Icon: Sparkles,
  },
  cashflow: {
    title: 'Cash Flow',
    description: '30-day forecast vs AI-optimized recovery path. Never invent a number.',
    Icon: TrendingUp,
  },
  settings: {
    title: 'DueWise Settings',
    description: 'Client rules: do-not-contact, tone, escalation, approval-mode toggle.',
    Icon: Settings,
  },
  sequences: {
    title: 'Sequences',
    description:
      'Multi-step journeys with revalidation-before-dispatch, quiet hours, STOP, and approval gates.',
    Icon: GitBranch,
  },
  billing: {
    title: 'Platform Billing',
    description:
      'Subscriptions, performance fees from recorded outcomes, dunning, monthly statements. Billing ships first.',
    Icon: CreditCard,
  },
  'tenant-settings': {
    title: 'Tenant Settings',
    description: 'Roles, MFA, companies inside tenant, isolation boundary.',
    Icon: Building2,
  },
}

export function PlaceholderPage({ type }) {
  const meta = PLACEHOLDERS[type] || PLACEHOLDERS.settings
  const Icon = meta.Icon

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {meta.title}
            </h1>
            <p className="text-sm text-slate-500">{meta.description}</p>
          </div>
        </div>
      </motion.div>

      {type === 'insights' && <AIPaymentPrediction />}
      {type === 'cashflow' && <CashFlowChart />}
      {type === 'sequences' && <ChannelTracker />}
      {(type === 'settings' || type === 'tenant-settings') && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            {(type === 'settings'
              ? [
                  { label: 'Recovery fee rate', value: '15% of overdue recovered' },
                  { label: 'Approval mode', value: 'On · first 30 days' },
                  { label: 'Default channel ladder', value: 'WhatsApp → SMS → Email' },
                  { label: 'Quiet hours', value: '9pm–8am local' },
                ]
              : [
                  { label: 'Tenant ID', value: 'northstar-labs' },
                  { label: 'Billing mode', value: 'Stripe subscription + performance fee' },
                  { label: 'Operator hub', value: 'Karachi Ops' },
                  { label: 'MFA', value: 'Required on all company identities' },
                ]
            ).map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"
              >
                <p className="text-sm text-slate-600">{row.label}</p>
                <p className="text-sm font-medium text-slate-900">{row.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {type === 'billing' && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            {[
              { label: 'DueWise recovered (month)', value: '$87,420' },
              { label: 'Platform fee (15%)', value: '$13,113' },
              { label: 'Subscription tier', value: 'Growth · free first month used' },
              { label: 'Next statement', value: 'Apr 1, 2026' },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"
              >
                <p className="text-sm text-slate-600">{row.label}</p>
                <p className="text-sm font-medium text-slate-900">{row.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
