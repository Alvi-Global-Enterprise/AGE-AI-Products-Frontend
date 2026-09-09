import { useState } from 'react'
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { CreditCard, Loader2, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { Modal } from '@/shared/components/ui/Modal'
import { FormikAuthField } from '@/modules/auth/components/FormikAuthField'
import { StripeCardField } from '@/modules/billing/components/StripeCardField'
import {
  usePaymentMethods,
  useAddPaymentMethod,
  useDeletePaymentMethod,
} from '@/modules/billing/hooks/useBilling'
import {
  normalizePaymentMethod,
  formatCardBrand,
  formatCardExpiry,
} from '@/modules/billing/lib/paymentMethods'
import { APP_CONFIG } from '@/shared/constants/config'
import { getStripe } from '@/shared/lib/stripe'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { cn } from '@/shared/lib/utils'

const addCardSchema = Yup.object({
  cardholder_name: Yup.string().trim().required('Cardholder name is required'),
})

function AddCardForm({ onSuccess, onCancel }) {
  const stripe = useStripe()
  const elements = useElements()
  const addCard = useAddPaymentMethod()
  const [cardError, setCardError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <Formik
      initialValues={{ cardholder_name: '' }}
      validationSchema={addCardSchema}
      validateOnChange={false}
      onSubmit={async (values) => {
        setCardError('')
        setFormError('')
        if (!stripe || !elements) {
          setFormError('Stripe has not loaded yet.')
          return
        }
        const card = elements.getElement(CardElement)
        if (!card) {
          setCardError('Card field is missing.')
          return
        }

        setSubmitting(true)
        try {
          const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card,
            billing_details: { name: values.cardholder_name.trim() },
          })
          if (error) {
            setCardError(error.message || 'Could not create payment method')
            return
          }

          await addCard.mutateAsync({ payment_method: paymentMethod.id })
          onSuccess?.()
        } catch (err) {
          setFormError(getUserMessage(AppError.fromUnknown(err)))
        } finally {
          setSubmitting(false)
        }
      }}
    >
      {({ isSubmitting }) => {
        const busy = submitting || isSubmitting || addCard.isPending
        return (
          <Form className="space-y-3" noValidate>
            <FormikAuthField
              name="cardholder_name"
              label="Cardholder name"
              placeholder="Sarah Jenkins"
              autoComplete="cc-name"
            />
            <StripeCardField error={cardError} />
            {formError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={!stripe || busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save card'
                )}
              </Button>
            </div>
          </Form>
        )
      }}
    </Formik>
  )
}

function AddCardModal({ open, onClose }) {
  const hasKey = Boolean(APP_CONFIG.stripePublishableKey)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add payment card"
      description="Card details are processed by Stripe and saved for future billing."
    >
      {!hasKey ? (
        <p className="text-sm text-amber-800">
          Add <code className="font-mono text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code> to continue.
        </p>
      ) : (
        <Elements stripe={getStripe()} key={String(open)}>
          <AddCardForm onSuccess={onClose} onCancel={onClose} />
        </Elements>
      )}
    </Modal>
  )
}

/** Saved cards list + add/remove on Billing page */
export function PaymentMethodsSection() {
  const { data, isLoading, isError, error, refetch } = usePaymentMethods()
  const deleteCard = useDeletePaymentMethod()
  const [addOpen, setAddOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const cards = (data || []).map(normalizePaymentMethod).filter(Boolean)

  const handleDelete = async (card) => {
    const id = card.id
    if (!id) return
    if (!window.confirm(`Remove ${formatCardBrand(card.brand)} •••• ${card.last4}?`)) return
    setDeletingId(id)
    try {
      await deleteCard.mutateAsync(id)
    } catch {
      /* handled by hook */
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Payment cards
        </h2>
        <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add card
        </Button>
      </div>

      {isLoading && <Skeleton className="h-28 rounded-2xl" />}

      {isError && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-rose-600">{getUserMessage(error)}</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && cards.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">No cards saved</p>
              <p className="mt-1 text-xs text-slate-500">
                Add a card to pay faster when you subscribe.
              </p>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add card
            </Button>
          </CardContent>
        </Card>
      )}

      {cards.length > 0 && (
        <Card>
          <CardContent className="divide-y divide-slate-100 p-0">
            {cards.map((card) => {
              const expiry = formatCardExpiry(card.expMonth, card.expYear)
              const busy = deletingId === card.id
              return (
                <div
                  key={String(card.id)}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCardBrand(card.brand)} ···· {card.last4}
                        </p>
                        {card.isDefault && (
                          <Badge className="bg-emerald-50 text-emerald-700">Default</Badge>
                        )}
                      </div>
                      {expiry && (
                        <p className="mt-0.5 text-xs text-slate-500">Expires {expiry}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={busy || deleteCard.isPending}
                    onClick={() => handleDelete(card)}
                    aria-label="Remove card"
                    className="text-slate-400 hover:text-rose-600"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <AddCardModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

/** Radio list for checkout — pick a saved card or “new card” */
export function SavedCardPicker({ cards, value, onChange, className }) {
  if (!cards?.length) return null

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium text-slate-700">Pay with</p>
      <div className="grid gap-2">
        {cards.map((card) => {
          const selected = value === card.paymentMethodId
          const expiry = formatCardExpiry(card.expMonth, card.expYear)
          return (
            <button
              key={String(card.id)}
              type="button"
              onClick={() => onChange(card.paymentMethodId)}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                selected
                  ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                  selected ? 'border-emerald-600' : 'border-slate-300'
                )}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-emerald-600" />}
              </span>
              <CreditCard className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">
                  {formatCardBrand(card.brand)} ···· {card.last4}
                </span>
                {expiry && (
                  <span className="block text-[11px] text-slate-500">Expires {expiry}</span>
                )}
              </span>
              {card.isDefault && (
                <Badge className="bg-slate-100 text-slate-600">Default</Badge>
              )}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => onChange('new')}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
            value === 'new'
              ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          )}
        >
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
              value === 'new' ? 'border-emerald-600' : 'border-slate-300'
            )}
          >
            {value === 'new' && <span className="h-2 w-2 rounded-full bg-emerald-600" />}
          </span>
          <Plus className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900">Use a new card</span>
        </button>
      </div>
    </div>
  )
}
