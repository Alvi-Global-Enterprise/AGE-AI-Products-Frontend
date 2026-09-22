import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ReceiptText,
  Loader2,
  RefreshCw,
  TrendingUp,
  CalendarDays,
  BadgeDollarSign,
  Percent,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle,
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import {
  useRecoveryCurrentCycle,
  useRecoveryBatches,
  useRetryRecoveryBatch,
} from '@/products/duewise/hooks/useDuewise'
import { formatCurrency, timeAgo } from '@/shared/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtPeriod(start, end) {
  if (!start || !end) return '—'
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const e = new Date(end).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${s} – ${e}`
}

function planLabel(plan) {
  if (!plan) return 'Base'
  if (plan === 'big_books') return 'Big Books'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ toast, onClose }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-xl"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
          )}
          <p className="text-sm font-medium text-slate-800">{toast.message}</p>
          <button
            onClick={onClose}
            className="ml-2 rounded-md p-0.5 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Current Cycle Section ────────────────────────────────────────────────────

function CurrentCycleSection() {
  const { data, isLoading, isFetching, refetch } = useRecoveryCurrentCycle()

  const plan = data?.current_plan
  const feeRate = data?.fee_percentage ?? 15
  const periodStart = data?.period_start
  const periodEnd = data?.period_end
  const totalRecovered = data?.total_overdue_recovered ?? 0
  const accruedFee = data?.accrued_recovery_fee ?? 0
  const invoicesCount = data?.invoices_count ?? 0
  const qualifying = data?.qualifying_invoices ?? []

  const isBigBooks = plan === 'big_books'

  const KPICard = ({ icon: Icon, label, value, accent, sub }) => (
    <div
      className={`flex flex-col gap-1 rounded-2xl border p-4 ${
        accent === 'emerald'
          ? 'border-emerald-100 bg-emerald-50/70'
          : accent === 'indigo'
            ? 'border-indigo-100 bg-indigo-50/70'
            : accent === 'amber'
              ? 'border-amber-100 bg-amber-50/70'
              : 'border-slate-200 bg-slate-50/70'
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
          accent === 'emerald'
            ? 'bg-emerald-100 text-emerald-600'
            : accent === 'indigo'
              ? 'bg-indigo-100 text-indigo-600'
              : accent === 'amber'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-slate-100 text-slate-500'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
      {isLoading ? (
        <div className="h-5 w-24 animate-pulse rounded-md bg-slate-200" />
      ) : (
        <p className="text-lg font-semibold tracking-tight text-slate-900">{value}</p>
      )}
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  )

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Current Billing Cycle</h2>
            <p className="text-xs text-slate-500">Live accruing recovery meter</p>
          </div>
          <span className="ml-1 flex h-2 w-2 relative">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          icon={Sparkles}
          label="Current Plan & Fee Rate"
          value={
            isLoading ? '—' : (
              <span className="flex items-center gap-1.5">
                {planLabel(plan)}
                <Badge
                  variant={isBigBooks ? 'ai' : 'live'}
                  className="text-[10px] font-semibold"
                >
                  {feeRate}%
                </Badge>
              </span>
            )
          }
          accent="indigo"
          sub="Recovery fee rate"
        />
        <KPICard
          icon={CalendarDays}
          label="Cycle Period"
          value={isLoading ? '—' : fmtPeriod(periodStart, periodEnd)}
          accent="default"
          sub="Calendar month"
        />
        <KPICard
          icon={BadgeDollarSign}
          label="Overdue Recovered"
          value={isLoading ? '—' : formatCurrency(totalRecovered, { currency: 'USD' })}
          accent="emerald"
          sub={`${invoicesCount} invoice${invoicesCount === 1 ? '' : 's'} this cycle`}
        />
        <KPICard
          icon={Percent}
          label="Estimated Fee Accrued"
          value={isLoading ? '—' : formatCurrency(accruedFee, { currency: 'USD' })}
          accent="amber"
          sub="Due at month-end"
        />
      </div>

      {/* Qualifying Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <p className="text-sm font-semibold text-slate-800">Qualifying Invoices</p>
            {!isLoading && invoicesCount > 0 && (
              <Badge variant="default" className="text-xs">
                {invoicesCount} invoice{invoicesCount === 1 ? '' : 's'}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              {[1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : invoicesCount === 0 || qualifying.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Info className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">No qualifying invoices yet</p>
              <p className="max-w-sm text-xs text-slate-400">
                All recovered invoices for this cycle have been billed, or no new overdue invoices
                recovered yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3">Invoice #</th>
                    <th className="px-5 py-3">Client Name</th>
                    <th className="px-5 py-3">Original Amount</th>
                    <th className="px-5 py-3">Converted USD</th>
                    <th className="px-5 py-3">Paid / Recovered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {qualifying.map((inv, idx) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-indigo-600">
                          {inv.number}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{inv.client_name}</td>
                      <td className="px-5 py-3.5">
                        {inv.original_currency && inv.original_currency !== 'USD' ? (
                          <span className="text-slate-700">
                            {Number(inv.original_amount ?? 0).toLocaleString('en-US')}{' '}
                            <span className="text-xs font-medium text-slate-400">
                              {inv.original_currency}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-emerald-700">
                          {formatCurrency(inv.amount_recovered ?? 0, { currency: 'USD' })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {fmtDate(inv.paid_at || inv.recovered_at)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

// ─── Batch Detail Modal ───────────────────────────────────────────────────────

function BatchDetailModal({ batch, open, onClose }) {
  const breakdown = batch?.metadata?.invoices_breakdown ?? []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Batch #${batch?.id} Details`}
      description={batch ? fmtPeriod(batch.period_start, batch.period_end) : ''}
      size="lg"
    >
      {breakdown.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No invoice breakdown available.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex-1 min-w-[140px]">
              <p className="text-xs text-slate-400 font-medium">Total Recovered</p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
                {formatCurrency(batch?.total_recovered ?? 0, { currency: 'USD' })}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex-1 min-w-[140px]">
              <p className="text-xs text-emerald-600 font-medium">Fee ({batch?.fee_percentage}%)</p>
              <p className="mt-0.5 text-base font-semibold text-emerald-700">
                {formatCurrency(batch?.fee_amount ?? 0, { currency: 'USD' })}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex-1 min-w-[140px]">
              <p className="text-xs text-slate-400 font-medium">Charged At</p>
              <p className="mt-0.5 text-sm font-medium text-slate-700">
                {fmtDate(batch?.charged_at)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Original Amount</th>
                  <th className="px-4 py-3">Converted USD</th>
                  <th className="px-4 py-3">Exchange Rate</th>
                  <th className="px-4 py-3">Recovered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakdown.map((item) => (
                  <tr key={item.invoice_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-indigo-600">
                        {item.number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.client_name}</td>
                    <td className="px-4 py-3">
                      {item.original_currency !== 'USD' ? (
                        <span>
                          {Number(item.original_amount).toLocaleString('en-US')}{' '}
                          <span className="text-xs text-slate-400">{item.original_currency}</span>
                        </span>
                      ) : (
                        <span>{formatCurrency(item.original_amount, { currency: 'USD' })}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {formatCurrency(item.converted_usd ?? item.original_amount, {
                        currency: 'USD',
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {item.exchange_rate ? `1 ${item.original_currency} = $${item.exchange_rate}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {fmtDate(item.recovered_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Billing Batches Section ──────────────────────────────────────────────────

function BillingBatchesSection({ onToast }) {
  const [page, setPage] = useState(1)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [retryingId, setRetryingId] = useState(null)

  const { data, isLoading, isFetching, refetch } = useRecoveryBatches({ page, per_page: 15 })
  const retryMutation = useRetryRecoveryBatch()

  const batches = data?.data ?? []
  const total = data?.total ?? 0
  const lastPage = data?.last_page ?? 1
  const perPage = data?.per_page ?? 15

  const handleRetry = async (batch, e) => {
    e.stopPropagation()
    setRetryingId(batch.id)
    try {
      await retryMutation.mutateAsync(batch.id)
      await refetch()
      onToast({ type: 'success', message: `Batch #${batch.id} retry initiated successfully.` })
    } catch (err) {
      onToast({
        type: 'error',
        message: err?.message || `Failed to retry Batch #${batch.id}. Please try again.`,
      })
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <ReceiptText className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Billing Batches History</h2>
          <p className="text-xs text-slate-500">Monthly charges processed via Stripe</p>
        </div>
        {total > 0 && (
          <Badge variant="default" className="ml-auto text-xs">
            {total} batch{total === 1 ? '' : 'es'}
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ReceiptText className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">No billing batches yet</p>
              <p className="max-w-sm text-xs text-slate-400">
                Monthly recovery fee charges will appear here after the first billing cycle completes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3">Batch</th>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Total Recovered</th>
                    <th className="px-5 py-3">Fee Rate</th>
                    <th className="px-5 py-3">Fee Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Charged At</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((batch, idx) => {
                    const isCharged = batch.status === 'charged'
                    const isFailed = batch.status === 'failed'
                    const isRetrying = retryingId === batch.id

                    return (
                      <motion.tr
                        key={batch.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => setSelectedBatch(batch)}
                        className="group cursor-pointer transition-colors hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-bold text-slate-700">
                            #{batch.id}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 text-xs whitespace-nowrap">
                          {fmtPeriod(batch.period_start, batch.period_end)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {formatCurrency(batch.total_recovered, { currency: 'USD' })}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="default" className="text-xs font-semibold">
                            {batch.fee_percentage}%
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-semibold text-emerald-700">
                          {formatCurrency(batch.fee_amount, { currency: 'USD' })}
                        </td>
                        <td className="px-5 py-4">
                          {isCharged ? (
                            <Badge variant="paid" className="gap-1.5">
                              <CheckCircle2 className="h-3 w-3" />
                              Charged
                            </Badge>
                          ) : isFailed ? (
                            <Badge variant="overdue" className="gap-1.5">
                              <AlertTriangle className="h-3 w-3" />
                              Failed
                            </Badge>
                          ) : (
                            <Badge variant="pending">{batch.status}</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                          {batch.charged_at ? (
                            <span title={fmtDate(batch.charged_at)}>
                              {timeAgo(batch.charged_at)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {batch.can_retry ? (
                            <Button
                              id={`retry-batch-${batch.id}`}
                              size="sm"
                              disabled={isRetrying}
                              onClick={(e) => handleRetry(batch, e)}
                              className="gap-1.5 text-xs"
                            >
                              {isRetrying ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Retrying…
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Retry Payment
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-slate-400 hover:text-slate-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedBatch(batch)
                              }}
                            >
                              View Details
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-400">
                Showing {Math.min((page - 1) * perPage + 1, total)}–
                {Math.min(page * perPage, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
                <span className="text-xs font-medium text-slate-600">
                  {page} / {lastPage}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page >= lastPage || isFetching}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Detail Modal */}
      <BatchDetailModal
        batch={selectedBatch}
        open={Boolean(selectedBatch)}
        onClose={() => setSelectedBatch(null)}
      />
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecoveryFeesPage() {
  const [toast, setToast] = useState(null)

  const showToast = (t) => {
    setToast({ ...t, id: Date.now() })
    setTimeout(() => setToast(null), 4500)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start gap-4"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
          <BadgeDollarSign className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Recovery Fees
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monthly performance fees charged on successfully recovered overdue invoices.
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-medium text-slate-600">Base: 15% · Big Books: 10%</span>
          </p>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3.5"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
        <p className="text-xs leading-relaxed text-indigo-700">
          The platform charges a{' '}
          <strong>single monthly batch fee</strong> — never per invoice — only on{' '}
          <strong>overdue amounts successfully recovered</strong> during the calendar month. Invoices
          in non-USD currencies are automatically converted to USD at the prevailing exchange rate.
        </p>
      </motion.div>

      {/* Top Section: Current Billing Cycle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <CurrentCycleSection />
      </motion.div>

      {/* Divider */}
      <div className="relative flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Billing History
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Bottom Section: Billing Batches History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <BillingBatchesSection onToast={showToast} />
      </motion.div>

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
