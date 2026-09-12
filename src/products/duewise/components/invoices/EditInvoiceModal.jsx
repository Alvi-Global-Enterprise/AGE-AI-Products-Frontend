import { FieldArray, Form, Formik } from 'formik'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { FormikAuthField } from '@/modules/auth/components/FormikAuthField'
import { FormikSelect } from '@/modules/auth/components/FormikSelect'
import { FormikClientSelect } from '@/shared/components/FormikClientSelect'
import { useClientsOptions } from '@/modules/clients/hooks/useClients'
import { useInvoice, useUpdateInvoice } from '@/products/duewise/hooks/useDuewise'
import {
  invoiceSchema,
  invoiceToFormValues,
  toInvoicePayload,
} from '@/products/duewise/validation/invoice.schema'
import { INVOICE_STATUSES } from '@/products/duewise/constants/invoiceStatus'
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

/**
 * Full invoice edit — same fields as create + status.
 * PUT /api/duewise/invoices/{id}
 */
export function EditInvoiceModal({ open, invoiceId, onClose }) {
  const updateInvoice = useUpdateInvoice()
  const { data: clients = [], isLoading: clientsLoading } = useClientsOptions()
  const {
    data: invoice,
    isLoading,
    isError,
    error,
    refetch,
  } = useInvoice(invoiceId, { enabled: open && Boolean(invoiceId) })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit invoice"
      description={
        invoice
          ? `${invoice.number || `Invoice #${invoice.id}`} — update create fields.`
          : 'Loading invoice details…'
      }
      size="lg"
    >
      {isLoading && (
        <div className="space-y-3 py-2">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="space-y-3 py-2">
          <p className="text-sm text-rose-600">{getUserMessage(error)}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && invoice && (
        <Formik
          enableReinitialize
          initialValues={invoiceToFormValues(invoice)}
          validationSchema={invoiceSchema}
          validateOnChange={false}
          onSubmit={async (values, { setErrors, setStatus }) => {
            setStatus(undefined)
            try {
              await updateInvoice.mutateAsync({
                id: invoice.id,
                ...toInvoicePayload(values, { includeStatus: true }),
              })
              onClose()
            } catch (err) {
              const appError = AppError.fromUnknown(err)
              appError.applyToFormik(setErrors)
              setStatus(getUserMessage(appError))
            }
          }}
        >
          {({ values, isSubmitting, status, errors }) => {
            const estimatedTotal = (values.line_items || []).reduce(
              (sum, item) => sum + lineSubtotal(item),
              0
            )

            return (
              <Form className="flex flex-col" noValidate>
                <div className="max-h-[min(70vh,560px)] space-y-4 overflow-y-auto pr-1">
                  <FormikClientSelect
                    name="client_id"
                    clients={clients}
                    loading={clientsLoading}
                    onAddClient={onClose}
                  />

                  <FormikSelect name="status" label="Status">
                    {INVOICE_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </FormikSelect>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormikSelect name="currency" label="Currency">
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value.toLowerCase()}>
                          {c.label}
                        </option>
                      ))}
                    </FormikSelect>
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
                  <Button type="submit" disabled={isSubmitting || updateInvoice.isPending}>
                    {isSubmitting || updateInvoice.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save changes'
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
