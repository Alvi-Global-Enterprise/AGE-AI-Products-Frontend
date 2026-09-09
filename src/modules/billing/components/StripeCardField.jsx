import { CardElement } from '@stripe/react-stripe-js'
import { cn } from '@/shared/lib/utils'

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#0f172a',
      fontFamily: 'inherit',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#e11d48' },
  },
}

/** Stripe Card Element styled to match AuthField / form controls */
export function StripeCardField({ error, className }) {
  return (
    <div className={cn('w-full', className)}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">Card details</label>
      <div
        className={cn(
          'rounded-2xl border bg-white px-4 py-3.5 transition',
          'focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20',
          error
            ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-500/15'
            : 'border-slate-200 hover:border-slate-300'
        )}
      >
        <CardElement options={CARD_OPTIONS} />
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
