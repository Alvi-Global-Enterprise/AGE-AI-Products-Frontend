import { motion } from 'framer-motion'
import { RefreshCw, CheckCircle2, Percent } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { BILLING_SUMMARY } from '@/data/mockData'

/** Official-ish QuickBooks green mark */
function QuickBooksLogo({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6" fill="#2CA01C" />
      <path
        d="M7.5 12c0-2.5 2-4.5 4.5-4.5S16.5 9.5 16.5 12 14.5 16.5 12 16.5 7.5 14.5 7.5 12zm2.2 0c0 1.27 1.03 2.3 2.3 2.3s2.3-1.03 2.3-2.3-1.03-2.3-2.3-2.3-2.3 1.03-2.3 2.3z"
        fill="white"
      />
    </svg>
  )
}

export function QuickBooksBanner() {
  const { recoveredThisMonth, platformFee, netToClient, platformFeeRate, lastQbSync } =
    BILLING_SUMMARY

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.4 }}
    >
      <Card className="overflow-hidden border-slate-200/80">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
            {/* Sync status */}
            <div className="flex flex-col justify-center gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <QuickBooksLogo className="h-11 w-11 shrink-0 shadow-sm" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">QuickBooks Online</p>
                    <Badge variant="live" pulse>
                      <CheckCircle2 className="h-3 w-3" /> Live sync
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <RefreshCw className="h-3 w-3" />
                    Synced {timeAgo(lastQbSync)}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-center sm:text-left">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Invoices synced
                </p>
                <p className="text-lg font-semibold text-slate-900">248</p>
              </div>
            </div>

            {/* Recovery fee transparency */}
            <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Percent className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Recovery Fee Transparency</p>
                  <p className="text-[11px] text-slate-500">
                    {(platformFeeRate * 100).toFixed(0)}% of recovered overdue only
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Recovered
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-slate-900">
                    {formatCurrency(recoveredThisMonth, { compact: true })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Platform fee
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-amber-700">
                    −{formatCurrency(platformFee, { compact: true })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Net to you
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-emerald-700">
                    {formatCurrency(netToClient, { compact: true })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
