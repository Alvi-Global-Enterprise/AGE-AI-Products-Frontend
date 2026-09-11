import { APP_CONFIG, BILLING_PRODUCTS } from '@/shared/constants/config'
import { delay } from '@/shared/lib/delay'
import axiosClient from '@/shared/api/axiosClient'

const MOCK_PLANS = [
  {
    product: 'duewise',
    product_name: 'Duewise',
    trial_enabled: true,
    trial_days: 7,
    is_subscribed: false,
    on_trial: false,
    trial_ends_at: null,
    current_plan: null,
    current_subscription: null,
    plans: BILLING_PRODUCTS[0].plans.map((p, i) => ({
      id: i + 1,
      plan_key: p.slug,
      name: `${p.label} Plan`,
      description: p.detail,
      flat_amount: p.slug === 'base' ? 299 : 499,
      currency: 'USD',
      billing_interval: 'month',
      trial_days: 7,
      performance_fee_percent: p.slug === 'base' ? 15 : 10,
      features:
        p.slug === 'base'
          ? [
              'Smart multi-channel invoice sequences',
              'Up to 500 active invoices',
              'Email & WhatsApp delivery',
              'Real-time recovery tracking',
            ]
          : [
              'Unlimited active invoices',
              'Custom sequence scheduling',
              'Dedicated phone & WhatsApp channels',
              'Priority AI risk analysis',
            ],
      metadata: null,
      is_active: true,
      sort_order: i + 1,
    })),
  },
  {
    product: 'ledgercrew',
    product_name: 'LedgerCrew',
    trial_enabled: true,
    trial_days: 7,
    is_subscribed: false,
    on_trial: false,
    trial_ends_at: null,
    current_plan: null,
    current_subscription: null,
    plans: [
      {
        id: 10,
        plan_key: 'tier1',
        name: 'Tier 1',
        description: 'Starter bookkeeping automation',
        flat_amount: 299,
        currency: 'USD',
        billing_interval: 'month',
        trial_days: 7,
        performance_fee_percent: null,
        features: ['Basic ledger sync', 'Monthly close assist'],
        metadata: null,
        is_active: true,
        sort_order: 1,
      },
      {
        id: 11,
        plan_key: 'tier2',
        name: 'Tier 2',
        description: 'Growing practice toolkit',
        flat_amount: 449,
        currency: 'USD',
        billing_interval: 'month',
        trial_days: 7,
        performance_fee_percent: null,
        features: ['Multi-entity', 'Priority support'],
        metadata: null,
        is_active: true,
        sort_order: 2,
      },
    ],
  },
  {
    product: 'renewdesk',
    product_name: 'RenewDesk',
    trial_enabled: true,
    trial_days: 7,
    is_subscribed: false,
    on_trial: false,
    trial_ends_at: null,
    current_plan: null,
    current_subscription: null,
    plans: [
      {
        id: 20,
        plan_key: 'starter',
        name: 'Starter',
        description: 'Renewal reminders for small teams',
        flat_amount: 99,
        currency: 'USD',
        billing_interval: 'month',
        trial_days: 7,
        performance_fee_percent: null,
        features: ['Email renewals', 'Basic dashboards'],
        metadata: null,
        is_active: true,
        sort_order: 1,
      },
    ],
  },
]

const MOCK_TRANSACTIONS = {
  data: [
    {
      id: 1,
      tenant_id: 'tenant-demo',
      product: 'duewise',
      type: 'trial_start',
      description: '7-day free trial started for Duewise (base)',
      amount: 0,
      currency: 'USD',
      status: 'succeeded',
      stripe_invoice_id: null,
      stripe_payment_intent_id: null,
      stripe_subscription_id: 'sub_mock',
      paid_at: new Date().toISOString(),
      receipt_url: null,
      metadata: { plan: 'base', trial_days: 7 },
      created_at: new Date().toISOString(),
    },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    links: [],
    path: '/api/billing/transactions',
    per_page: 15,
    to: 1,
    total: 1,
  },
}

const MOCK_PAYMENT_METHODS = [
  {
    id: 'pm_mock_visa',
    stripe_payment_method_id: 'pm_mock_visa',
    brand: 'visa',
    last4: '4242',
    exp_month: 12,
    exp_year: 2030,
    is_default: true,
  },
]

export const billingApi = {
  /** GET /api/billing/plans — product catalog + tenant trial/sub state */
  async getPlans(product) {
    if (APP_CONFIG.useMockApi) {
      await delay(300)
      const data = product
        ? MOCK_PLANS.filter((p) => p.product === product)
        : MOCK_PLANS
      return { data }
    }
    const { data } = await axiosClient.get('/api/billing/plans', {
      params: product ? { product } : undefined,
    })
    return data
  },

  /** GET /api/billing/transactions */
  async getTransactions(params = {}) {
    const query = {
      page: Number(params.page) || 1,
      per_page: Number(params.per_page) || 15,
      ...params,
    }
    if (APP_CONFIG.useMockApi) {
      await delay(300)
      return {
        ...MOCK_TRANSACTIONS,
        meta: {
          ...MOCK_TRANSACTIONS.meta,
          current_page: query.page,
          per_page: query.per_page,
        },
      }
    }
    const { data } = await axiosClient.get('/api/billing/transactions', { params: query })
    return data
  },

  /** GET /api/billing/payment-methods */
  async getPaymentMethods() {
    if (APP_CONFIG.useMockApi) {
      await delay(250)
      return { data: [...MOCK_PAYMENT_METHODS] }
    }
    const { data } = await axiosClient.get('/api/billing/payment-methods')
    return data
  },

  /**
   * POST /api/billing/payment-methods
   * Body: { payment_method: 'pm_…' } — Stripe PaymentMethod id from Elements
   */
  async addPaymentMethod(payload) {
    if (APP_CONFIG.useMockApi) {
      await delay(500)
      const pm = {
        id: payload.payment_method || `pm_mock_${Date.now()}`,
        stripe_payment_method_id: payload.payment_method,
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2030,
        is_default: MOCK_PAYMENT_METHODS.length === 0,
      }
      MOCK_PAYMENT_METHODS.push(pm)
      return { data: pm, message: 'Payment method added.' }
    }
    const { data } = await axiosClient.post('/api/billing/payment-methods', {
      payment_method: payload.payment_method,
    })
    return data
  },

  /** DELETE /api/billing/payment-methods/:id */
  async deletePaymentMethod(id) {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      const idx = MOCK_PAYMENT_METHODS.findIndex(
        (p) => p.id === id || p.stripe_payment_method_id === id
      )
      if (idx >= 0) MOCK_PAYMENT_METHODS.splice(idx, 1)
      return { message: 'Payment method removed.' }
    }
    const { data } = await axiosClient.delete(`/api/billing/payment-methods/${id}`)
    return data
  },

  /** GET /api/billing/subscription?product=… (product required) */
  async getSubscription(product = 'duewise') {
    if (APP_CONFIG.useMockApi) {
      await delay(300)
      return {
        product,
        subscribed: false,
        on_trial: true,
        subscription: null,
      }
    }
    const { data } = await axiosClient.get('/api/billing/subscription', {
      params: { product },
    })
    return data
  },

  /**
   * POST /api/billing/subscribe
   * Body: { product, plan, payment_method, billing_email? }
   * May return IncompletePayment with payment client_secret for 3DS.
   */
  async subscribe(payload) {
    if (APP_CONFIG.useMockApi) {
      await delay(800)
      return {
        data: {
          id: 1,
          stripe_id: 'sub_mock',
          stripe_status: 'active',
          stripe_price: 'price_mock',
          type: payload.product,
          ends_at: null,
        },
        message: 'Subscribed successfully.',
      }
    }
    const { data } = await axiosClient.post('/api/billing/subscribe', payload)
    return data
  },

  async cancel(payload) {
    if (APP_CONFIG.useMockApi) {
      await delay(500)
      return {
        data: {
          id: 1,
          stripe_id: 'sub_mock',
          stripe_status: 'active',
          ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
        message: 'Subscription cancelled.',
      }
    }
    const { data } = await axiosClient.post('/api/billing/cancel', payload)
    return data
  },

  /** @deprecated Prefer getPlans() — static fallback catalog */
  catalog() {
    return BILLING_PRODUCTS
  },
}

export const billingKeys = {
  all: ['billing'],
  plans: (product) => [...billingKeys.all, 'plans', product || 'all'],
  transactions: (params) => [...billingKeys.all, 'transactions', params || {}],
  subscription: (product) => [...billingKeys.all, 'subscription', product],
  paymentMethods: () => [...billingKeys.all, 'payment-methods'],
}
