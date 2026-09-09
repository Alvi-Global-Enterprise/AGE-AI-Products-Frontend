import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/utils'
import { getUserMessage } from '@/shared/errors/errorHandler'

/**
 * Cancel subscription / trial — period-end (default) or immediate.
 */
export function CancelPlanModal({
  open,
  onClose,
  productName = 'DueWise',
  planLabel,
  endsHint,
  isPending,
  error,
  onConfirm,
}) {
  const [mode, setMode] = useState('period_end') // period_end | immediate

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancel plan"
      description={`Choose how you want to end your ${productName} plan.`}
    >
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-100">
          <p>
            Current plan:{' '}
            <span className="font-semibold text-slate-900">{planLabel || 'Active plan'}</span>
          </p>
          {endsHint && <p className="mt-1 text-xs text-slate-500">{endsHint}</p>}
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => setMode('period_end')}
            className={cn(
              'rounded-xl border px-3 py-3 text-left transition',
              mode === 'period_end'
                ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                : 'border-slate-200 hover:bg-slate-50'
            )}
          >
            <p className="text-sm font-semibold text-slate-900">Cancel at period end</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Keep full access until the current billing period finishes. Recommended.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setMode('immediate')}
            className={cn(
              'rounded-xl border px-3 py-3 text-left transition',
              mode === 'immediate'
                ? 'border-rose-400 bg-rose-50/50 ring-1 ring-rose-400/20'
                : 'border-slate-200 hover:bg-slate-50'
            )}
          >
            <p className="text-sm font-semibold text-slate-900">Cancel immediately</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Access ends right away. You may lose remaining prepaid time.
            </p>
          </button>
        </div>

        {mode === 'immediate' && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900 ring-1 ring-amber-100">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Immediate cancellation cannot be undone from this screen. You can subscribe again later.
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {getUserMessage(error)}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Keep plan
          </Button>
          <Button
            type="button"
            variant={mode === 'immediate' ? 'danger' : 'secondary'}
            disabled={isPending}
            onClick={() => onConfirm?.(mode === 'immediate')}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancelling…
              </>
            ) : mode === 'immediate' ? (
              'Cancel now'
            ) : (
              'Confirm cancellation'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
