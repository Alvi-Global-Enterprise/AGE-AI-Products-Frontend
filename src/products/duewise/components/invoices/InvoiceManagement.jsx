import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Avatar } from '@/shared/components/ui/Skeleton'
import { Tooltip } from '@/shared/components/ui/Tooltip'
import { Modal } from '@/shared/components/ui/Modal'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { formatCurrency, cn } from '@/shared/lib/utils'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { ClientSearchSelect } from '@/shared/components/FormikClientSelect'
import { useClientsOptions } from '@/modules/clients/hooks/useClients'
import {
  useInvoices,
  useDeleteInvoice,
  useMarkInvoicePaid,
} from '@/products/duewise/hooks/useDuewise'
import { EditInvoiceModal } from '@/products/duewise/components/invoices/EditInvoiceModal'
import {
  formatInvoiceStatus,
  invoiceStatusBadgeVariant,
} from '@/products/duewise/constants/invoiceStatus'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'

const STATUS_TABS = [
  { id: 'all', label: 'All', status: null },
  { id: 'open', label: 'Open', status: 'open' },
  { id: 'sent', label: 'Sent', status: 'sent' },
  { id: 'overdue', label: 'Overdue', status: 'overdue' },
  { id: 'paid', label: 'Paid', status: 'paid' },
  { id: 'draft', label: 'Draft', status: 'draft' },
]

const PER_PAGE = 15

function initialsFromName(name = '') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?'
}

function StatusTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 p-1">
      {STATUS_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition cursor-pointer',
            active === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {active === tab.id && (
            <motion.span
              layoutId="invoice-tab"
              className="absolute inset-0 rounded-lg bg-white shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export function InvoiceManagement() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [clientId, setClientId] = useState('')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState(null)
  const [confirmPaid, setConfirmPaid] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editInvoiceId, setEditInvoiceId] = useState(null)

  const debouncedSearch = useDebouncedValue(query.trim(), 400)
  const statusFilter = STATUS_TABS.find((t) => t.id === tab)?.status || null

  const filters = useMemo(() => {
    const params = { page, per_page: PER_PAGE }
    if (statusFilter) params.status = statusFilter
    if (clientId) params.client_id = Number(clientId)
    if (debouncedSearch) params.search = debouncedSearch
    return params
  }, [page, statusFilter, clientId, debouncedSearch])

  const { data, isLoading, isFetching, isError, error, refetch } = useInvoices(filters)
  const { data: clients = [] } = useClientsOptions()
  const markPaid = useMarkInvoicePaid()
  const deleteInvoice = useDeleteInvoice()

  const invoices = data?.data ?? []
  const meta = data?.meta ?? {}
  const currentPage = meta.current_page || page
  const lastPage = meta.last_page || 1
  const total = meta.total ?? invoices.length

  const clientsById = useMemo(() => {
    const map = new Map()
    clients.forEach((c) => map.set(String(c.id), c))
    return map
  }, [clients])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2800)
  }

  const resetToFirstPage = () => setPage(1)

  const clientName = (inv) =>
    inv.client?.name || clientsById.get(String(inv.client_id))?.name || `Client #${inv.client_id}`

  const clientEmail = (inv) =>
    inv.client?.email || clientsById.get(String(inv.client_id))?.email || ''

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <StatusTabs
          active={tab}
          onChange={(id) => {
            setTab(id)
            resetToFirstPage()
          }}
        />

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:max-w-xl">
          <div className="relative min-w-0 flex-1 lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                resetToFirstPage()
              }}
              placeholder="Search number or client…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>
          <ClientSearchSelect
            className="shrink-0 sm:w-44"
            value={clientId}
            clients={clients}
            onChange={(id) => {
              setClientId(id)
              resetToFirstPage()
            }}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[960px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Aging
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-b border-slate-50">
                      <td className="px-4 py-3.5" colSpan={6}>
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </td>
                    </tr>
                  ))}

                {!isLoading && isError && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-sm text-rose-600">{getUserMessage(error)}</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => refetch()}
                      >
                        Retry
                      </Button>
                    </td>
                  </tr>
                )}

                <AnimatePresence mode="popLayout">
                  {!isLoading &&
                    !isError &&
                    invoices.map((inv, i) => {
                      const name = clientName(inv)
                      const email = clientEmail(inv)
                      return (
                        <motion.tr
                          key={inv.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.2 }}
                          className="group cursor-pointer border-b border-slate-50 transition hover:bg-emerald-50/30"
                          onClick={() => navigate(`/products/duewise/invoices/${inv.id}`)}
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar initials={initialsFromName(name)} size="sm" colorIndex={i} />
                              <div>
                                <p className="text-sm font-medium text-slate-900">{name}</p>
                                {email && (
                                  <p className="text-[11px] text-slate-400">{email}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-medium text-emerald-700 underline-offset-2 group-hover:underline">
                              {inv.number}
                            </p>
                            <p className="text-[11px] text-slate-400">Due {inv.due_date}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatCurrency(inv.total ?? inv.balance_due, {
                                currency: inv.currency,
                              })}
                            </p>
                            {inv.days_overdue > 0 && (
                              <p className="text-[11px] font-medium text-rose-600">
                                {inv.days_overdue}d overdue
                              </p>
                            )}
                            {inv.balance_due != null && inv.balance_due !== inv.total && (
                              <p className="text-[11px] text-slate-400">
                                Due{' '}
                                {formatCurrency(inv.balance_due, { currency: inv.currency })}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant={invoiceStatusBadgeVariant(inv.status)}
                              className="capitalize"
                            >
                              {formatInvoiceStatus(inv.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs font-medium text-slate-600">
                              {inv.aging_bucket || '—'}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1.5 opacity-80 transition group-hover:opacity-100">
                              <Tooltip content="View details">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    navigate(`/products/duewise/invoices/${inv.id}`)
                                  }
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </Tooltip>
                              {inv.status !== 'paid' && (
                                <Tooltip content="Edit invoice">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setEditInvoiceId(inv.id)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </Tooltip>
                              )}
                              {inv.status !== 'paid' && (
                                <Tooltip content="Mark as paid">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setConfirmPaid(inv)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span className="hidden xl:inline">Paid</span>
                                  </Button>
                                </Tooltip>
                              )}
                              {inv.status !== 'paid' && (
                                <Tooltip content="Delete invoice">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setConfirmDelete(inv)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                  </Button>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                </AnimatePresence>
              </tbody>
            </table>

            {!isLoading && !isError && invoices.length === 0 && (
              <div className="px-4 py-16 text-center">
                <p className="text-sm font-medium text-slate-600">No invoices match your filters</p>
                <p className="mt-1 text-xs text-slate-400">
                  Try clearing search, status, or client filters
                </p>
              </div>
            )}
          </div>

          {!isLoading && !isError && total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing {meta.from ?? 0}–{meta.to ?? 0} of {total}
                {isFetching ? ' · Updating…' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="min-w-[4.5rem] text-center text-xs font-medium text-slate-600">
                  Page {currentPage} / {lastPage}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= lastPage || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={!!confirmPaid}
        onClose={() => setConfirmPaid(null)}
        title="Mark as paid?"
        description={
          confirmPaid
            ? `Confirm payment for ${confirmPaid.number} — ${clientName(confirmPaid)} (${formatCurrency(confirmPaid.balance_due ?? confirmPaid.total, { currency: confirmPaid.currency })}).`
            : ''
        }
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmPaid(null)}>
            Cancel
          </Button>
          <Button
            disabled={markPaid.isPending}
            onClick={async () => {
              try {
                await markPaid.mutateAsync({ id: confirmPaid.id })
                setConfirmPaid(null)
                showToast(`${confirmPaid.number} marked as paid`)
              } catch (err) {
                showToast(getUserMessage(AppError.fromUnknown(err)))
              }
            }}
          >
            {markPaid.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Confirm Paid'
            )}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete invoice?"
        description={
          confirmDelete
            ? `This will delete ${confirmDelete.number}. This action cannot be undone.`
            : ''
        }
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={deleteInvoice.isPending}
            onClick={async () => {
              try {
                await deleteInvoice.mutateAsync(confirmDelete.id)
                setConfirmDelete(null)
                showToast(`${confirmDelete.number} deleted`)
              } catch (err) {
                showToast(getUserMessage(AppError.fromUnknown(err)))
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

      <EditInvoiceModal
        open={!!editInvoiceId}
        invoiceId={editInvoiceId}
        onClose={() => setEditInvoiceId(null)}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg"
          >
            {toast.toLowerCase().includes('fail') || toast.toLowerCase().includes('error') ? (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
