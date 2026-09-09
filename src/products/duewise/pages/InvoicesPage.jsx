import { motion } from 'framer-motion'
import { InvoiceManagement } from '@/products/duewise/components/invoices/InvoiceManagement'

export default function InvoicesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Invoices
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage receivables, trigger AI reminders, and sync with QuickBooks.
        </p>
      </motion.div>

      <InvoiceManagement />
    </div>
  )
}
