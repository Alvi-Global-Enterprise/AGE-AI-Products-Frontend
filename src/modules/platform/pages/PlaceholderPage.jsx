import { motion } from 'framer-motion'
import {
  Sparkles,
  TrendingUp,
  Puzzle,
  Settings,
  GitBranch,
  CreditCard,
  Building2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AIPaymentPrediction } from '@/components/dashboard/AIPaymentPrediction'
import { CashFlowChart } from '@/components/dashboard/CashFlowChart'
import { QuickBooksBanner } from '@/components/dashboard/QuickBooksBanner'
import { ChannelTracker } from '@/components/dashboard/ChannelTracker'

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
  integrations: {
    title: 'Integrations',
    description:
      'Shared adapter layer — accounting, channels, voice. Source of truth stays with the source.',
    Icon: Puzzle,
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
      {type === 'integrations' && (
        <div className="space-y-4">
          <QuickBooksBanner />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['QuickBooks Online', 'Stripe', 'Twilio', 'Postmark', 'WhatsApp Business', 'Retell'].map(
              (name, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between pt-5">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{name}</p>
                        <Badge variant={i < 2 ? 'synced' : 'pending'} className="mt-1.5">
                          {i < 2 ? 'Connected' : 'Adapter ready'}
                        </Badge>
                      </div>
                      <Button variant={i < 2 ? 'secondary' : 'default'} size="sm">
                        {i < 2 ? 'Manage' : 'Connect'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            )}
          </div>
        </div>
      )}
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
