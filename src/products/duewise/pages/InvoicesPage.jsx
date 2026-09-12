import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { InvoiceManagement } from '@/products/duewise/components/invoices/InvoiceManagement'
import { Button } from '@/shared/components/ui/Button'
import { useQuickBooksSync } from '@/products/duewise/hooks/useDuewise'
import { useAccountsStatus } from '@/modules/billing/hooks/useBilling'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { cn } from '@/shared/lib/utils'

export default function InvoicesPage() {
  const sync = useQuickBooksSync()
  const { data: accounts } = useAccountsStatus()
  const qbConnected = Boolean(
    accounts?.quickbooks?.is_connected ?? accounts?.summary?.quickbooks_connected
  )
  const [toast, setToast] = useState(null)

  const handleSync = async () => {
    setToast(null)
    try {
      const res = await sync.mutateAsync({ full: false })
      const stats = res?.data
      const summary = stats
        ? `Synced ${stats.customers_synced ?? 0} customers · ${stats.invoices_synced ?? 0} invoices · ${stats.payments_synced ?? 0} payments`
        : res?.message || 'QuickBooks sync completed.'
      setToast({ type: 'success', message: summary })
    } catch (err) {
      setToast({
        type: 'error',
        message: getUserMessage(AppError.fromUnknown(err)),
      })
    } finally {
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage receivables, trigger AI reminders, and sync with QuickBooks.
          </p>
        </div>

        {qbConnected && (
          <Button
            type="button"
            variant="secondary"
            disabled={sync.isPending}
            onClick={handleSync}
            className={cn(
              'min-w-[9.5rem] border-emerald-200 bg-white text-emerald-800 shadow-sm',
              'hover:border-emerald-300 hover:bg-emerald-50',
              sync.isPending && 'pointer-events-none'
            )}
          >
            <RefreshCw
              className={cn('h-4 w-4 text-emerald-600', sync.isPending && 'animate-spin')}
            />
            {sync.isPending ? 'Syncing…' : 'Sync QuickBooks'}
          </Button>
        )}
      </motion.div>

      <AnimatePresence>
        {qbConnected && sync.isPending && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-white to-teal-50 px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-emerald-200" />
                <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-600" />
                <RefreshCw className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Syncing with QuickBooks…
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Importing customers, invoices, and payment statuses. This may take a moment.
                </p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    initial={{ width: '8%' }}
                    animate={{ width: ['12%', '72%', '88%'] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InvoiceManagement />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg"
          >
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
