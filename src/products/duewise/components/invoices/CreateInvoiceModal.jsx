import { FieldArray, Form, Formik } from 'formik'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Loader2, AlertTriangle, Sparkles } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { FormikAuthField } from '@/modules/auth/components/FormikAuthField'
import { FormikSelect } from '@/modules/auth/components/FormikSelect'
import { FormikClientSelect } from '@/shared/components/FormikClientSelect'
import { useClientsOptions } from '@/modules/clients/hooks/useClients'
import { useCreateInvoice, useDuewiseEntitlements } from '@/products/duewise/hooks/useDuewise'
import {
  invoiceInitialValues,
  invoiceSchema,
  toInvoicePayload,
} from '@/products/duewise/validation/invoice.schema'
import { CURRENCIES } from '@/shared/constants/config'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { formatCurrency } from '@/shared/lib/utils'
import { MIN_INVOICE_USD, minInvoiceAmount, toUsd } from '@/shared/lib/currencyRates'

function lineSubtotal(item) {
  const qty = Number(item.quantity) || 0
  const unit = Number(item.unit_amount) || 0
  const tax = Number(item.tax_amount) || 0
  return qty * unit + tax
}

/** Match invoice <select> values (lowercase ISO codes). */
function invoiceCurrencyFromClient(client) {
  const raw = String(client?.currency || '').trim().toLowerCase()
  if (!raw) return null
  const known = CURRENCIES.find((c) => c.value.toLowerCase() === raw)
  return known ? known.value.toLowerCase() : raw
}

/** When client_id changes, default currency from that client's currency (still editable). */
function SyncCurrencyFromClient({ clients, clientId, setFieldValue }) {
  const lastAppliedClientId = useRef(null)

  useEffect(() => {
    if (!clientId) {
      lastAppliedClientId.current = null
      return
    }
    if (String(lastAppliedClientId.current) === String(clientId)) return

    const client = clients.find((c) => String(c.id) === String(clientId))
    if (!client) return

    const code = invoiceCurrencyFromClient(client)
    if (code) setFieldValue('currency', code, false)
    lastAppliedClientId.current = clientId
  }, [clientId, clients, setFieldValue])

  return null
}

export function CreateInvoiceModal({ open, onClose }) {
  const createInvoice = useCreateInvoice()
  const { data: clients = [], isLoading: clientsLoading } = useClientsOptions()
  const { data: entitlements } = useDuewiseEntitlements()

  const isTrial = Boolean(entitlements?.is_trial)
  const isBase = entitlements?.plan === 'base'
  const canCreate = entitlements ? entitlements.can_create_invoice !== false : true
  const invoiceCount = entitlements?.invoice_count ?? 0
  const invoiceLimit = entitlements?.invoice_limit ?? (isTrial ? 10 : isBase ? 500 : null)
  const remaining =
    entitlements?.invoices_remaining ??
    (invoiceLimit != null ? Math.max(0, invoiceLimit - invoiceCount) : null)

  const modalDescription = isTrial
    ? `Create an invoice for a client (${remaining} of ${invoiceLimit ?? 10} trial invoices remaining).`
    : invoiceLimit != null
      ? `Create an invoice for a client (${remaining} of ${invoiceLimit} invoices remaining in current cycle).`
      : 'Create an invoice for a client. Syncs to QuickBooks when connected.'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Invoice"
      description={modalDescription}
      size="lg"
    >
      {open && (
        <Formik
          initialValues={invoiceInitialValues}
          validationSchema={invoiceSchema}
          validateOnChange={false}
          onSubmit={async (values, { setErrors, setStatus, resetForm }) => {
            setStatus(undefined)
            try {
              await createInvoice.mutateAsync(toInvoicePayload(values))
              resetForm()
              onClose()
            } catch (err) {
              const appError = AppError.fromUnknown(err)
              appError.applyToFormik(setErrors)
              setStatus(getUserMessage(appError))
            }
          }}
        >
          {({ values, isSubmitting, status, errors, setFieldValue }) => {
            const estimatedTotal = (values.line_items || []).reduce(
              (sum, item) => sum + lineSubtotal(item),
              0
            )
            const selectedClient = clients.find(
              (c) => String(c.id) === String(values.client_id)
            )
            const clientCurrencyLabel = invoiceCurrencyFromClient(selectedClient)?.toUpperCase()

            return (
              <Form className="flex flex-col" noValidate>
                <SyncCurrencyFromClient
                  clients={clients}
                  clientId={values.client_id}
                  setFieldValue={setFieldValue}
                />

                <div className="max-h-[min(70vh,560px)] space-y-4 overflow-y-auto pr-1">
                  {!canCreate && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-900">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                        <div className="space-y-1">
                          <p className="font-semibold text-rose-950">
                            {isTrial
                              ? `Trial limit reached (${invoiceLimit ?? 10} / ${invoiceLimit ?? 10} invoices created)`
                              : `Invoice limit reached (${invoiceLimit ?? 500} / ${invoiceLimit ?? 500} invoices created)`}
                          </p>
                          <p className="text-rose-800">
                            {isTrial
                              ? 'Trial accounts are limited to a maximum of 10 invoices. Please upgrade to the Base plan to create up to 500 invoices per month.'
                              : `You have reached your limit of ${invoiceLimit ?? 500} invoices for this billing cycle. Please upgrade to the Big Books plan for unlimited active invoices.`}
                          </p>
                          <div className="pt-1.5">
                            <Link to="/app/billing?product=duewise" onClick={onClose}>
                              <Button
                                size="sm"
                                type="button"
                                className="bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                {isTrial ? 'Upgrade to Base Plan' : 'Upgrade to Big Books'}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <FormikClientSelect
                    name="client_id"
                    clients={clients}
                    loading={clientsLoading}
                    onAddClient={onClose}
                    onSelect={(client) => {
                      const code = invoiceCurrencyFromClient(client)
                      if (code) setFieldValue('currency', code, false)
                    }}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <FormikSelect name="currency" label="Currency">
                        {CURRENCIES.map((c) => (
                          <option key={c.value} value={c.value.toLowerCase()}>
                            {c.label}
                          </option>
                        ))}
                      </FormikSelect>
                      {clientCurrencyLabel && (
                        <p className="mt-1.5 text-[11px] text-slate-400">
                          Default from client ({clientCurrencyLabel}) — you can change it.
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormikAuthField name="issue_date" label="Issue date" type="date" />
                      <FormikAuthField name="due_date" label="Due date" type="date" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Line items
                      </p>
                      {typeof errors.line_items === 'string' && (
                        <p className="text-xs text-rose-600">{errors.line_items}</p>
                      )}
                    </div>

                    <FieldArray name="line_items">
                      {({ push, remove }) => (
                        <div className="space-y-3">
                          {values.line_items.map((item, index) => (
                            <div
                              key={index}
                              className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-medium text-slate-600">
                                  Item {index + 1}
                                </p>
                                {values.line_items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove
                                  </button>
                                )}
                              </div>
                              <div className="space-y-3">
                                <FormikAuthField
                                  name={`line_items.${index}.description`}
                                  label="Description"
                                  placeholder="Custom Software Engineering Services"
                                />
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <FormikAuthField
                                    name={`line_items.${index}.quantity`}
                                    label="Quantity"
                                    type="number"
                                    min="0"
                                    step="any"
                                  />
                                  <FormikAuthField
                                    name={`line_items.${index}.unit_amount`}
                                    label="Unit amount"
                                    type="number"
                                    min="0"
                                    step="any"
                                  />
                                  <FormikAuthField
                                    name={`line_items.${index}.tax_amount`}
                                    label="Tax amount"
                                    type="number"
                                    min="0"
                                    step="any"
                                  />
                                </div>
                                <p className="text-right text-xs text-slate-500">
                                  Line total:{' '}
                                  <span className="font-semibold text-slate-800">
                                    {formatCurrency(lineSubtotal(item), {
                                      currency: values.currency || 'usd',
                                    })}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              push({
                                description: '',
                                quantity: 1,
                                unit_amount: '',
                                tax_amount: 0,
                              })
                            }
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add line item
                          </Button>
                        </div>
                      )}
                    </FieldArray>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Estimated total</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(estimatedTotal, {
                          currency: values.currency || 'usd',
                        })}
                      </span>
                    </div>
                    {(() => {
                      const minLocal = minInvoiceAmount(values.currency)
                      const usdEq = toUsd(estimatedTotal, values.currency)
                      const belowMin = usdEq + 1e-9 < MIN_INVOICE_USD
                      return (
                        <p
                          className={
                            belowMin
                              ? 'mt-1 text-[11px] font-medium text-rose-600'
                              : 'mt-1 text-[11px] text-slate-400'
                          }
                        >
                          Minimum ≈ {formatCurrency(minLocal, { currency: values.currency || 'usd' })}{' '}
                          (${MIN_INVOICE_USD} USD equivalent)
                          {belowMin ? ' — increase line items to continue.' : ''}
                        </p>
                      )
                    })()}
                  </div>

                  {status && <p className="text-sm text-rose-600">{status}</p>}
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
              Cancel
            </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || createInvoice.isPending || !canCreate}
                  >
                    {isSubmitting || createInvoice.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating…
                      </>
                    ) : !canCreate ? (
                      'Limit Reached (Upgrade)'
                    ) : (
                      'Create invoice'
                    )}
                  </Button>
          </div>
              </Form>
            )
          }}
        </Formik>
      )}
    </Modal>
  )
}
