/** Invoice status values from DueWise API */
export const INVOICE_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'partially_paid', label: 'Partially paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'written_off', label: 'Written off' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function invoiceStatusBadgeVariant(status) {
  switch (status) {
    case 'open':
      return 'unpaid'
    case 'paid':
      return 'paid'
    case 'overdue':
      return 'overdue'
    case 'draft':
    case 'cancelled':
    case 'written_off':
      return 'default'
    case 'partially_paid':
      return 'pending'
    default:
      return 'unpaid'
  }
}

export function formatInvoiceStatus(status) {
  return String(status || '').replaceAll('_', ' ')
}
