import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  Building2,
  Calendar,
  Hash,
  Bell,
  Route,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { Modal } from '@/shared/components/ui/Modal'
import { Drawer } from '@/shared/components/ui/Drawer'
import { formatCurrency } from '@/shared/lib/utils'
import {
  useInvoice,
  useDeleteInvoice,
  useMarkInvoicePaid,
} from '@/products/duewise/hooks/useDuewise'
import { EditInvoiceModal } from '@/products/duewise/components/invoices/EditInvoiceModal'
import { RemindInvoiceModal } from '@/products/duewise/components/invoices/RemindInvoiceModal'
import { InvoiceActivityFeed } from '@/products/duewise/components/invoices/InvoiceActivityFeed'
import {
  formatInvoiceStatus,
  invoiceStatusBadgeVariant,
} from '@/products/duewise/constants/invoiceStatus'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value || '—'}</p>
    </div>
  )
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: invoice, isLoading, isError, error, refetch } = useInvoice(id)
  const deleteInvoice = useDeleteInvoice()
  const markPaid = useMarkInvoicePaid()

  const [editOpen, setEditOpen] = useState(false)
  const [remindOpen, setRemindOpen] = useState(false)
  const [trackOpen, setTrackOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmPaid, setConfirmPaid] = useState(false)
  const [actionError, setActionError] = useState('')
  const [toast, setToast] = useState('')

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    )
  }

  if (isError || !invoice) {
    return (
      <div className="mx-auto max-w-lg space-y-3 p-8 text-center">
        <p className="text-sm text-rose-600">
          {isError ? getUserMessage(error) : 'Invoice not found.'}
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/products/duewise/invoices')}>
            Back to invoices
          </Button>
          {isError && (
            <Button variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          )}
        </div>
      </div>
    )
  }

  const currency = invoice.currency || 'usd'
  const lineItems = invoice.line_items || []

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <Link
            to="/products/duewise/invoices"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to invoices
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {invoice.number || `Invoice #${invoice.id}`}
            </h1>
            <Badge variant={invoiceStatusBadgeVariant(invoice.status)} className="capitalize">
              {formatInvoiceStatus(invoice.status)}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {invoice.client?.name || `Client #${invoice.client_id}`}
            {invoice.client?.email ? ` · ${invoice.client.email}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status !== 'paid' && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit invoice
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={() => setTrackOpen(true)}>
            <Route className="h-3.5 w-3.5" />
            Track status
          </Button>
          {invoice.status !== 'paid' && (
            <Button type="button" size="sm" onClick={() => setRemindOpen(true)}>
              <Bell className="h-3.5 w-3.5" />
              Remind
            </Button>
          )}
          {invoice.status !== 'paid' && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmPaid(true)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark paid
            </Button>
          )}
          {invoice.status !== 'paid' && (
            <Button type="button" variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </motion.div>

      {actionError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {actionError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Building2 className="h-4 w-4 text-slate-400" />
              Client
            </div>
            <DetailRow label="Name" value={invoice.client?.name} />
            <DetailRow label="Email" value={invoice.client?.email} />
            <DetailRow label="Phone" value={invoice.client?.phone} />
            <DetailRow label="Client ID" value={invoice.client_id} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Hash className="h-4 w-4 text-slate-400" />
              Invoice summary
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow
                label="Total"
                value={formatCurrency(invoice.total, { currency })}
              />
              <DetailRow
                label="Balance due"
                value={formatCurrency(invoice.balance_due, { currency })}
              />
              <DetailRow
                label="Amount paid"
                value={formatCurrency(invoice.amount_paid, { currency })}
              />
              <DetailRow
                label="Tax"
                value={formatCurrency(invoice.tax_total, { currency })}
              />
              <DetailRow label="Currency" value={String(currency).toUpperCase()} />
              <DetailRow label="Aging" value={invoice.aging_bucket} />
              <DetailRow
                label="Days overdue"
                value={invoice.days_overdue != null ? String(invoice.days_overdue) : null}
              />
              <DetailRow label="QuickBooks ID" value={invoice.quickbooks_id} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Calendar className="h-4 w-4 text-slate-400" />
            Dates & AI
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailRow label="Issue date" value={invoice.issue_date} />
            <DetailRow label="Due date" value={invoice.due_date} />
            <DetailRow label="Paid at" value={invoice.paid_at} />
            <DetailRow
              label="AI late probability"
              value={
                invoice.ai_predicted_late_probability != null
                  ? `${invoice.ai_predicted_late_probability}%`
                  : null
              }
            />
            <DetailRow
              label="AI predicted pay date"
              value={invoice.ai_predicted_payment_date}
            />
            <DetailRow
              label="Overdue recovered"
              value={invoice.is_overdue_recovered ? 'Yes' : 'No'}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">Line items</p>
            <p className="text-xs text-slate-500">
              {lineItems.length} item{lineItems.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Qty
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Unit
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                      No line items on this invoice.
                    </td>
                  </tr>
                )}
                {lineItems.map((item) => (
                  <tr key={item.id || item.description} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-sm text-slate-800">{item.description}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{item.quantity}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {formatCurrency(item.unit_amount, { currency })}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">
                      {formatCurrency(
                        item.total_amount ??
                          Number(item.quantity || 0) * Number(item.unit_amount || 0),
                        { currency }
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end border-t border-slate-100 px-5 py-4">
            <div className="space-y-1 text-right text-sm">
              <p className="text-slate-500">
                Subtotal{' '}
                <span className="font-medium text-slate-800">
                  {formatCurrency(invoice.subtotal, { currency })}
                </span>
              </p>
              <p className="text-base font-semibold text-slate-900">
                Total {formatCurrency(invoice.total, { currency })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Drawer
        open={trackOpen}
        onClose={() => setTrackOpen(false)}
        title="Track status"
        description={
          invoice.number
            ? `${invoice.number} · delivery & engagement`
            : 'Delivery & engagement timeline'
        }
        width="lg"
      >
        <InvoiceActivityFeed
          invoiceId={invoice.id}
          invoiceStatus={invoice.status}
          paidAt={invoice.paid_at}
          embedded
          enabled={trackOpen}
        />
      </Drawer>

      <EditInvoiceModal
        open={editOpen}
        invoiceId={invoice.id}
        onClose={() => setEditOpen(false)}
      />

      <RemindInvoiceModal
        open={remindOpen}
        invoice={invoice}
        onClose={() => setRemindOpen(false)}
        onSuccess={(res) => {
          const ch = res?.data?.channel || 'channel'
          setToast(res?.message || `Reminder sent via ${ch}.`)
          setTimeout(() => setToast(''), 3500)
        }}
      />

      <Modal
        open={confirmPaid}
        onClose={() => setConfirmPaid(false)}
        title="Mark as paid?"
        description={`Confirm payment for ${invoice.number} (${formatCurrency(invoice.balance_due ?? invoice.total, { currency })}).`}
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmPaid(false)}>
            Cancel
          </Button>
          <Button
            disabled={markPaid.isPending}
            onClick={async () => {
              setActionError('')
              try {
                await markPaid.mutateAsync({ id: invoice.id })
                setConfirmPaid(false)
              } catch (err) {
                setActionError(getUserMessage(AppError.fromUnknown(err)))
                setConfirmPaid(false)
              }
            }}
          >
            {markPaid.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Confirm paid'
            )}
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete invoice?"
        description={`This will delete ${invoice.number}. This action cannot be undone.`}
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={deleteInvoice.isPending}
            onClick={async () => {
              setActionError('')
              try {
                await deleteInvoice.mutateAsync(invoice.id)
                navigate('/products/duewise/invoices')
              } catch (err) {
                setActionError(getUserMessage(AppError.fromUnknown(err)))
                setConfirmDelete(false)
              }
            }}
          >
            {deleteInvoice.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg">
          <Bell className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
