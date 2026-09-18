import * as Yup from 'yup'
import { INVOICE_STATUSES } from '@/products/duewise/constants/invoiceStatus'
import {
  MIN_INVOICE_USD,
  lineItemsTotal,
  minInvoiceAmount,
  toUsd,
} from '@/shared/lib/currencyRates'

export const invoiceInitialValues = {
  client_id: '',
  currency: 'usd',
  issue_date: '',
  due_date: '',
  status: 'open',
  line_items: [
    {
      description: '',
      quantity: 1,
      unit_amount: '',
      tax_amount: 0,
    },
  ],
}

const statusValues = INVOICE_STATUSES.map((s) => s.value)

export const invoiceSchema = Yup.object({
  client_id: Yup.number()
    .typeError('Client is required')
    .required('Client is required')
    .integer('Invalid client'),
  currency: Yup.string().trim().length(3, 'Use a 3-letter currency code'),
  issue_date: Yup.string()
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Use YYYY-MM-DD', excludeEmptyString: true }),
  due_date: Yup.string()
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Use YYYY-MM-DD', excludeEmptyString: true }),
  status: Yup.string().oneOf(statusValues, 'Invalid status'),
  line_items: Yup.array()
    .of(
      Yup.object({
        description: Yup.string().trim().required('Description is required'),
        quantity: Yup.number()
          .typeError('Quantity must be a number')
          .min(0.01, 'Quantity must be positive')
          .required('Quantity is required'),
        unit_amount: Yup.number()
          .typeError('Unit amount must be a number')
          .min(0, 'Unit amount cannot be negative')
          .required('Unit amount is required'),
        tax_amount: Yup.number()
          .typeError('Tax must be a number')
          .min(0, 'Tax cannot be negative')
          .nullable(),
      })
    )
    .min(1, 'Add at least one line item')
    .test(
      'min-usd-equivalent',
      function minUsdEquivalent(items) {
        const currency = this.parent?.currency || 'usd'
        const total = lineItemsTotal(items)
        const usd = toUsd(total, currency)
        if (usd + 1e-9 >= MIN_INVOICE_USD) return true

        const minLocal = minInvoiceAmount(currency)
        const code = String(currency).toUpperCase()
        return this.createError({
          message: `Invoice total must be at least $${MIN_INVOICE_USD} USD equivalent (≈ ${minLocal.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${code}).`,
        })
      }
    ),
})

/** Map API invoice → Formik values */
export function invoiceToFormValues(invoice) {
  if (!invoice) return invoiceInitialValues

  const items = Array.isArray(invoice.line_items) ? invoice.line_items : []
  return {
    client_id: invoice.client_id ?? '',
    currency: String(invoice.currency || 'usd').toLowerCase(),
    issue_date: invoice.issue_date ? String(invoice.issue_date).slice(0, 10) : '',
    due_date: invoice.due_date ? String(invoice.due_date).slice(0, 10) : '',
    status: invoice.status || 'open',
    line_items:
      items.length > 0
        ? items.map((item) => ({
            description: item.description || '',
            quantity: item.quantity ?? 1,
            unit_amount: item.unit_amount ?? '',
            tax_amount: item.tax_amount ?? 0,
          }))
        : [...invoiceInitialValues.line_items],
  }
}

/** Build API payload — never sends invoice number */
export function toInvoicePayload(values, { includeStatus = false } = {}) {
  const payload = {
    client_id: Number(values.client_id),
  }

  if (values.currency?.trim()) payload.currency = values.currency.trim().toLowerCase()
  if (values.issue_date) payload.issue_date = values.issue_date
  if (values.due_date) payload.due_date = values.due_date
  if (includeStatus && values.status) payload.status = values.status

  const items = (values.line_items || [])
    .filter((item) => item.description?.trim())
    .map((item) => ({
      description: item.description.trim(),
      quantity: Number(item.quantity) || 1,
      unit_amount: Number(item.unit_amount),
      tax_amount: Number(item.tax_amount) || 0,
    }))

  if (items.length) payload.line_items = items

  return payload
}
