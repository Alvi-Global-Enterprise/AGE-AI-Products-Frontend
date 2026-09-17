import { APP_CONFIG } from '@/shared/constants/config'
import { delay } from '@/shared/lib/delay'
import axiosClient from '@/shared/api/axiosClient'

const MOCK_DASHBOARD = {
  total_invoiced: 45000,
  total_outstanding: 18500,
  total_overdue: 12000,
  total_recovered: 26500,
  counts: {
    total: 35,
    paid: 20,
    open: 8,
    overdue: 5,
    partially_paid: 2,
    written_off: 0,
    cancelled: 0,
    draft: 0,
  },
  aging_buckets: {
    current: { count: 6, amount: 6500 },
    '1-30': { count: 3, amount: 5000 },
    '31-60': { count: 1, amount: 4000 },
    '61-90': { count: 1, amount: 3000 },
    '90+': { count: 0, amount: 0 },
  },
  top_overdue_clients: [
    {
      client_id: 15,
      client_name: 'Apex Global Logistics',
      company_name: 'Apex Logistics Inc',
      overdue_count: 2,
      overdue_amount: 7000,
      max_days_overdue: 45,
    },
    {
      client_id: 1,
      client_name: 'Acme Corp Ltd',
      company_name: 'Acme Corp',
      overdue_count: 1,
      overdue_amount: 3200,
      max_days_overdue: 12,
    },
  ],
}

function buildMockForecast() {
  const start = new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + 29)
  const toDate = (d) => d.toISOString().slice(0, 10)

  const daily_projections = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const expected_amount = i % 4 === 0 ? 1500 + (i % 5) * 400 : i % 7 === 0 ? 2200 : 0
    return {
      date: toDate(date),
      expected_amount,
      invoice_count: expected_amount > 0 ? 1 : 0,
    }
  })

  const total_expected = daily_projections.reduce((s, d) => s + d.expected_amount, 0)

  return {
    forecast_period: {
      start: toDate(start),
      end: toDate(end),
      days: 30,
    },
    summary: {
      total_expected,
      total_optimistic: Math.round(total_expected * 1.3),
      total_conservative: Math.round(total_expected * 0.67),
      total_at_risk: 3000,
    },
    weekly_buckets: {
      days_1_7: { period: 'Days 1-7', expected_amount: 4500, invoice_count: 3 },
      days_8_14: { period: 'Days 8-14', expected_amount: 5200, invoice_count: 4 },
      days_15_21: { period: 'Days 15-21', expected_amount: 3000, invoice_count: 2 },
      days_22_30: { period: 'Days 22-30', expected_amount: 1550, invoice_count: 1 },
      beyond_30: {
        period: 'Beyond 30 Days (At Risk)',
        expected_amount: 3000,
        invoice_count: 1,
      },
    },
    daily_projections,
    upcoming_payments: [
      {
        invoice_id: 12,
        invoice_number: 'INV-2026-004',
        client_name: 'Acme Corp Ltd',
        amount_due: 1500,
        due_date: toDate(new Date(start.getTime() + 86400000)),
        predicted_date: toDate(new Date(start.getTime() + 86400000)),
        expected_amount: 1500,
        late_probability: 15,
      },
      {
        invoice_id: 15,
        invoice_number: 'INV-2026-007',
        client_name: 'Apex Global Logistics',
        amount_due: 4200,
        due_date: toDate(new Date(start.getTime() - 2 * 86400000)),
        predicted_date: toDate(new Date(start.getTime() + 5 * 86400000)),
        expected_amount: 4200,
        late_probability: 72,
      },
      {
        invoice_id: 18,
        invoice_number: 'INV-2026-009',
        client_name: 'Brightline Soft',
        amount_due: 2800,
        due_date: toDate(new Date(start.getTime() + 4 * 86400000)),
        predicted_date: toDate(new Date(start.getTime() + 6 * 86400000)),
        expected_amount: 2800,
        late_probability: 48,
      },
    ],
  }
}

const MOCK_INVOICES = [
  {
    id: 101,
    tenant_id: 'tenant-demo',
    client_id: 1,
    number: 'INV-2026-001',
    currency: 'usd',
    issue_date: '2026-09-01',
    due_date: '2026-09-15',
    subtotal: 5000,
    tax_total: 0,
    total: 5000,
    amount_paid: 0,
    balance_due: 5000,
    status: 'open',
    days_overdue: 0,
    aging_bucket: 'current',
    paid_at: null,
    is_overdue_recovered: false,
    recovered_at: null,
    quickbooks_id: 'QB-INV-5001',
    ai_predicted_late_probability: 18.5,
    ai_predicted_payment_date: '2026-09-15',
    created_at: '2026-09-01T10:00:00.000000Z',
    updated_at: '2026-09-01T10:00:00.000000Z',
    client: { id: 1, name: 'Acme Corp Ltd', email: 'billing@acmecorp.com', phone: '+15552345678' },
  },
  {
    id: 102,
    tenant_id: 'tenant-demo',
    client_id: 1,
    number: 'INV-2026-002',
    currency: 'usd',
    issue_date: '2026-08-01',
    due_date: '2026-08-15',
    subtotal: 2200,
    tax_total: 0,
    total: 2200,
    amount_paid: 0,
    balance_due: 2200,
    status: 'overdue',
    days_overdue: 26,
    aging_bucket: '1-30',
    paid_at: null,
    is_overdue_recovered: false,
    recovered_at: null,
    quickbooks_id: null,
    ai_predicted_late_probability: 62,
    ai_predicted_payment_date: '2026-09-20',
    created_at: '2026-08-01T10:00:00.000000Z',
    updated_at: '2026-08-01T10:00:00.000000Z',
    client: { id: 1, name: 'Acme Corp Ltd', email: 'billing@acmecorp.com', phone: '+15552345678' },
  },
  {
    id: 103,
    tenant_id: 'tenant-demo',
    client_id: 1,
    number: 'INV-2026-003',
    currency: 'usd',
    issue_date: '2026-07-01',
    due_date: '2026-07-15',
    subtotal: 980,
    tax_total: 0,
    total: 980,
    amount_paid: 980,
    balance_due: 0,
    status: 'paid',
    days_overdue: 0,
    aging_bucket: 'current',
    paid_at: '2026-07-12T00:00:00.000000Z',
    is_overdue_recovered: false,
    recovered_at: null,
    quickbooks_id: 'QB-INV-5003',
    ai_predicted_late_probability: 5,
    ai_predicted_payment_date: '2026-07-12',
    created_at: '2026-07-01T10:00:00.000000Z',
    updated_at: '2026-07-12T10:00:00.000000Z',
    client: { id: 1, name: 'Acme Corp Ltd', email: 'billing@acmecorp.com', phone: '+15552345678' },
  },
]

let mockInvoices = [...MOCK_INVOICES]

function paginate(items, params = {}) {
  const page = Math.max(1, Number(params.page) || 1)
  const perPage = Math.max(1, Number(params.per_page) || 15)
  const total = items.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage
  const slice = items.slice(start, start + perPage)
  return {
    data: slice,
    links: {
      first: null,
      last: null,
      prev: page > 1 ? String(page - 1) : null,
      next: page < lastPage ? String(page + 1) : null,
    },
    meta: {
      current_page: page,
      from: total === 0 ? null : start + 1,
      last_page: lastPage,
      path: '/api/duewise/invoices',
      per_page: perPage,
      to: total === 0 ? null : Math.min(start + perPage, total),
      total,
    },
  }
}

export const duewiseApi = {
  /** GET /api/duewise/dashboard */
  async getDashboard() {
    if (APP_CONFIG.useMockApi) {
      await delay(450)
      return { data: MOCK_DASHBOARD }
    }
    const { data } = await axiosClient.get('/api/duewise/dashboard')
    return data
  },

  /** GET /api/duewise/forecast */
  async getForecast() {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      return { data: buildMockForecast() }
    }
    const { data } = await axiosClient.get('/api/duewise/forecast')
    return data
  },

  /**
   * GET /api/duewise/invoices
   * Query: client_id, status, aging_bucket, search, per_page, page
   */
  async getInvoices(params = {}) {
    const query = {
      page: Number(params.page) || 1,
      per_page: Number(params.per_page) || 15,
      ...params,
    }
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      let items = [...mockInvoices]
      if (query.client_id) {
        items = items.filter((i) => String(i.client_id) === String(query.client_id))
      }
      if (query.status) {
        items = items.filter((i) => i.status === query.status)
      }
      if (query.aging_bucket) {
        items = items.filter((i) => i.aging_bucket === query.aging_bucket)
      }
      if (query.search) {
        const q = String(query.search).toLowerCase()
        items = items.filter(
          (i) =>
            i.number?.toLowerCase().includes(q) ||
            i.client?.name?.toLowerCase().includes(q)
        )
      }
      return paginate(items, query)
    }
    const { data } = await axiosClient.get('/api/duewise/invoices', { params: query })
    return data
  },

  async getInvoice(id) {
    if (APP_CONFIG.useMockApi) {
      await delay(300)
      const found = mockInvoices.find((i) => String(i.id) === String(id))
      if (!found) return { data: null }
      return {
        data: {
          ...found,
          line_items: found.line_items || [
            {
              id: 1,
              description: 'Professional services',
              quantity: 1,
              unit_amount: found.total,
              total_amount: found.total,
            },
          ],
        },
      }
    }
    const { data } = await axiosClient.get(`/api/duewise/invoices/${id}`)
    return data
  },

  /**
   * GET /api/duewise/invoices/{id}/activity
   * Chronological audit trail / communication log for the invoice.
   */
  async getInvoiceActivity(id) {
    if (APP_CONFIG.useMockApi) {
      await delay(350)
      return {
        data: [
          {
            id: 14,
            channel: 'whatsapp',
            recipient: '+15559876543',
            status: 'delivered',
            tracking_token: 'a1b2c3d4e5f6mock',
            sent_at: '2026-09-10T14:00:00.000000Z',
            delivered_at: '2026-09-10T14:00:02.000000Z',
            opened_at: '2026-09-10T14:15:20.000000Z',
            clicked_at: '2026-09-10T14:16:05.000000Z',
            replied_at: null,
          },
          {
            id: 13,
            channel: 'email',
            recipient: 'billing@acme.com',
            status: 'opened',
            tracking_token: 'emailtokmock01',
            sent_at: '2026-09-08T09:30:00.000000Z',
            delivered_at: '2026-09-08T09:30:04.000000Z',
            opened_at: '2026-09-08T11:02:10.000000Z',
            clicked_at: null,
            replied_at: null,
          },
        ],
      }
    }
    const { data } = await axiosClient.get(`/api/duewise/invoices/${id}/activity`)
    return data
  },

  /** POST /api/duewise/invoices */
  async createInvoice(payload) {
    if (APP_CONFIG.useMockApi) {
      await delay(600)
      const lineItems = payload.line_items || []
      const subtotal = lineItems.reduce(
        (sum, item) => sum + Number(item.quantity || 1) * Number(item.unit_amount || 0),
        0
      )
      const taxTotal = lineItems.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0)
      const created = {
        id: Date.now(),
        tenant_id: 'tenant-demo',
        client_id: payload.client_id,
        number: payload.number || `INV-MOCK-${Date.now()}`,
        currency: payload.currency || 'usd',
        issue_date: payload.issue_date || new Date().toISOString().slice(0, 10),
        due_date:
          payload.due_date ||
          new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        subtotal,
        tax_total: taxTotal,
        total: subtotal + taxTotal,
        amount_paid: 0,
        balance_due: subtotal + taxTotal,
        status: 'open',
        days_overdue: 0,
        aging_bucket: 'current',
        paid_at: null,
        is_overdue_recovered: false,
        recovered_at: null,
        quickbooks_id: null,
        ai_predicted_late_probability: null,
        ai_predicted_payment_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        line_items: lineItems,
        client: { id: payload.client_id, name: `Client #${payload.client_id}` },
      }
      mockInvoices = [created, ...mockInvoices]
      return { data: created }
    }
    const { data } = await axiosClient.post('/api/duewise/invoices', payload)
    return data
  },

  /** PUT /api/duewise/invoices/{id} */
  async updateInvoice(id, payload) {
    if (APP_CONFIG.useMockApi) {
      await delay(500)
      mockInvoices = mockInvoices.map((inv) =>
        String(inv.id) === String(id)
          ? { ...inv, ...payload, updated_at: new Date().toISOString() }
          : inv
      )
      const found = mockInvoices.find((i) => String(i.id) === String(id))
      return { data: found }
    }
    const { data } = await axiosClient.put(`/api/duewise/invoices/${id}`, payload)
    return data
  },

  /** DELETE /api/duewise/invoices/{id} */
  async deleteInvoice(id) {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      mockInvoices = mockInvoices.filter((i) => String(i.id) !== String(id))
      return { message: 'Invoice deleted successfully.' }
    }
    const { data } = await axiosClient.delete(`/api/duewise/invoices/${id}`)
    return data
  },

  /** POST /api/duewise/invoices/{id}/mark-as-paid */
  async markInvoicePaid(id, payload = {}) {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      mockInvoices = mockInvoices.map((inv) =>
        String(inv.id) === String(id)
          ? {
              ...inv,
              status: 'paid',
              amount_paid: inv.total,
              balance_due: 0,
              paid_at: payload.paid_at || new Date().toISOString(),
              days_overdue: 0,
              is_overdue_recovered: inv.days_overdue > 0,
              updated_at: new Date().toISOString(),
            }
          : inv
      )
      const found = mockInvoices.find((i) => String(i.id) === String(id))
      return { data: found }
    }
    const { data } = await axiosClient.post(`/api/duewise/invoices/${id}/mark-as-paid`, payload)
    return data
  },

  /** POST /api/duewise/invoices/{id}/remind */
  async remindInvoice(id, payload = {}) {
    if (APP_CONFIG.useMockApi) {
      await delay(700)
      const channel = payload.channel && payload.channel !== 'auto' ? payload.channel : 'whatsapp'
      return {
        message: `Payment reminder dispatched successfully via ${channel}.`,
        data: {
          log_id: Date.now(),
          channel,
          recipient: '+15559876543',
          status: 'delivered',
          tracking_token: 'mock-tracking-token',
        },
      }
    }
    const { data } = await axiosClient.post(`/api/duewise/invoices/${id}/remind`, payload)
    return data
  },

  /**
   * GET /api/duewise/quickbooks/connect
   * Returns Intuit OAuth authorization_url for QuickBooks Online.
   * Query: redirect_uri — frontend callback after OAuth.
   */
  async connectQuickBooks(
    redirectUri = 'https://age-ai-products-frontend.vercel.app/products/duewise/integrations'
  ) {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      return {
        data: {
          authorization_url:
            'https://appcenter.intuit.com/connect/oauth2?client_id=mock&response_type=code&scope=com.intuit.quickbooks.accounting',
        },
      }
    }
    const { data } = await axiosClient.get('/api/duewise/quickbooks/connect', {
      params: { redirect_uri: redirectUri },
    })
    return data
  },

  /**
   * GET /api/duewise/quickbooks/callback?code=&realmId=&state=
   * Completes OAuth after Intuit redirects back with OAuth query params.
   */
  async callbackQuickBooks({ code, realmId, state }) {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      return { data: { connected: true, realmId } }
    }
    const { data } = await axiosClient.get('/api/duewise/quickbooks/callback', {
      params: { code, realmId, state },
    })
    return data
  },

  /**
   * POST /api/duewise/quickbooks/status
   * Returns connection + sync state for the current tenant.
   */
  async getQuickBooksStatus() {
    if (APP_CONFIG.useMockApi) {
      await delay(300)
      return {
        data: {
          is_connected: false,
          realm_id: null,
          sync_status: null,
          last_synced_at: null,
        },
      }
    }
    const { data } = await axiosClient.get('/api/duewise/quickbooks/status')
    return data
  },

  /**
   * POST /api/duewise/quickbooks/sync
   * On-demand sync: customers → clients, invoices, payment statuses.
   */
  async syncQuickBooks({ full = false } = {}) {
    if (APP_CONFIG.useMockApi) {
      await delay(1800)
      return {
        message: 'QuickBooks sync completed successfully.',
        data: {
          customers_synced: 12,
          invoices_synced: 28,
          payments_synced: 4,
        },
      }
    }
    const { data } = await axiosClient.post('/api/duewise/quickbooks/sync', { full })
    return data
  },

  /**
   * POST /api/duewise/quickbooks/disconnect
   * Disconnects the current tenant from QuickBooks Online.
   */
  async disconnectQuickBooks() {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      return { data: { is_connected: false } }
    }
    const { data } = await axiosClient.post('/api/duewise/quickbooks/disconnect')
    return data
  },
}

export const duewiseKeys = {
  all: ['duewise'],
  dashboard: () => [...duewiseKeys.all, 'dashboard'],
  forecast: () => [...duewiseKeys.all, 'forecast'],
  invoices: (filters) => [...duewiseKeys.all, 'invoices', filters ?? {}],
  invoice: (id) => [...duewiseKeys.all, 'invoice', id],
  invoiceActivity: (id) => [...duewiseKeys.all, 'invoice', id, 'activity'],
  quickbooksStatus: () => [...duewiseKeys.all, 'quickbooks', 'status'],
}
