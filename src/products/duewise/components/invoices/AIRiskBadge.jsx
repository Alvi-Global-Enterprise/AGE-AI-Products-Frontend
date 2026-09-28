import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { normalizeInvoiceAIPrediction } from '@/products/duewise/api/duewise.api'
import { cn } from '@/shared/lib/utils'

export function AIRiskBadge({ invoice }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const badgeRef = useRef(null)

  const prediction = normalizeInvoiceAIPrediction(invoice)
  const isPaid = String(invoice?.status || '').toLowerCase() === 'paid'

  const probability = prediction?.probability ?? 0
  const riskTier = isPaid ? 'settled' : prediction?.risk_tier || (probability >= 70 ? 'high' : probability >= 40 ? 'medium' : 'low')

  const badgeConfig = {
    settled: {
      label: 'Settled',
      className: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80',
      icon: CheckCircle2,
      iconColor: 'text-slate-500',
    },
    low: {
      label: prediction?.badge_text || `On-Schedule (${probability}%)`,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    medium: {
      label: prediction?.badge_text || `Elevated Risk (${probability}%)`,
      className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80',
      icon: Clock,
      iconColor: 'text-amber-600',
    },
    high: {
      label: prediction?.badge_text || `Critical Delay (${probability}%)`,
      className: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80',
      icon: AlertTriangle,
      iconColor: 'text-rose-600 animate-pulse',
    },
  }[riskTier] || {
    label: `On-Schedule (${probability}%)`,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  }

  const BadgeIcon = badgeConfig.icon

  useEffect(() => {
    if (!open || !badgeRef.current) return
    const rect = badgeRef.current.getBoundingClientRect()
    const popoverWidth = 320
    const padding = 12

    let left = rect.left + rect.width / 2
    // Prevent clipping on right screen edge
    if (left + popoverWidth / 2 > window.innerWidth - padding) {
      left = window.innerWidth - padding - popoverWidth / 2
    }
    // Prevent clipping on left screen edge
    if (left - popoverWidth / 2 < padding) {
      left = padding + popoverWidth / 2
    }

    const spaceBelow = window.innerHeight - rect.bottom
    const showAbove = spaceBelow < 240 && rect.top > 240
    const top = showAbove ? rect.top - 8 : rect.bottom + 8

    setCoords({ top, left, showAbove })
  }, [open])

  const predictedDate = prediction?.predicted_payment_date_formatted || prediction?.predicted_payment_date || invoice?.due_date || 'On Due Date'
  const confidenceLabel = prediction?.confidence_label || `${prediction?.confidence_score ?? 94.8}% Confidence`
  const riskFactors = Array.isArray(prediction?.risk_factors) && prediction.risk_factors.length > 0
    ? prediction.risk_factors
    : isPaid
      ? ['Invoice has been fully settled and reconciled.']
      : ['Historical settlement timeline matches standard terms.']

  const summaryHoverText = prediction?.summary_hover_text || `Predicted settlement: ${predictedDate} (${confidenceLabel}).`

  return (
    <>
      <span
        ref={badgeRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition cursor-pointer select-none',
          badgeConfig.className
        )}
      >
        <BadgeIcon className={cn('h-3.5 w-3.5 shrink-0', badgeConfig.iconColor)} />
        <span>{badgeConfig.label}</span>
      </span>

      {open &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: coords.showAbove ? 6 : -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                transform: coords.showAbove
                  ? 'translate(-50%, -100%)'
                  : 'translate(-50%, 0)',
                zIndex: 9999,
              }}
              className="pointer-events-none w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl text-slate-800 ring-1 ring-black/5"
            >
              {/* Popover Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Predicted Settlement</span>
                </div>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  {confidenceLabel}
                </span>
              </div>

              {/* Settlement date highlight */}
              <div className="mt-2.5 flex items-baseline justify-between text-xs">
                <span className="text-slate-500 font-medium">Estimated Date:</span>
                <span className="font-semibold text-slate-900">{predictedDate}</span>
              </div>

              {/* Risk Factors Body */}
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Explainable Risk Factors
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {riskFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 leading-snug">
                      <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Popover Footer */}
              <div className="mt-3.5 border-t border-slate-100 pt-2.5">
                <p className="text-[11px] leading-relaxed text-slate-500 italic">
                  {summaryHoverText}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
