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

export function normalizeInvoiceAIPrediction(invoice) {
  if (!invoice) return null
  if (invoice.ai_prediction && typeof invoice.ai_prediction === 'object' && invoice.ai_prediction.risk_tier) {
    return invoice.ai_prediction
  }

  const isPaid = String(invoice.status || '').toLowerCase() === 'paid'
  const rawProb = invoice.ai_predicted_late_probability ?? (invoice.days_overdue > 15 ? 78 : invoice.days_overdue > 0 ? 55 : 18.5)
  const lateProb = Number(rawProb) || 0
  const isHigh = lateProb >= 70
  const isMedium = lateProb >= 40 && lateProb < 70
  const riskTier = isPaid ? 'settled' : isHigh ? 'high' : isMedium ? 'medium' : 'low'
  const riskColor = isPaid ? '#64748b' : isHigh ? '#e11d48' : isMedium ? '#f59e0b' : '#10b981'
  const badgeText = isPaid
    ? 'Settled'
    : isHigh
      ? `Critical Delay (${lateProb}%)`
      : isMedium
        ? `Elevated Risk (${lateProb}%)`
        : `On-Schedule (${lateProb}%)`

  const predictedDate = invoice.ai_predicted_payment_date || invoice.due_date || new Date().toISOString().slice(0, 10)
  const confidenceScore = isHigh ? 92.4 : isMedium ? 88.0 : 95.0

  return {
    probability: lateProb,
    risk_tier: riskTier,
    risk_label: isPaid
      ? 'Settled'
      : isHigh
        ? 'Critical Delinquency Risk'
        : isMedium
          ? 'Elevated Delinquency Risk'
          : 'Low Delinquency Risk',
    risk_color: riskColor,
    badge_text: badgeText,
    predicted_payment_date: predictedDate,
    predicted_payment_date_formatted: predictedDate,
    estimated_delay_days: invoice.days_overdue || (isHigh ? 18 : 0),
    confidence_score: confidenceScore,
    confidence_label: `${confidenceScore}% Confidence`,
    risk_factors: isHigh
      ? [
          'Client historically delayed on 45% of previous invoices.',
          'Invoice is 20+ days past contractual grace period.',
          'Previous payment promise breached 3 days ago.',
        ]
      : isMedium
        ? [
            'Payment velocity slowed down in the last 60 days.',
            'Client opened reminder email but did not initiate settlement.',
          ]
        : [
            'Client maintains a 100% on-time payment track record.',
            'No dispute or communication friction recorded.',
          ],
    summary_hover_text: `Predicted settlement: ${predictedDate} (${confidenceScore}% Confidence). ${
      isHigh
        ? 'Client exhibits high delinquency risk requiring immediate escalation.'
        : isMedium
          ? 'Account requires gentle reminder nudging.'
          : 'Account is running smoothly on-schedule.'
    }`,
    recommended_action: {
      channel: isHigh ? 'whatsapp' : 'email',
      channel_label: isHigh ? 'WhatsApp' : 'Email',
      tone: isHigh ? 'firm' : 'polite',
      action_text: isHigh ? 'Send AI WhatsApp Escalation' : 'Send AI Email Reminder',
      is_trial_restricted: false,
      suggested_premium_channel: isHigh ? 'whatsapp' : null,
      api_endpoint: `/api/duewise/invoices/${invoice.id}/remind`,
      method: 'POST',
      payload: {
        channel: isHigh ? 'whatsapp' : 'email',
        tone: isHigh ? 'firm' : 'polite',
      },
    },
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
    status: 'sent',
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
    client: { id: 1, name: 'Beta Corp', email: 'billing@betacorp.com', phone: '+15559871122' },
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
  {
    id: 104,
    tenant_id: 'tenant-demo',
    client_id: 15,
    number: 'INV-CRITICAL-01',
    currency: 'usd',
    issue_date: '2026-08-10',
    due_date: '2026-09-02',
    subtotal: 8500,
    tax_total: 0,
    total: 8500,
    amount_paid: 0,
    balance_due: 8500,
    status: 'overdue',
    days_overdue: 22,
    aging_bucket: '1-30',
    paid_at: null,
    is_overdue_recovered: false,
    recovered_at: null,
    quickbooks_id: null,
    ai_predicted_late_probability: 88.5,
    ai_predicted_payment_date: '2026-10-05',
    created_at: '2026-08-10T10:00:00.000000Z',
    updated_at: '2026-08-10T10:00:00.000000Z',
    client: { id: 15, name: 'Apex Logistics', email: 'billing@apexlogistics.com', phone: '+15559876543' },
  },
]

let mockInvoices = MOCK_INVOICES.map((inv) => ({
  ...inv,
  ai_prediction: normalizeInvoiceAIPrediction(inv),
}))

function paginate(items, params = {}) {
  const page = Math.max(1, Number(params.page) || 1)
  const perPage = Math.max(1, Number(params.per_page) || 15)
  const total = items.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage
  const slice = items.slice(start, start + perPage).map((i) => ({
    ...i,
    ai_prediction: normalizeInvoiceAIPrediction(i),
  }))
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

function buildMockEntitlements() {
  const count = mockInvoices.length
  const limit = 10
  const isTrial = true
  const canCreate = count < limit
  const remaining = Math.max(0, limit - count)
  return {
    plan: 'trial',
    plan_name: 'Free Trial',
    is_trial: isTrial,
    can_create_invoice: canCreate,
    invoice_count: count,
    invoice_limit: limit,
    invoices_remaining: remaining,
    can_use_email: true,
    can_use_sms: false,
    can_use_whatsapp: false,
    can_use_smart_channel: false,
    allowed_channels: ['email'],
    cycle_start: new Date(Date.now() - 2 * 86400000).toISOString(),
    cycle_end: new Date(Date.now() + 5 * 86400000).toISOString(),
    upgrade_prompt: {
      required: !canCreate,
      target_plan: 'base',
      message: !canCreate
        ? 'Trial accounts are limited to a maximum of 10 invoices. Please upgrade to the Base plan to create up to 500 invoices.'
        : 'Upgrade to Base plan to unlock 500 invoices/month, WhatsApp, SMS, and Smart Channel AI.',
    },
  }
}

let mockBriefingLastRefreshed = 0

function buildMockAIBriefing(refresh = false) {
  const now = Date.now()
  const cooldownPeriodMs = 5 * 60 * 1000
  const isCooldown = Boolean(mockBriefingLastRefreshed && now - mockBriefingLastRefreshed < cooldownPeriodMs)

  if (refresh && !isCooldown) {
    mockBriefingLastRefreshed = now
  }

  return {
    generated_at: new Date().toISOString(),
    cached: !refresh,
    cooldown_active: isCooldown,
    portfolio_health: {
      score: 85,
      tier: 'optimal',
      label: 'Optimal Cash Flow',
      status_color: '#059669',
      summary_metric: '92% on-schedule',
    },
    briefing: {
      headline: '🔮 DueWise AI Daily Briefing: 3 Overdue Invoices (1 Critical Exposure)',
      executive_summary:
        'DueWise detected payment risk across 3 open invoices today. 1 invoice requires immediate attention (Apex Logistics, 22 days late) for which an escalated WhatsApp sequence is recommended. The remaining 2 invoices exhibit low delinquency risk and can be handled via routine courtesy follow-up. Approximately USD 45,000.00 is projected for recovery over the next 7 days (89% confidence).',
      tone: 'urgent',
      engine: 'gemini-ai',
    },
    metrics: {
      currency: 'USD',
      total_outstanding: 18500.0,
      total_overdue: 12000.0,
      overdue_count: 3,
      high_risk_clients_count: 1,
      projected_7d_recovery: 45000.0,
      projected_30d_recovery: 88000.0,
      pending_approvals_count: 2,
      duewise_mode: 'approval',
      is_autopilot: false,
    },
    insights: [
      {
        id: 'insight_overdue_critical_101',
        category: 'risk_alert',
        title: 'Critical Delinquency Exposure Alert',
        description:
          'Apex Logistics has an overdue balance of $8,500.00 (22 days past due, High Risk). Historical delay average: 35 days.',
        urgency: 'high',
        metric_label: 'Critical Delay',
        metric_value: '22 days',
        client_id: 15,
        client_name: 'Apex Logistics',
        invoice_id: 104,
        invoice_number: 'INV-CRITICAL-01',
      },
      {
        id: 'insight_channel_opt_15',
        category: 'channel_optimization',
        title: 'Smart Channel Switch: WhatsApp',
        description:
          'AI behavioral routing recommends WhatsApp for Apex Logistics to ensure highest read rate and prompt settlement.',
        urgency: 'medium',
        metric_label: 'Recommended Channel',
        metric_value: 'WhatsApp',
      },
      {
        id: 'insight_routine_overdue',
        category: 'risk_alert',
        title: 'Routine Low-Risk Overdue Accounts',
        description:
          '2 open invoices ($3,000.00 total) are in early overdue stage (avg 3 days past due) with clean customer history. Handled via automated courtesy follow-up.',
        urgency: 'low',
        metric_label: 'Low-Risk Overdue',
        metric_value: '2 invoices',
      },
      {
        id: 'insight_forecast_7d',
        category: 'cash_flow',
        title: '7-Day Cash Flow Projection',
        description:
          'AI predicts $45,000.00 in anticipated collections across the next 7 days based on client behavioral velocity.',
        urgency: 'info',
        metric_label: '7-Day Inflow',
        metric_value: '$45,000.00',
      },
    ],
    recommended_actions: [
      {
        id: 'action_remind_high_101',
        type: 'quick_remind',
        priority: 'critical',
        title: 'Send AI WhatsApp Escalation',
        description:
          'Escalate Apex Logistics for invoice INV-CRITICAL-01 (USD 8,500.00, 22 days late) using firm, urgent recovery tone.',
        badge: 'Critical Priority',
        button_text: 'Send WhatsApp Now',
        api_endpoint: '/api/duewise/invoices/104/remind',
        method: 'POST',
        payload: {
          channel: 'whatsapp',
          tone: 'firm',
        },
        invoice_id: 104,
        invoice_number: 'INV-CRITICAL-01',
        client_name: 'Apex Logistics',
        amount: 8500.0,
        currency: 'USD',
      },
      {
        id: 'action_remind_routine_102',
        type: 'quick_remind',
        priority: 'medium',
        title: 'Send Courtesy Email Reminder',
        description:
          'Send friendly reminder to Beta Corp for invoice INV-ROUTINE-01 (USD 1,200.00) using polite courtesy tone.',
        badge: 'Routine Follow-up',
        button_text: 'Send Courtesy Email',
        api_endpoint: '/api/duewise/invoices/102/remind',
        method: 'POST',
        payload: {
          channel: 'email',
          tone: 'polite',
        },
        invoice_id: 102,
        invoice_number: 'INV-ROUTINE-01',
        client_name: 'Beta Corp',
        amount: 1200.0,
        currency: 'USD',
      },
      {
        id: 'action_review_approvals',
        type: 'review_approvals',
        priority: 'medium',
        title: 'Review 2 AI Reminders',
        description: 'Approve queued reminders with one click or view individual drafts.',
        badge: 'Pending Review',
        button_text: 'Approve All Reminders',
        api_endpoint: '/api/duewise/reminders/approvals/approve-all',
        method: 'POST',
        payload: {},
        target_url: '/products/duewise/approvals',
      },
    ],
  }
}

export const duewiseApi = {
  /**
   * GET /api/duewise/dashboard/ai-briefing
   * Daily Executive Briefing & Health Card
   */
  async getAIBriefing(params = {}) {
    const { refresh = false } = params
    if (APP_CONFIG.useMockApi) {
      await delay(450)
      return { data: buildMockAIBriefing(refresh) }
    }
    const { data } = await axiosClient.get('/api/duewise/dashboard/ai-briefing', {
      params: refresh ? { refresh: 'true' } : {},
    })
    return data
  },

  /**
   * Dispatches 1-click recommended action from briefing
   */
  async executeRecommendedAction(action) {
    const endpoint = action.api_endpoint
    const method = (action.method || 'POST').toLowerCase()
    const payload = action.payload || {}
    if (APP_CONFIG.useMockApi) {
      await delay(600)
      return { message: `${action.title || 'Action'} executed successfully.` }
    }
    const { data } = await axiosClient[method](endpoint, payload)
    return data
  },

  /**
   * GET /api/duewise/entitlements
   * Plan limits, permissions, invoice quotas, and allowed reminder channels.
   */
  async getEntitlements() {
    if (APP_CONFIG.useMockApi) {
      await delay(250)
      return { data: buildMockEntitlements() }
    }
    const { data } = await axiosClient.get('/api/duewise/entitlements')
    return data
  },

  /** GET /api/duewise/dashboard */
  async getDashboard() {
    if (APP_CONFIG.useMockApi) {
      await delay(450)
      return {
        data: {
          ...MOCK_DASHBOARD,
          plan_limits: buildMockEntitlements(),
        },
      }
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
    if (data?.data && Array.isArray(data.data)) {
      data.data = data.data.map((inv) => ({
        ...inv,
        ai_prediction: normalizeInvoiceAIPrediction(inv),
      }))
    }
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
          ai_prediction: normalizeInvoiceAIPrediction(found),
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
    if (data?.data) {
      data.data.ai_prediction = normalizeInvoiceAIPrediction(data.data)
    }
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
      if (mockInvoices.length >= 10) {
        const error = new Error(
          'Trial accounts are limited to a maximum of 10 invoices. Please upgrade to the Base plan to create up to 500 invoices.'
        )
        error.isAxiosError = true
        error.response = {
          status: 403,
          data: {
            message:
              'Trial accounts are limited to a maximum of 10 invoices. Please upgrade to the Base plan to create up to 500 invoices.',
            error: 'TRIAL_INVOICE_LIMIT_EXCEEDED',
            current_count: mockInvoices.length,
            limit: 10,
            plan: 'trial',
            upgrade_url: '/billing/plans?product=duewise',
          },
        }
        throw error
      }
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
      const requested = payload.channel || 'auto'
      if (requested === 'whatsapp' || requested === 'sms') {
        const error = new Error(
          'SMS and WhatsApp reminders are not available on the free trial. Please upgrade to the Base plan to unlock multi-channel reminders and Smart Channel AI.'
        )
        error.isAxiosError = true
        error.response = {
          status: 403,
          data: {
            message:
              'SMS and WhatsApp reminders are not available on the free trial. Please upgrade to the Base plan to unlock multi-channel reminders and Smart Channel AI.',
            error: 'TRIAL_CHANNEL_RESTRICTED',
            requested_channel: requested,
            allowed_channels: ['email'],
            plan: 'trial',
            upgrade_url: '/billing/plans?product=duewise',
          },
        }
        throw error
      }
      // On trial, 'auto' strictly resolves to 'email' without error
      const channel = 'email'
      return {
        message: `Payment reminder dispatched successfully via ${channel}.`,
        data: {
          log_id: Date.now(),
          channel,
          tone: payload.tone ?? '',
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

  // ─── 6.5 Monthly Recovery Fee Engine ─────────────────────────────────────

  /**
   * GET /api/duewise/recovery-fee/current-cycle
   * Live unbilled overdue recoveries in the current calendar month.
   */
  async getRecoveryCurrentCycle() {
    if (APP_CONFIG.useMockApi) {
      await delay(450)
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
      return {
        data: {
          current_plan: 'base',
          fee_percentage: 15.0,
          period_start: `${year}-${month}-01`,
          period_end: `${year}-${month}-${lastDay}`,
          total_overdue_recovered: 7.97,
          accrued_recovery_fee: 1.20,
          invoices_count: 2,
          qualifying_invoices: [
            {
              id: 102,
              number: 'INV-2026-002',
              client_name: 'Acme Corp Ltd',
              original_currency: 'PKR',
              original_amount: 2210,
              amount_recovered: 7.97,
              recovered_at: new Date(Date.now() - 8 * 86400000).toISOString(),
              due_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
              paid_at: new Date(Date.now() - 8 * 86400000).toISOString(),
            },
            {
              id: 104,
              number: 'INV-2026-004',
              client_name: 'Metro Transit Partners',
              original_currency: 'USD',
              original_amount: 0,
              amount_recovered: 0,
              recovered_at: new Date(Date.now() - 3 * 86400000).toISOString(),
              due_date: new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10),
              paid_at: new Date(Date.now() - 3 * 86400000).toISOString(),
            },
          ],
        },
      }
    }
    const { data } = await axiosClient.get('/api/duewise/recovery-fee/current-cycle')
    return data
  },

  /**
   * GET /api/duewise/recovery-fee/batches?page=1&per_page=15
   * Historical recovery billing batches with pagination.
   */
  async getRecoveryBatches(params = {}) {
    const query = {
      page: Number(params.page) || 1,
      per_page: Number(params.per_page) || 15,
    }
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      const MOCK_BATCHES = [
        {
          id: 2,
          period_start: '2026-09-01',
          period_end: '2026-09-30',
          total_recovered: 7.97,
          fee_percentage: 15.0,
          fee_amount: 1.20,
          status: 'charged',
          stripe_invoice_id: 'in_1Px9mock02',
          charged_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          can_retry: false,
          metadata: {
            invoices_breakdown: [
              {
                invoice_id: 102,
                number: 'INV-2026-002',
                client_name: 'Acme Corp Ltd',
                original_currency: 'PKR',
                original_amount: 2210,
                converted_usd: 7.97,
                exchange_rate: 0.003604,
                recovered_at: new Date(Date.now() - 8 * 86400000).toISOString(),
              },
            ],
          },
        },
        {
          id: 1,
          period_start: '2026-08-01',
          period_end: '2026-08-31',
          total_recovered: 15000.0,
          fee_percentage: 15.0,
          fee_amount: 2250.0,
          status: 'failed',
          stripe_invoice_id: 'in_1Px8mock01',
          charged_at: new Date(Date.now() - 33 * 86400000).toISOString(),
          can_retry: true,
          metadata: {
            invoices_breakdown: [
              {
                invoice_id: 98,
                number: 'INV-2026-098',
                client_name: 'Apex Global Logistics',
                original_currency: 'USD',
                original_amount: 6000,
                converted_usd: 6000,
                exchange_rate: 1,
                recovered_at: new Date(Date.now() - 40 * 86400000).toISOString(),
              },
              {
                invoice_id: 95,
                number: 'INV-2026-095',
                client_name: 'Metro Transit Partners',
                original_currency: 'USD',
                original_amount: 9000,
                converted_usd: 9000,
                exchange_rate: 1,
                recovered_at: new Date(Date.now() - 42 * 86400000).toISOString(),
              },
            ],
          },
        },
      ]
      const page = query.page
      const perPage = query.per_page
      const total = MOCK_BATCHES.length
      const start = (page - 1) * perPage
      const slice = MOCK_BATCHES.slice(start, start + perPage)
      return {
        data: slice,
        current_page: page,
        per_page: perPage,
        total,
        last_page: Math.max(1, Math.ceil(total / perPage)),
      }
    }
    const { data } = await axiosClient.get('/api/duewise/recovery-fee/batches', { params: query })
    return data
  },

  /**
   * POST /api/duewise/recovery-fee/batches/{id}/retry
   * Retries a failed recovery fee batch charge.
   */
  async retryRecoveryBatch(id) {
    if (APP_CONFIG.useMockApi) {
      await delay(1200)
      return { message: 'Retry initiated successfully. Batch will be charged shortly.' }
    }
    const { data } = await axiosClient.post(`/api/duewise/recovery-fee/batches/${id}/retry`)
    return data
  },

  // ─── 6.3 Outbound Approval Mode & Pending Queue ──────────────────────────

  /** GET /api/duewise/reminders/mode */
  async getReminderMode() {
    if (APP_CONFIG.useMockApi) {
      await delay(300)
      return {
        data: {
          ...mockReminderMode,
          pending_approvals_count: mockApprovals.filter((a) => a.status === 'pending_approval').length,
        },
      }
    }
    const { data } = await axiosClient.get('/api/duewise/reminders/mode')
    return data
  },

  /** POST /api/duewise/reminders/mode */
  async updateReminderMode(mode) {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      const isAuto = mode === 'autopilot'
      mockReminderMode = {
        ...mockReminderMode,
        duewise_mode: mode,
        is_approval_mode: !isAuto,
        is_autopilot: isAuto,
        days_remaining: isAuto ? 0 : 30,
      }
      return {
        message: `Duewise mode successfully updated to ${mode}.`,
        data: mockReminderMode,
      }
    }
    const { data } = await axiosClient.post('/api/duewise/reminders/mode', { mode })
    return data
  },

  /** POST /api/duewise/reminders/enable-autopilot */
  async enableAutopilot() {
    if (APP_CONFIG.useMockApi) {
      return this.updateReminderMode('autopilot')
    }
    const { data } = await axiosClient.post('/api/duewise/reminders/enable-autopilot')
    return data
  },

  /** POST /api/duewise/reminders/enable-approval-mode */
  async enableApprovalMode() {
    if (APP_CONFIG.useMockApi) {
      return this.updateReminderMode('approval')
    }
    const { data } = await axiosClient.post('/api/duewise/reminders/enable-approval-mode')
    return data
  },

  /** GET /api/duewise/reminders/approvals */
  async getReminderApprovals(params = {}) {
    const query = {
      page: Number(params.page) || 1,
      per_page: Number(params.per_page) || 15,
      ...params,
    }
    if (APP_CONFIG.useMockApi) {
      await delay(350)
      const pending = mockApprovals.filter((a) => a.status === 'pending_approval')
      const total = pending.length
      const start = (query.page - 1) * query.per_page
      const slice = pending.slice(start, start + query.per_page)
      return {
        data: slice,
        meta: {
          current_page: query.page,
          per_page: query.per_page,
          total,
          last_page: Math.max(1, Math.ceil(total / query.per_page)),
        },
      }
    }
    const { data } = await axiosClient.get('/api/duewise/reminders/approvals', { params: query })
    return data
  },

  /** POST /api/duewise/reminders/approvals/{id}/approve */
  async approveReminder(id) {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      mockApprovals = mockApprovals.map((a) =>
        String(a.id) === String(id)
          ? { ...a, status: 'delivered', approved_at: new Date().toISOString() }
          : a
      )
      const found = mockApprovals.find((a) => String(a.id) === String(id))
      return {
        message: `Payment reminder #${id} approved and dispatched successfully.`,
        data: found,
      }
    }
    const { data } = await axiosClient.post(`/api/duewise/reminders/approvals/${id}/approve`)
    return data
  },

  /** POST /api/duewise/reminders/approvals/{id}/reject */
  async rejectReminder(id, reason) {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      mockApprovals = mockApprovals.map((a) =>
        String(a.id) === String(id)
          ? { ...a, status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: reason }
          : a
      )
      const found = mockApprovals.find((a) => String(a.id) === String(id))
      return {
        message: `Payment reminder #${id} rejected and dismissed.`,
        data: found,
      }
    }
    const { data } = await axiosClient.post(`/api/duewise/reminders/approvals/${id}/reject`, { reason })
    return data
  },

  /** POST /api/duewise/reminders/approvals/approve-all */
  async approveAllReminders() {
    if (APP_CONFIG.useMockApi) {
      await delay(600)
      const count = mockApprovals.filter((a) => a.status === 'pending_approval').length
      mockApprovals = mockApprovals.map((a) => ({
        ...a,
        status: 'delivered',
        approved_at: new Date().toISOString(),
      }))
      return {
        message: `All ${count} pending payment reminders have been approved and queued for dispatch.`,
        data: {
          approved_count: count,
        },
      }
    }
    const { data } = await axiosClient.post('/api/duewise/reminders/approvals/approve-all')
    return data
  },
}

let mockReminderMode = {
  duewise_mode: 'approval',
  business_tone: 'polite',
  default_tone: 'polite',
  is_approval_mode: true,
  is_autopilot: false,
  approval_started_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  days_remaining: 25,
  pending_approvals_count: 3,
}

let mockApprovals = [
  {
    id: 42,
    channel: 'email',
    recipient: 'finance@clientcorp.test',
    subject: 'Friendly Reminder: Invoice #INV-2026-004 from Acme Corp',
    body: "Hi John,\n\nWe hope you're having a productive week. Just a quick reminder that invoice #INV-2026-004 for $1,250.00 is due on Sep 28. Please let us know if you need any clarification or updated payment details.",
    status: 'pending_approval',
    queued_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    stage: 'upcoming_due',
    is_automated: true,
    is_intent_nudge: false,
    is_fallback: false,
    invoice: {
      id: 104,
      number: 'INV-2026-004',
      total_amount: 1250.0,
      balance_due: 1250.0,
      currency: 'usd',
      due_date: '2026-09-28',
      days_overdue: 0,
      status: 'open',
    },
    client: {
      id: 18,
      name: 'John Doe',
      company_name: 'Client Corp',
      email: 'finance@clientcorp.test',
      phone: '+15552345678',
      whatsapp_phone: '+15552345678',
    },
  },
  {
    id: 43,
    channel: 'sms',
    recipient: '+12025551234',
    subject: 'Payment notice: Invoice #INV-2026-002',
    body: 'Hi Sarah, gentle reminder from DueWise that invoice #INV-2026-002 ($3,200.00) is now 12 days past due. Click here to review and settle: https://age.ai/pay/inv_002',
    status: 'pending_approval',
    queued_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    stage: 'first_overdue',
    is_automated: true,
    is_intent_nudge: false,
    is_fallback: false,
    invoice: {
      id: 101,
      number: 'INV-2026-002',
      total_amount: 3200.0,
      balance_due: 3200.0,
      currency: 'usd',
      due_date: '2026-09-12',
      days_overdue: 12,
      status: 'overdue',
    },
    client: {
      id: 1,
      name: 'Acme Corp Ltd',
      company_name: 'Acme Corp',
      email: 'billing@acmecorp.com',
      phone: '+12025551234',
      whatsapp_phone: '+12025551234',
    },
  },
  {
    id: 44,
    channel: 'whatsapp',
    recipient: '+15559876543',
    subject: 'Urgent: Invoice #INV-2026-003 overdue notice',
    body: 'Hello Apex Logistics team, following up regarding outstanding invoice #INV-2026-003 ($7,000.00) which is 45 days past due. Please process payment today to avoid account escalation.',
    status: 'pending_approval',
    queued_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    stage: 'urgent_escalation',
    is_automated: true,
    is_intent_nudge: false,
    is_fallback: false,
    invoice: {
      id: 102,
      number: 'INV-2026-003',
      total_amount: 7000.0,
      balance_due: 7000.0,
      currency: 'usd',
      due_date: '2026-08-10',
      days_overdue: 45,
      status: 'overdue',
    },
    client: {
      id: 15,
      name: 'Apex Global Logistics',
      company_name: 'Apex Logistics Inc',
      email: 'ap@apexlogistics.test',
      phone: '+15559876543',
      whatsapp_phone: '+15559876543',
    },
  },
]

export const duewiseKeys = {
  all: ['duewise'],
  dashboard: () => [...duewiseKeys.all, 'dashboard'],
  aiBriefing: () => [...duewiseKeys.all, 'ai-briefing'],
  entitlements: () => [...duewiseKeys.all, 'entitlements'],
  forecast: () => [...duewiseKeys.all, 'forecast'],
  invoices: (filters) => [...duewiseKeys.all, 'invoices', filters ?? {}],
  invoice: (id) => [...duewiseKeys.all, 'invoice', id],
  invoiceActivity: (id) => [...duewiseKeys.all, 'invoice', id, 'activity'],
  quickbooksStatus: () => [...duewiseKeys.all, 'quickbooks', 'status'],
  recoveryCurrentCycle: () => [...duewiseKeys.all, 'recovery', 'current-cycle'],
  recoveryBatches: (params) => [...duewiseKeys.all, 'recovery', 'batches', params ?? {}],
  reminderMode: () => [...duewiseKeys.all, 'reminders', 'mode'],
  reminderApprovals: (params) => [...duewiseKeys.all, 'reminders', 'approvals', params ?? {}],
}
