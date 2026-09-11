import { useEffect, useState } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { FormSelect } from '@/shared/components/ui/FormSelect'
import { useRemindInvoice } from '@/products/duewise/hooks/useDuewise'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'

const REMIND_CHANNELS = [
  { value: 'auto', label: 'Auto (Smart Channel AI)' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

/** POST /api/duewise/invoices/{id}/remind — channel + optional custom_message */
export function RemindInvoiceModal({ open, invoice, onClose, onSuccess }) {
  const remind = useRemindInvoice()
  const [channel, setChannel] = useState('auto')
  const [customMessage, setCustomMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !invoice) return
    setChannel('auto')
    setCustomMessage('')
    setError('')
  }, [open, invoice])

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
        <FormSelect
          id="remind-channel"
          label="Channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          {REMIND_CHANNELS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FormSelect>

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

        {error && <p className="text-sm text-rose-600">{error}</p>}

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
