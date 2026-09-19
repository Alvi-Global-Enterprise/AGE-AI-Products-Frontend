import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Loader2, Mail, Lock, Sparkles, AlertCircle } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { FormSelect } from '@/shared/components/ui/FormSelect'
import { useRemindInvoice, useDuewiseEntitlements } from '@/products/duewise/hooks/useDuewise'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'

/** POST /api/duewise/invoices/{id}/remind — channel + optional custom_message */
export function RemindInvoiceModal({ open, invoice, onClose, onSuccess }) {
  const remind = useRemindInvoice()
  const { data: entitlements } = useDuewiseEntitlements()

  const isTrial = Boolean(entitlements?.is_trial)
  const canUseEmail = entitlements ? entitlements.can_use_email !== false : true
  const canUseSms = Boolean(entitlements?.can_use_sms)
  const canUseWhatsapp = Boolean(entitlements?.can_use_whatsapp)
  const canUseSmartChannel = Boolean(entitlements?.can_use_smart_channel)

  // Default to 'email' if on trial or smart channel is disabled, otherwise 'auto'
  const defaultChannel = !canUseSmartChannel || isTrial ? 'email' : 'auto'
  const [channel, setChannel] = useState(defaultChannel)
  const [customMessage, setCustomMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !invoice) return
    setChannel(defaultChannel)
    setCustomMessage('')
    setError('')
  }, [open, invoice, defaultChannel])

  if (!invoice) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send reminder"
      description={`${invoice.number || `Invoice #${invoice.id}`} — choose channel and optional message.`}
      size="md"
    >
      <div className="space-y-4">
        {isTrial && (
          <div className="rounded-xl border border-amber-200/90 bg-amber-50/75 p-3.5 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-950">
                  Trial Mode: Email Reminders Only
                </p>
                <p className="text-amber-800 leading-relaxed">
                  On the free trial, payment reminders can only be sent via Email. Upgrade to the
                  Base plan to unlock WhatsApp, SMS, and Smart Channel AI.
                </p>
                <div className="pt-1">
                  <Link
                    to="/app/billing?product=duewise"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-900 underline"
                  >
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    Upgrade to Base Plan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <FormSelect
            id="remind-channel"
            label="Channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option value="email" disabled={!canUseEmail}>
              Email {canUseEmail ? '(Available)' : '(Unavailable)'}
            </option>
            <option value="auto" disabled={!canUseSmartChannel}>
              Auto (Smart Channel AI) {!canUseSmartChannel ? '— Base Plan only' : ''}
            </option>
            <option value="whatsapp" disabled={!canUseWhatsapp}>
              WhatsApp {!canUseWhatsapp ? '— Base Plan only' : ''}
            </option>
            <option value="sms" disabled={!canUseSms}>
              SMS {!canUseSms ? '— Base Plan only' : ''}
            </option>
          </FormSelect>
          {!canUseSmartChannel && isTrial && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
              <Lock className="h-3 w-3 text-slate-400" />
              WhatsApp, SMS, and Smart AI require an active Base plan subscription.
            </p>
          )}
        </div>

        <div className="w-full">
          <label
            htmlFor="remind-message"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Custom message (optional)
          </label>
          <textarea
            id="remind-message"
            rows={4}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Leave blank to use the default reminder template."
            className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div className="space-y-1">
                <p>{error}</p>
                {error.includes('upgrade') && (
                  <Link
                    to="/app/billing?product=duewise"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 font-semibold text-rose-800 underline"
                  >
                    Upgrade Plan <Sparkles className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={remind.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={remind.isPending}
            onClick={async () => {
              setError('')
              const payload = { channel }
              if (customMessage.trim()) payload.custom_message = customMessage.trim()
              try {
                const res = await remind.mutateAsync({ id: invoice.id, ...payload })
                onSuccess?.(res)
                onClose()
              } catch (err) {
                setError(getUserMessage(AppError.fromUnknown(err)))
              }
            }}
          >
            {remind.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Send reminder
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

