import { loadStripe } from '@stripe/stripe-js'
import { APP_CONFIG } from '@/shared/constants/config'

let stripePromise

/** Singleton Stripe.js loader (publishable key from env). */
export function getStripe() {
  if (!APP_CONFIG.stripePublishableKey) return null
  if (!stripePromise) {
    stripePromise = loadStripe(APP_CONFIG.stripePublishableKey)
  }
  return stripePromise
}

/**
 * Extract PaymentIntent client_secret from Cashier / custom API payloads
 * (success body or IncompletePayment error details).
 */
export function extractPaymentClientSecret(payload) {
  if (!payload || typeof payload !== 'object') return null
  return (
    payload.payment_intent_client_secret ||
    payload.client_secret ||
    payload.payment?.client_secret ||
    payload.payment_intent?.client_secret ||
    payload.data?.payment_intent_client_secret ||
    payload.data?.client_secret ||
    payload.data?.payment?.client_secret ||
    payload.data?.payment_intent?.client_secret ||
    null
  )
}

export function requiresPaymentAction(payload) {
  const secret = extractPaymentClientSecret(payload)
  if (secret) return true
  const status =
    payload?.payment?.status ||
    payload?.payment_intent?.status ||
    payload?.data?.payment?.status ||
    payload?.data?.stripe_status ||
    payload?.data?.subscription?.stripe_status
  return status === 'requires_action' || status === 'requires_confirmation' || status === 'incomplete'
}
