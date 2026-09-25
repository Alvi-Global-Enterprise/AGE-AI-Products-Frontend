import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Zap,
  Mail,
  MessageSquare,
  MessageCircle,
  Check,
  CheckCheck,
  X,
  Eye,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Send,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { PaginationControls } from '@/shared/components/ui/PaginationControls'
import {
  useReminderMode,
  useUpdateReminderMode,
  useReminderApprovals,
  useApproveReminder,
  useRejectReminder,
  useApproveAllReminders,
} from '@/products/duewise/hooks/useDuewise'
import { formatCurrency, cn } from '@/shared/lib/utils'
import { getUserMessage } from '@/shared/errors/errorHandler'

function ChannelIcon({ channel, className = 'h-4 w-4' }) {
  const norm = String(channel || '').toLowerCase()
  if (norm === 'sms') return <MessageSquare className={className} />
  if (norm === 'whatsapp') return <MessageCircle className={className} />
  return <Mail className={className} />
}

function channelBadgeStyle(channel) {
  const norm = String(channel || '').toLowerCase()
  if (norm === 'sms') return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
  if (norm === 'whatsapp') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
  return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
}

function stageLabel(stage) {
  if (!stage) return 'Automated Follow-up'
  return stage
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function ApprovalRequestsPage() {
  const [page, setPage] = useState(1)
  const [channelFilter, setChannelFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Modals state
  const [rejectingItem, setRejectingItem] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [previewItem, setPreviewItem] = useState(null)
  const [modeModalOpen, setModeModalOpen] = useState(false)
  const [approveAllModalOpen, setApproveAllModalOpen] = useState(false)
  const [selectedModeForEdit, setSelectedModeForEdit] = useState('approval')

  // API hooks
  const { data: modeData, isLoading: modeLoading, refetch: refetchMode } = useReminderMode()
  const {
    data: approvalsData,
    isLoading: approvalsLoading,
    isFetching: approvalsFetching,
    refetch: refetchApprovals,
    isError,
    error,
  } = useReminderApprovals({ page, per_page: 15 })

  const updateMode = useUpdateReminderMode()
  const approveReminder = useApproveReminder()
  const rejectReminder = useRejectReminder()
  const approveAllReminders = useApproveAllReminders()

  const currentMode = modeData?.duewise_mode || 'approval'
  const isAutopilot = currentMode === 'autopilot'
  const daysRemaining = modeData?.days_remaining ?? 30
  const meta = approvalsData?.meta || { current_page: 1, last_page: 1, total: 0 }

  // Filtered queue items
  const filteredItems = useMemo(() => {
    const rawItems = approvalsData?.data || []
    return rawItems.filter((item) => {
      if (channelFilter !== 'all' && item.channel?.toLowerCase() !== channelFilter) {
        return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const clientName = item.client?.name?.toLowerCase() || ''
        const companyName = item.client?.company_name?.toLowerCase() || ''
        const invoiceNum = item.invoice?.number?.toLowerCase() || ''
        const recipient = item.recipient?.toLowerCase() || ''
        const subject = item.subject?.toLowerCase() || ''
        if (
          !clientName.includes(q) &&
          !companyName.includes(q) &&
          !invoiceNum.includes(q) &&
          !recipient.includes(q) &&
          !subject.includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [approvalsData?.data, channelFilter, search])

  // Handlers
  const handleToggleMode = async (targetMode) => {
    await updateMode.mutateAsync(targetMode)
  }

  const handleOpenEditMode = () => {
    setSelectedModeForEdit(currentMode)
    setModeModalOpen(true)
  }

  const handleSaveMode = async () => {
    await updateMode.mutateAsync(selectedModeForEdit)
    setModeModalOpen(false)
  }

  const handleApprove = async (id) => {
    await approveReminder.mutateAsync(id)
  }

  const handleConfirmReject = async () => {
    if (!rejectingItem) return
    await rejectReminder.mutateAsync({
      id: rejectingItem.id,
      reason: rejectionReason.trim() || undefined,
    })
    setRejectingItem(null)
    setRejectionReason('')
  }

  const handleConfirmApproveAll = async () => {
    await approveAllReminders.mutateAsync()
    setApproveAllModalOpen(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Approval Requests
            </h1>
            <Badge
              className={cn(
                'text-xs font-semibold',
                isAutopilot
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
              )}
            >
              {isAutopilot ? 'Auto-Pilot Active' : 'Approval Mode'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Review, approve, or dismiss staged automated milestone reminders before customer dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={approvalsFetching || modeLoading}
            onClick={() => {
              refetchMode()
              refetchApprovals()
            }}
          >
            <RefreshCw
              className={cn('h-4 w-4', (approvalsFetching || modeLoading) && 'animate-spin')}
            />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleOpenEditMode}>
            <SlidersHorizontal className="h-4 w-4" />
            Mode Settings
          </Button>
        </div>
      </div>

      {/* Operational Mode Banner */}
      <Card
        className={cn(
          'overflow-hidden border transition',
          isAutopilot
            ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 shadow-sm'
            : 'border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 shadow-sm'
        )}
      >
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1',
                  isAutopilot
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20 ring-emerald-400/40'
                    : 'bg-amber-500 text-white shadow-amber-500/20 ring-amber-400/40'
                )}
              >
                {isAutopilot ? <Zap className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    {isAutopilot
                      ? 'DueWise Auto-Pilot Mode is Active'
                      : 'Outbound Approval Mode is Active'}
                  </h2>
                  {!isAutopilot && (
                    <Badge className="bg-amber-100/90 text-amber-800 ring-1 ring-amber-300">
                      {daysRemaining > 0 ? `${daysRemaining} safeguard days left` : 'Safeguard Mode'}
                    </Badge>
                  )}
                  {modeData?.default_tone && (
                    <Badge variant="secondary" className="capitalize">
                      Tone: {modeData.default_tone}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 max-w-2xl">
                  {isAutopilot
                    ? 'Automated milestone follow-ups are dispatched directly to customers using Smart Channel AI (Email, SMS, WhatsApp) without manual staging.'
                    : 'New daily reminder sequences are held in the queue below for your review. You can safely approve individually, dismiss, or graduate immediately to Auto-Pilot.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
              {isAutopilot ? (
                <Button
                  variant="secondary"
                  className="cursor-pointer border-slate-300 bg-white hover:bg-slate-50"
                  disabled={updateMode.isPending}
                  onClick={() => handleToggleMode('approval')}
                >
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Switch to Approval Mode
                </Button>
              ) : (
                <Button
                  className="cursor-pointer gradient-brand text-white shadow-md shadow-emerald-600/20 hover:brightness-105"
                  disabled={updateMode.isPending}
                  onClick={() => handleToggleMode('autopilot')}
                >
                  <Zap className="h-4 w-4" />
                  Graduate to Auto-Pilot
                </Button>
              )}
              <Button
                variant="outline"
                className="bg-white hover:bg-slate-50 text-slate-700"
                onClick={handleOpenEditMode}
              >
                Edit Mode
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Approvals Queue Section */}
      <div className="space-y-4">
        {/* Controls Bar: Filters & Bulk Action */}
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[240px] flex-1 sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search client, invoice, email…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
              </div>

              {/* Channel filter pills */}
              <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs">
                {['all', 'email', 'sms', 'whatsapp'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannelFilter(ch)}
                    className={cn(
                      'cursor-pointer rounded-lg px-2.5 py-1 font-medium capitalize transition',
                      channelFilter === ch
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {filteredItems.length > 0 && (
                <Button
                  className="cursor-pointer gradient-brand text-white shadow-xs"
                  disabled={approveAllReminders.isPending}
                  onClick={() => setApproveAllModalOpen(true)}
                >
                  <CheckCheck className="h-4 w-4" />
                  Approve All ({filteredItems.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {approvalsLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card>
            <CardContent className="space-y-3 p-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
              <p className="text-sm font-medium text-slate-800">Failed to load approvals queue</p>
              <p className="text-xs text-rose-600">{getUserMessage(error)}</p>
              <Button variant="secondary" onClick={() => refetchApprovals()}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!approvalsLoading && !isError && filteredItems.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <Check className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                All caught up! No pending approvals
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                {isAutopilot
                  ? 'DueWise Auto-Pilot is actively handling automated milestone reminders in the background.'
                  : 'There are currently no automated reminders awaiting review. When scheduled follow-ups are generated, they will stage here.'}
              </p>
              {isAutopilot ? (
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => handleToggleMode('approval')}
                >
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Switch back to Approval Mode
                </Button>
              ) : (
                <Button
                  className="mt-4 gradient-brand text-white"
                  onClick={() => handleToggleMode('autopilot')}
                >
                  <Zap className="h-4 w-4" />
                  Turn on Auto-Pilot
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Approvals Queue List */}
        {!approvalsLoading && !isError && filteredItems.length > 0 && (
          <div className="space-y-3.5">
            {filteredItems.map((item) => {
              const client = item.client || {}
              const invoice = item.invoice || {}
              const isOverdue = (invoice.days_overdue || 0) > 0

              return (
                <Card
                  key={item.id}
                  className="border border-slate-200 transition-all hover:border-emerald-200 hover:shadow-xs"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4">
                      {/* Item Top Metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize',
                              channelBadgeStyle(item.channel)
                            )}
                          >
                            <ChannelIcon channel={item.channel} className="h-3.5 w-3.5" />
                            {item.channel}
                          </span>

                          <Badge variant="secondary" className="text-xs">
                            {stageLabel(item.stage)}
                          </Badge>

                          <span className="text-xs font-medium text-slate-700">
                            Recipient: <span className="font-mono text-slate-900">{item.recipient}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {item.queued_at
                              ? new Date(item.queued_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Queued'}
                          </span>
                        </div>
                      </div>

                      {/* Invoice & Client Context Pill */}
                      <div className="grid gap-3 rounded-xl bg-slate-50/80 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="font-medium text-slate-400">Debtor / Client</p>
                          <p className="mt-0.5 font-semibold text-slate-900 truncate">
                            {client.name || 'Unnamed Client'}
                          </p>
                          {client.company_name && (
                            <p className="text-[11px] text-slate-500 truncate">{client.company_name}</p>
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-slate-400">Invoice</p>
                          {invoice.id ? (
                            <Link
                              to={`/products/duewise/invoices/${invoice.id}`}
                              className="mt-0.5 inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800"
                            >
                              {invoice.number || `INV-${invoice.id}`}
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          ) : (
                            <p className="mt-0.5 font-semibold text-slate-800">
                              {invoice.number || '—'}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-slate-400">Balance Due</p>
                          <p className="mt-0.5 font-semibold text-slate-900">
                            {formatCurrency(invoice.balance_due || invoice.total_amount || 0, {
                              currency: invoice.currency || 'USD',
                            })}
                          </p>
                        </div>

                        <div>
                          <p className="font-medium text-slate-400">Due Status</p>
                          <p className="mt-0.5 font-semibold">
                            {isOverdue ? (
                              <span className="text-rose-600">
                                {invoice.days_overdue} days overdue
                              </span>
                            ) : (
                              <span className="text-emerald-700">Due {invoice.due_date || 'soon'}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Reminder Content Box */}
                      <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
                        {item.subject && (
                          <p className="text-xs font-semibold text-slate-800 mb-1">
                            Subject: <span className="font-normal text-slate-700">{item.subject}</span>
                          </p>
                        )}
                        <p className="text-xs leading-relaxed text-slate-600 line-clamp-2 break-words">
                          {item.body}
                        </p>
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer text-xs text-slate-600 hover:text-slate-900"
                          onClick={() => setPreviewItem(item)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Read Full Message
                        </Button>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="cursor-pointer text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            disabled={rejectReminder.isPending}
                            onClick={() => setRejectingItem(item)}
                          >
                            <X className="h-3.5 w-3.5" />
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            className="cursor-pointer gradient-brand text-xs font-semibold text-white shadow-xs hover:brightness-105"
                            disabled={approveReminder.isPending}
                            onClick={() => handleApprove(item.id)}
                          >
                            <Send className="h-3.5 w-3.5" />
                            Approve & Dispatch
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {meta.last_page > 1 && (
              <div className="pt-2">
                <PaginationControls
                  currentPage={meta.current_page}
                  totalPages={meta.last_page}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Full Message Preview */}
      <Modal
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title="Outbound Reminder Preview"
        description="Inspect the generated AI message before granting approval."
      >
        {previewItem && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-slate-50 p-3.5 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Channel:</span>
                <span className="font-semibold text-slate-900 capitalize">{previewItem.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Recipient:</span>
                <span className="font-mono text-slate-900">{previewItem.recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Invoice:</span>
                <span className="font-semibold text-slate-900">
                  {previewItem.invoice?.number || `INV-${previewItem.invoice?.id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Outstanding Balance:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(previewItem.invoice?.balance_due || previewItem.invoice?.total_amount || 0)}
                </span>
              </div>
            </div>

            {previewItem.subject && (
              <div className="space-y-1">
                <p className="font-semibold text-slate-700">Subject Line</p>
                <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800">
                  {previewItem.subject}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <p className="font-semibold text-slate-700">Message Body</p>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {previewItem.body}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setPreviewItem(null)}>
                Close
              </Button>
              <Button
                variant="secondary"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  const target = previewItem
                  setPreviewItem(null)
                  setRejectingItem(target)
                }}
              >
                Dismiss Reminder
              </Button>
              <Button
                className="gradient-brand text-white"
                onClick={async () => {
                  const targetId = previewItem.id
                  setPreviewItem(null)
                  await handleApprove(targetId)
                }}
              >
                <Send className="h-3.5 w-3.5" />
                Approve & Send Now
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Dismiss / Reject with Reason */}
      <Modal
        open={Boolean(rejectingItem)}
        onClose={() => setRejectingItem(null)}
        title="Dismiss Pending Reminder"
        description="This reminder will be removed from the queue without sending to the customer."
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Reason for Dismissal (Optional)
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Client promised check payment in the mail, incorrect debtor phone, or paused contract."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => {
                setRejectingItem(null)
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              disabled={rejectReminder.isPending}
              onClick={handleConfirmReject}
            >
              {rejectReminder.isPending ? 'Dismissing…' : 'Confirm Dismissal'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Approve All Confirmation */}
      <Modal
        open={approveAllModalOpen}
        onClose={() => setApproveAllModalOpen(false)}
        title="Approve All Pending Reminders?"
        description="Are you sure you want to approve and dispatch all staged reminders?"
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            This action will immediately dispatch all{' '}
            <strong className="text-slate-900">{filteredItems.length} reminder(s)</strong> across their
            respective delivery channels (Email, SMS, WhatsApp).
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setApproveAllModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-brand text-white"
              disabled={approveAllReminders.isPending}
              onClick={handleConfirmApproveAll}
            >
              {approveAllReminders.isPending ? 'Approving…' : 'Yes, Dispatch All'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Edit Operational Mode (POST /api/duewise/reminders/mode) */}
      <Modal
        open={modeModalOpen}
        onClose={() => setModeModalOpen(false)}
        title="Configure Operational Mode"
        description="Select how DueWise handles outbound payment reminder sequences."
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-3">
            {/* Approval Mode Option */}
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
                selectedModeForEdit === 'approval'
                  ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              )}
            >
              <input
                type="radio"
                name="duewise_mode"
                value="approval"
                checked={selectedModeForEdit === 'approval'}
                onChange={() => setSelectedModeForEdit('approval')}
                className="mt-0.5 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Outbound Approval Mode (Staged Queue)
                </div>
                <p className="text-slate-500 leading-relaxed">
                  All automated reminders are held in your pending approvals queue. Nothing is sent
                  without your team reviewing or approving it first.
                </p>
              </div>
            </label>

            {/* Auto-Pilot Option */}
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
                selectedModeForEdit === 'autopilot'
                  ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              )}
            >
              <input
                type="radio"
                name="duewise_mode"
                value="autopilot"
                checked={selectedModeForEdit === 'autopilot'}
                onChange={() => setSelectedModeForEdit('autopilot')}
                className="mt-0.5 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  Auto-Pilot Mode (Direct Dispatch)
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Smart Channel AI automatically evaluates delinquency and sends timely reminders via
                  Email, SMS, or WhatsApp on autopilot without requiring manual review.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setModeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-brand text-white"
              disabled={updateMode.isPending}
              onClick={handleSaveMode}
            >
              {updateMode.isPending ? 'Saving…' : 'Save Mode'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
