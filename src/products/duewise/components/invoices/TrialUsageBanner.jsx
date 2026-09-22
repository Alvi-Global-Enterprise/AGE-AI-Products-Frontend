import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, AlertTriangle, ArrowUpRight, Mail, Lock } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { useDuewiseEntitlements } from '@/products/duewise/hooks/useDuewise'
import { cn } from '@/shared/lib/utils'

export function TrialUsageBanner({ className, compact = false }) {
  const { data: entitlements, isLoading } = useDuewiseEntitlements()

  if (isLoading || !entitlements) return null

  const isTrial = Boolean(entitlements.is_trial)
  const isBase = entitlements.plan === 'base'
  const hasInvoiceLimit = entitlements.invoice_limit != null
  const invoiceCount = entitlements.invoice_count ?? 0
  const invoiceLimit = entitlements.invoice_limit ?? (isTrial ? 10 : isBase ? 500 : null)
  const remaining =
    entitlements.invoices_remaining ??
    (invoiceLimit != null ? Math.max(0, invoiceLimit - invoiceCount) : null)
  const canCreate = entitlements.can_create_invoice !== false
  const limitReached = isTrial
    ? !canCreate || invoiceCount >= 10
    : !canCreate || (invoiceLimit != null && invoiceCount >= invoiceLimit)
  const percentage = invoiceLimit ? Math.min(100, Math.round((invoiceCount / invoiceLimit) * 100)) : 0

  const shouldShow =
    isTrial ||
    isBase ||
    hasInvoiceLimit ||
    limitReached ||
    Boolean(entitlements.upgrade_prompt?.required)

  if (!shouldShow) {
    return null
  }

  if (compact) {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2.5 rounded-xl border px-3 py-2 text-xs',
          limitReached
            ? 'border-rose-200 bg-rose-50/80 text-rose-900'
            : 'border-emerald-200/80 bg-emerald-50/60 text-emerald-900',
          className
        )}
      >
        <div className="flex items-center gap-2">
          {limitReached ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          ) : (
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <span>
            {isTrial ? (
              <>
                <strong className="font-semibold">Trial Limit:</strong> {invoiceCount} /{' '}
                {invoiceLimit ?? 10} invoices used
                {limitReached ? ' (Limit reached)' : ` (${remaining} remaining)`}
              </>
            ) : (
              <>
                <strong className="font-semibold">{entitlements.plan_name || 'Base Plan'}:</strong>{' '}
                {invoiceCount} / {invoiceLimit ?? 500} invoices used
                {limitReached ? ' (Limit reached)' : ` (${remaining} remaining)`}
              </>
            )}
          </span>
        </div>
        <Link
          to="/app/billing?product=duewise"
          className={cn(
            'inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline',
            limitReached ? 'text-rose-700' : 'text-emerald-700'
          )}
        >
          {isTrial ? 'Upgrade plan' : 'Upgrade to Big Books'} <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-sm',
        limitReached
          ? 'border-rose-300/80 bg-gradient-to-r from-rose-50 via-white to-amber-50/40 text-slate-900'
          : 'border-emerald-200/90 bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/40 text-slate-900',
        className
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={limitReached ? 'destructive' : 'emerald'}
              className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
            >
              {isTrial ? 'Free Trial' : entitlements.plan_name || 'Base Plan'}
            </Badge>

            {isTrial ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  <Mail className="h-3 w-3 text-emerald-600" />
                  Email-only reminders
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <Lock className="h-3 w-3 text-slate-400" />
                  SMS, WhatsApp & Smart AI on Base
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100/80 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  WhatsApp, SMS & Smart AI Included
                </span>
                {entitlements.cycle_end && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    Cycle resets{' '}
                    {new Date(entitlements.cycle_end).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-tight sm:text-base">
              {limitReached ? (
                <span className="text-rose-700">
                  {isTrial
                    ? `Trial invoice limit reached (${invoiceCount} of ${invoiceLimit ?? 10} created)`
                    : `Monthly invoice limit reached (${invoiceCount} of ${invoiceLimit ?? 500} created)`}
                </span>
              ) : (
                <span>
                  {isTrial
                    ? `Trial Account: ${remaining} of ${invoiceLimit ?? 10} invoices remaining`
                    : `${entitlements.plan_name || 'Base Plan'}: ${remaining} of ${invoiceLimit ?? 500} invoices remaining`}
                </span>
              )}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
              {limitReached
                ? isTrial
                  ? 'Trial accounts are capped at 10 invoices. Upgrade to the Base plan to unlock 500 invoices/month, multi-channel reminders (WhatsApp & SMS), and Smart Channel AI.'
                  : `You have reached your limit of ${invoiceLimit ?? 500} invoices for this billing cycle. Upgrade to Big Books for unlimited active invoices.`
                : isTrial
                  ? 'Free trial allows up to 10 invoices and reminders via Email. Upgrade at any time to remove restrictions.'
                  : `Your ${entitlements.plan_name || 'Base Plan'} includes ${invoiceLimit ?? 500} invoices per billing cycle with automated reminders across Email, WhatsApp, SMS, and Smart AI.`}
            </p>
          </div>

          {/* Progress bar */}
          {invoiceLimit != null && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>
                  Usage:{' '}
                  <strong className="text-slate-900 font-semibold">
                    {invoiceCount} / {invoiceLimit} invoices
                  </strong>
                </span>
                <span className={limitReached ? 'font-bold text-rose-600' : 'text-slate-500'}>
                  {percentage}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full transition-all',
                    limitReached
                      ? 'bg-rose-600'
                      : percentage >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                  )}
                />
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 pt-1 lg:pt-0">
          <Link to="/app/billing?product=duewise">
            <Button
              type="button"
              className={cn(
                'w-full shadow-md sm:w-auto',
                limitReached
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25 text-white'
                  : 'shadow-emerald-600/20'
              )}
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {isTrial
                  ? 'Upgrade to Base Plan'
                  : entitlements.upgrade_prompt?.target_plan === 'big_books' || !isTrial
                    ? 'Upgrade to Big Books'
                    : 'Upgrade Plan'}
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
