/**
 * Approximate units of each currency per 1 USD.
 * Used for invoice minimum ($5 USD equivalent) — not live FX.
 */
export const UNITS_PER_USD = {
  usd: 1,
  eur: 0.92,
  gbp: 0.79,
  cad: 1.36,
  aud: 1.53,
  aed: 3.67,
  sar: 3.75,
  pkr: 278,
  inr: 83,
  sgd: 1.34,
  myr: 4.47,
  idr: 15800,
  php: 56,
  nzd: 1.66,
  chf: 0.88,
  sek: 10.5,
  nok: 10.7,
  dkk: 6.9,
  jpy: 149,
  cny: 7.2,
  hkd: 7.8,
  brl: 5.0,
  mxn: 17.2,
  zar: 18.5,
  ngn: 1550,
  egp: 49,
  try: 34,
  bdt: 110,
  qar: 3.64,
  kwd: 0.31,
}

export const MIN_INVOICE_USD = 5

export function unitsPerUsd(currency) {
  const code = String(currency || 'usd').trim().toLowerCase()
  return UNITS_PER_USD[code] ?? 1
}

/** Minimum invoice total in the selected currency (≈ $5 USD). */
export function minInvoiceAmount(currency) {
  return MIN_INVOICE_USD * unitsPerUsd(currency)
}

/** Convert an amount in `currency` to approximate USD. */
export function toUsd(amount, currency) {
  const n = Number(amount) || 0
  const units = unitsPerUsd(currency)
  if (!units) return n
  return n / units
}

export function lineItemsTotal(lineItems = []) {
  return (lineItems || []).reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const unit = Number(item.unit_amount) || 0
    const tax = Number(item.tax_amount) || 0
    return sum + qty * unit + tax
  }, 0)
}
