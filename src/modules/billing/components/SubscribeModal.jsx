import { useEffect, useMemo, useState } from 'react'
import { Formik, Form } from 'formik'
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { Gift, Lock } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { FormikAuthField } from '@/modules/auth/components/FormikAuthField'
import { FormikSelect } from '@/modules/auth/components/FormikSelect'
import { StripeCardField } from '@/modules/billing/components/StripeCardField'
import { SavedCardPicker } from '@/modules/billing/components/PaymentMethodsSection'
import { useSubscribe, usePaymentMethods } from '@/modules/billing/hooks/useBilling'
import {
  subscribeInitialValues,
  getSubscribeSchema,
} from '@/modules/billing/validation/subscribe.schema'
import { normalizePaymentMethod } from '@/modules/billing/lib/paymentMethods'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { APP_CONFIG } from '@/shared/constants/config'
import {
  getStripe,
  extractPaymentClientSecret,
  requiresPaymentAction,
} from '@/shared/lib/stripe'

function formatPlanPrice(plan) {
  if (plan.flat_amount == null) return 'Usage-based'
  const currency = plan.currency || 'USD'
  let formatted
  try {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(plan.flat_amount))
  } catch {
    formatted = `$${Number(plan.flat_amount)}`
  }
  const interval = plan.billing_interval === 'month' ? '/mo' : `/${plan.billing_interval || 'mo'}`
  return `${formatted}${interval}`
}

async function confirmPaymentAction(stripe, clientSecret) {
  const result = await stripe.confirmCardPayment(clientSecret)
  if (result.error) {
    throw new AppError(result.error.message || '3D Secure authentication failed', {
      code: 'STRIPE_3DS_FAILED',
    })
  }
  const status = result.paymentIntent?.status
  if (status !== 'succeeded' && status !== 'processing' && status !== 'requires_capture') {
    throw new AppError(`Payment incomplete (${status || 'unknown'})`, {
      code: 'STRIPE_PAYMENT_INCOMPLETE',
      details: result.paymentIntent,
    })
  }
  return result.paymentIntent
}

/** Shared Stripe subscribe form — uses saved card or new Elements card */
export function SubscribeCheckoutForm({
  productOverview,
  initialPlan,
  intent = 'subscribe',
  onSuccess,
  submitLabel,
}) {
  const stripe = useStripe()
  const elements = useElements()
  const subscribe = useSubscribe()
  const { data: rawCards = [], isLoading: cardsLoading } = usePaymentMethods()
  const cards = useMemo(
    () => rawCards.map(normalizePaymentMethod).filter(Boolean),
    [rawCards]
  )

  const [paymentSource, setPaymentSource] = useState('new') // 'new' | pm_id
  const [formError, setFormError] = useState('')
  const [cardError, setCardError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const plans = (productOverview?.plans || []).filter((p) => p.is_active !== false)
  const productSlug = productOverview?.product || 'duewise'
  const trialDays = productOverview?.trial_days || plans[0]?.trial_days || 7
  const showTrialPreview = intent === 'trial' && trialDays > 0
  const useSavedCard = paymentSource !== 'new' && Boolean(paymentSource)
  const hasSavedCards = cards.length > 0

  useEffect(() => {
    if (cardsLoading) return
    if (!cards.length) {
      setPaymentSource('new')
      return
    }
    const preferred =
      cards.find((c) => c.isDefault)?.paymentMethodId || cards[0]?.paymentMethodId || 'new'
    setPaymentSource(preferred)
  }, [cards, cardsLoading])

  const initialValues = useMemo(
    () => ({
      ...subscribeInitialValues,
      product: productSlug,
      plan: initialPlan || plans[0]?.plan_key || 'base',
    }),
    [productSlug, initialPlan, plans]
  )

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      validationSchema={getSubscribeSchema(useSavedCard)}
      validateOnChange={false}
      onSubmit={async (values, { setErrors }) => {
        setFormError('')
        setCardError('')

        setSubmitting(true)
        try {
          let paymentMethodId = paymentSource

          if (!useSavedCard) {
            if (!stripe || !elements) {
              setFormError('Stripe has not loaded yet. Check your publishable key.')
              return
            }
            const card = elements.getElement(CardElement)
            if (!card) {
              setCardError('Card field is missing.')
              return
            }

            const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
              type: 'card',
              card,
              billing_details: {
                name: values.cardholder_name.trim(),
                email: values.billing_email?.trim() || undefined,
              },
            })

            if (pmError) {
              setCardError(pmError.message || 'Could not create payment method')
              return
            }
            paymentMethodId = paymentMethod.id
          }

          if (!paymentMethodId || paymentMethodId === 'new') {
            setFormError('Select a payment card to continue.')
            return
          }

          const payload = {
            product: values.product,
            plan: values.plan,
            payment_method: paymentMethodId,
            billing_email: values.billing_email?.trim() || undefined,
          }

          let response
          try {
            response = await subscribe.mutateAsync(payload)
          } catch (err) {
            const appError = AppError.fromUnknown(err)
            const secret = extractPaymentClientSecret(appError.details)
            if (secret) {
              if (!stripe) {
                setFormError('Stripe is required to complete 3D Secure.')
                return
              }
              await confirmPaymentAction(stripe, secret)
              onSuccess?.()
              return
            }
            appError.applyToFormik(setErrors)
            setFormError(getUserMessage(appError))
            return
          }

          if (requiresPaymentAction(response)) {
            const secret = extractPaymentClientSecret(response)
            if (secret) {
              if (!stripe) {
                setFormError('Stripe is required to complete 3D Secure.')
                return
              }
              await confirmPaymentAction(stripe, secret)
            }
          }

          onSuccess?.()
        } catch (err) {
          setFormError(getUserMessage(AppError.fromUnknown(err)))
        } finally {
          setSubmitting(false)
        }
      }}
    >
      {({ values, isSubmitting }) => {
        const plan = plans.find((p) => p.plan_key === values.plan)
        const busy = submitting || isSubmitting || subscribe.isPending
        const cta =
          submitLabel ||
          (showTrialPreview ? `Start ${trialDays}-day trial` : 'Subscribe securely')
        const canSubmit = useSavedCard ? Boolean(paymentSource) : Boolean(stripe)

        return (
          <Form className="space-y-4" noValidate>
            {showTrialPreview && (
              <div className="flex items-start gap-3 rounded-2xl bg-teal-50/80 p-3.5 ring-1 ring-teal-100">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                  <Gift className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-teal-950">
                    {trialDays}-day free trial
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-teal-900/75">
                    Same subscription checkout. Your selected card is charged per plan terms after
                    trial rules apply.
                  </p>
                </div>
              </div>
            )}

            <FormikSelect name="plan" label="Plan">
              {plans.map((p) => (
                <option key={p.plan_key} value={p.plan_key}>
                  {p.name} — {formatPlanPrice(p)}
                </option>
              ))}
            </FormikSelect>

            {plan && (
              <div className="rounded-xl bg-emerald-50/70 px-3 py-2.5 text-xs text-emerald-900 ring-1 ring-emerald-100">
                <p className="font-semibold">{plan.name}</p>
                <p className="mt-0.5 text-emerald-800/80">
                  {formatPlanPrice(plan)}
                  {plan.performance_fee_percent != null
                    ? ` · ${plan.performance_fee_percent}% performance fee`
                    : ''}
                  {(plan.trial_days || trialDays) > 0
                    ? ` · ${plan.trial_days || trialDays}-day trial`
                    : ''}
                </p>
              </div>
            )}

            {hasSavedCards && (
              <SavedCardPicker
                cards={cards}
                value={paymentSource}
                onChange={setPaymentSource}
              />
            )}

            {!useSavedCard && (
              <>
                <FormikAuthField
                  name="cardholder_name"
                  label="Cardholder name"
                  placeholder="Sarah Jenkins"
                  autoComplete="cc-name"
                />
                <StripeCardField error={cardError} />
              </>
            )}

            <FormikAuthField
              name="billing_email"
              label="Billing email (optional)"
              type="email"
              placeholder="billing@acme.com"
              autoComplete="email"
            />

            <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Secured by Stripe. 3D Secure may appear if your bank requires it.
            </p>

            {formError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>
            )}

            <Button type="submit" className="w-full" disabled={!canSubmit || busy || cardsLoading}>
              {busy ? 'Processing…' : cta}
            </Button>
          </Form>
        )
      }}
    </Formik>
  )
}

/**
 * Subscription checkout modal (also used for “Start free trial” UI preview).
 * Always posts to POST /api/billing/subscribe.
 */
export function SubscribeModal({
  open,
  onClose,
  productOverview,
  initialPlan,
  intent = 'subscribe',
}) {
  const hasKey = Boolean(APP_CONFIG.stripePublishableKey)
  const stripePromise = getStripe()
  const trialDays = productOverview?.trial_days || 7
  const isTrial = intent === 'trial'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={isTrial ? 'Start free trial' : 'Subscribe'}
      description={
        isTrial
          ? `Preview: ${trialDays}-day trial via the same Stripe subscription checkout.`
          : 'Activate your plan with Stripe. SCA / 3D Secure supported.'
      }
    >
      {!hasKey ? (
        <div className="space-y-2 text-sm text-amber-900">
          <p className="font-semibold">Stripe publishable key missing</p>
          <p className="text-amber-800/90">
            Add <code className="font-mono text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code> to{' '}
            <code className="font-mono text-xs">.env</code> and restart Vite.
          </p>
        </div>
      ) : productOverview ? (
        <Elements stripe={stripePromise} key={`${intent}-${initialPlan || 'default'}-${open}`}>
          <SubscribeCheckoutForm
            productOverview={productOverview}
            initialPlan={initialPlan}
            intent={intent}
            onSuccess={onClose}
          />
        </Elements>
      ) : (
        <p className="text-sm text-slate-500">Loading plans…</p>
      )}
    </Modal>
  )
}
