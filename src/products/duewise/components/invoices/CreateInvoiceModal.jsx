import { FieldArray, Form, Formik } from 'formik'
import { useEffect, useRef } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { FormikAuthField } from '@/modules/auth/components/FormikAuthField'
import { FormikSelect } from '@/modules/auth/components/FormikSelect'
import { FormikClientSelect } from '@/shared/components/FormikClientSelect'
import { useClientsOptions } from '@/modules/clients/hooks/useClients'
import { useCreateInvoice } from '@/products/duewise/hooks/useDuewise'
import {
  invoiceInitialValues,
  invoiceSchema,
  toInvoicePayload,
} from '@/products/duewise/validation/invoice.schema'
import { CURRENCIES } from '@/shared/constants/config'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { formatCurrency } from '@/shared/lib/utils'

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Invoice"
      description="Create an invoice for a client. Syncs to QuickBooks when connected."
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
                    <p className="mt-1 text-[11px] text-slate-400">
                      Backend recalculates subtotal / tax_total / total from line items.
                    </p>
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
                  <Button type="submit" disabled={isSubmitting || createInvoice.isPending}>
                    {isSubmitting || createInvoice.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating…
                      </>
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
