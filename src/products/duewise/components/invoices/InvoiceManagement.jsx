import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Mail,
  Smartphone,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Clock,
  X,
  Filter,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Skeleton'
import { Tooltip } from '@/components/ui/Tooltip'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, cn } from '@/lib/utils'
import { INVOICES } from '@/data/mockData'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'overdue', label: 'Overdue' },
]

const CHANNEL_ICON = {
  email: Mail,
  sms: Smartphone,
  whatsapp: MessageSquare,
}

const FILTER_TAGS = ['enterprise', 'priority', 'saas', 'agency', 'retail', 'healthcare', 'logistics']

function StatusTabs({ active, onChange, counts }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
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
          <span
            className={cn(
              'relative z-10 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
              active === tab.id ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/60 text-slate-500'
            )}
          >
            {counts[tab.id]}
          </span>
        </button>
      ))}
    </div>
  )
}

function SyncBadge({ status }) {
  if (status === 'synced') {
    return (
      <Tooltip content="Synced with QuickBooks">
        <Badge variant="synced">
          <CheckCircle2 className="h-3 w-3" /> Synced
        </Badge>
      </Tooltip>
    )
  }
  if (status === 'pending') {
    return (
      <Tooltip content="Sync in progress">
        <Badge variant="pending">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      </Tooltip>
    )
  }
  return (
    <Tooltip content="QuickBooks sync error — retry">
      <Badge variant="error">
        <AlertCircle className="h-3 w-3" /> Error
      </Badge>
    </Tooltip>
  )
}

export function InvoiceManagement() {
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [invoices, setInvoices] = useState(INVOICES)
  const [toast, setToast] = useState(null)
  const [confirmPaid, setConfirmPaid] = useState(null)

  const counts = useMemo(
    () => ({
      all: invoices.length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      unpaid: invoices.filter((i) => i.status === 'unpaid').length,
      overdue: invoices.filter((i) => i.status === 'overdue').length,
    }),
    [invoices]
  )

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (tab !== 'all' && inv.status !== tab) return false
      if (query) {
        const q = query.toLowerCase()
        if (
          !inv.client.toLowerCase().includes(q) &&
          !inv.id.toLowerCase().includes(q) &&
          !inv.email.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (activeTags.length > 0 && !activeTags.every((t) => inv.tags.includes(t))) {
        return false
      }
      return true
    })
  }, [invoices, tab, query, activeTags])

  const toggleTag = (tag) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2800)
  }

  const markPaid = (id) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: 'paid', overdueDays: 0, paidAt: new Date().toISOString() } : inv
      )
    )
    setConfirmPaid(null)
    showToast(`${id} marked as paid`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <StatusTabs active={tab} onChange={setTab} counts={counts} />

        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client or invoice…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
          />
        </div>
      </div>

      {/* Multi-tag filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
          <Filter className="h-3.5 w-3.5" /> Filters:
        </span>
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition cursor-pointer',
              activeTags.includes(tag)
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
            )}
          >
            {tag}
          </button>
        ))}
        {activeTags.length > 0 && (
          <button
            onClick={() => setActiveTags([])}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[900px] text-left">
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
                    AI Channel
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    QuickBooks
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((inv, i) => {
                    const ChannelIcon = CHANNEL_ICON[inv.channel]
                    return (
                      <motion.tr
                        key={inv.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                        className="group border-b border-slate-50 transition hover:bg-emerald-50/30"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar initials={inv.avatar} size="sm" colorIndex={i} />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{inv.client}</p>
                              <p className="text-[11px] text-slate-400">{inv.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium text-slate-800">{inv.id}</p>
                          <p className="text-[11px] text-slate-400">Due {inv.dueDate}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatCurrency(inv.amount)}
                          </p>
                          {inv.overdueDays > 0 && (
                            <p className="text-[11px] font-medium text-rose-600">
                              {inv.overdueDays}d overdue
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={inv.status} className="capitalize">
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={inv.channel}>
                            <ChannelIcon className="h-3 w-3" />
                            {inv.channel}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <SyncBadge status={inv.qbSync} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 opacity-80 transition group-hover:opacity-100">
                            {inv.status !== 'paid' && (
                              <Tooltip content="Manual mark as paid">
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
                            {inv.qbSync === 'error' && (
                              <Tooltip content="Retry QuickBooks sync">
                                <Button variant="outline" size="icon">
                                  <RefreshCw className="h-3.5 w-3.5" />
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

            {filtered.length === 0 && (
              <div className="px-4 py-16 text-center">
                <p className="text-sm font-medium text-slate-600">No invoices match your filters</p>
                <p className="mt-1 text-xs text-slate-400">Try adjusting search or clearing tags</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={!!confirmPaid}
        onClose={() => setConfirmPaid(null)}
        title="Mark as paid?"
        description={
          confirmPaid
            ? `Confirm payment received for ${confirmPaid.id} — ${confirmPaid.client} (${formatCurrency(confirmPaid.amount)}).`
            : ''
        }
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmPaid(null)}>
            Cancel
          </Button>
          <Button onClick={() => markPaid(confirmPaid.id)}>Confirm Paid</Button>
        </div>
      </Modal>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
