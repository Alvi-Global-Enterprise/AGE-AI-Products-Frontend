/** Normalize payment method records from various backend shapes */
export function normalizePaymentMethod(raw) {
  if (!raw || typeof raw !== 'object') return null
  const card = raw.card || raw.payment_method?.card || {}
  const stripeId =
    raw.stripe_payment_method_id ||
    raw.payment_method_id ||
    raw.stripe_id ||
    (typeof raw.id === 'string' && String(raw.id).startsWith('pm_') ? raw.id : null) ||
    raw.payment_method

  return {
    id: raw.id ?? stripeId,
    paymentMethodId: stripeId || raw.id,
    brand: (card.brand || raw.brand || raw.card_brand || 'card').toLowerCase(),
    last4: String(card.last4 || raw.last4 || raw.card_last4 || '••••'),
    expMonth: card.exp_month || raw.exp_month || raw.expMonth || null,
    expYear: card.exp_year || raw.exp_year || raw.expYear || null,
    isDefault: Boolean(raw.is_default || raw.default || raw.isDefault),
    raw,
  }
}

export function formatCardBrand(brand) {
  if (!brand) return 'Card'
  return brand.charAt(0).toUpperCase() + brand.slice(1)
}

export function formatCardExpiry(month, year) {
  if (!month || !year) return null
  const mm = String(month).padStart(2, '0')
  const yy = String(year).slice(-2)
  return `${mm}/${yy}`
}
