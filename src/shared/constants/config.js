/** App-wide env / API config — matches AGE AI backend docs */
export const APP_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  /** Set VITE_USE_MOCK_API=true to force mock responses */
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true',
  requestTimeoutMs: 15_000,
  /** Permanent access token (localStorage) */
  tokenKey: 'age_token',
  /** Temporary OTP token (sessionStorage) */
  tempTokenKey: 'age_temp_token',
  refreshTokenKey: 'age_ai_refresh_token',
  /** Stripe publishable key for Elements / 3DS */
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
}

export const BUSINESS_TYPES = [
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
]

export const BUSINESS_CATEGORIES = [
  { value: 'legal_services', label: 'Legal Services' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'medical', label: 'Medical' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'technology', label: 'Technology' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' },
]

export const BUSINESS_TONES = [
  { value: 'polite', label: 'Polite' },
  { value: 'professional', label: 'Professional' },
  { value: 'firm', label: 'Firm' },
]

export const REMINDER_TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'polite', label: 'Polite' },
  { value: 'firm', label: 'Firm' },
]

export const PREFERRED_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'call', label: 'Call' },
]

export const RISK_TIERS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

/** ISO 3166-1 alpha-2 — used by complete-profile / tenant */
export const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'IN', label: 'India' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SG', label: 'Singapore' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'PH', label: 'Philippines' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'IE', label: 'Ireland' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'KE', label: 'Kenya' },
  { value: 'EG', label: 'Egypt' },
  { value: 'TR', label: 'Turkey' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'CN', label: 'China' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'QA', label: 'Qatar' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'OM', label: 'Oman' },
]

/** ISO 4217 — clients use uppercase; complete-profile API expects lowercase */
export const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
  { value: 'PKR', label: 'PKR — Pakistani Rupee' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { value: 'IDR', label: 'IDR — Indonesian Rupiah' },
  { value: 'PHP', label: 'PHP — Philippine Peso' },
  { value: 'NZD', label: 'NZD — New Zealand Dollar' },
  { value: 'CHF', label: 'CHF — Swiss Franc' },
  { value: 'SEK', label: 'SEK — Swedish Krona' },
  { value: 'NOK', label: 'NOK — Norwegian Krone' },
  { value: 'DKK', label: 'DKK — Danish Krone' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'CNY', label: 'CNY — Chinese Yuan' },
  { value: 'HKD', label: 'HKD — Hong Kong Dollar' },
  { value: 'BRL', label: 'BRL — Brazilian Real' },
  { value: 'MXN', label: 'MXN — Mexican Peso' },
  { value: 'ZAR', label: 'ZAR — South African Rand' },
  { value: 'NGN', label: 'NGN — Nigerian Naira' },
  { value: 'EGP', label: 'EGP — Egyptian Pound' },
  { value: 'TRY', label: 'TRY — Turkish Lira' },
  { value: 'BDT', label: 'BDT — Bangladeshi Taka' },
  { value: 'QAR', label: 'QAR — Qatari Riyal' },
  { value: 'KWD', label: 'KWD — Kuwaiti Dinar' },
]

export const BILLING_PRODUCTS = [
  {
    slug: 'duewise',
    name: 'DueWise',
    plans: [
      { slug: 'base', label: 'Base', price: '$299/mo', detail: '+ 15% performance fee' },
      { slug: 'big_books', label: 'Big Books', price: '$499/mo', detail: '+ 10% performance fee' },
    ],
  },
]
