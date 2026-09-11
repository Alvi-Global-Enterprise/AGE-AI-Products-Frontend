import { APP_CONFIG } from '@/shared/constants/config'
import { delay } from '@/shared/lib/delay'
import axiosClient from '@/shared/api/axiosClient'

const MOCK_CLIENTS = [
  {
    id: 1,
    tenant_id: 'tenant-demo',
    name: 'Acme Corp Ltd',
    company_name: 'Acme International',
    email: 'billing@acmecorp.com',
    phone: '+15552345678',
    whatsapp_phone: '+15552345678',
    currency: 'USD',
    tax_number: 'TAX-12345',
    address: '123 Business Way, Suite 400, New York, NY',
    preferred_channel: 'email',
    ai_recommended_channel: 'whatsapp',
    effective_channel: 'email',
    ai_late_risk_score: 12.5,
    risk_tier: 'low',
    average_days_to_pay: 14,
    total_invoices_count: 5,
    late_invoices_count: 0,
    total_outstanding: 1250,
    total_recovered: 4500,
    quickbooks_id: null,
    quickbooks_synced_at: null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

let mockStore = [...MOCK_CLIENTS]

function paginateClients(items, params = {}) {
  const page = Math.max(1, Number(params.page) || 1)
  const perPage = Math.max(1, Number(params.per_page) || 15)
  const total = items.length
  const lastPage = Math.max(1, Math.ceil(total / perPage) || 1)
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
      path: '/api/clients',
      per_page: perPage,
      to: total === 0 ? null : Math.min(start + perPage, total),
      total,
    },
  }
}

export const clientsApi = {
  async list(params = {}) {
    const query = {
      page: Number(params.page) || 1,
      per_page: Number(params.per_page) || 15,
      ...params,
    }
    if (APP_CONFIG.useMockApi) {
      await delay(350)
      let items = [...mockStore]
      if (query.risk_tier) items = items.filter((c) => c.risk_tier === query.risk_tier)
      if (query.search) {
        const q = String(query.search).toLowerCase()
        items = items.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.company_name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q)
        )
      }
      return paginateClients(items, query)
    }
    const { data } = await axiosClient.get('/api/clients', { params: query })
    return data
  },

  async get(id) {
    if (APP_CONFIG.useMockApi) {
      await delay(250)
      const found = mockStore.find((c) => String(c.id) === String(id))
      return { data: found }
    }
    const { data } = await axiosClient.get(`/api/clients/${id}`)
    return data
  },

  async create(payload) {
    if (APP_CONFIG.useMockApi) {
      await delay(500)
      const created = {
        ...MOCK_CLIENTS[0],
        ...payload,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockStore = [created, ...mockStore]
      return { data: created }
    }
    const { data } = await axiosClient.post('/api/clients', payload)
    return data
  },

  async update(id, payload) {
    if (APP_CONFIG.useMockApi) {
      await delay(450)
      mockStore = mockStore.map((c) =>
        String(c.id) === String(id)
          ? { ...c, ...payload, updated_at: new Date().toISOString() }
          : c
      )
      return { data: mockStore.find((c) => String(c.id) === String(id)) }
    }
    const { data } = await axiosClient.put(`/api/clients/${id}`, payload)
    return data
  },

  async remove(id) {
    if (APP_CONFIG.useMockApi) {
      await delay(350)
      mockStore = mockStore.filter((c) => String(c.id) !== String(id))
      return { message: 'Client deleted successfully.' }
    }
    const { data } = await axiosClient.delete(`/api/clients/${id}`)
    return data
  },

  /** GET /api/clients/stats */
  async stats() {
    if (APP_CONFIG.useMockApi) {
      await delay(300)
      return {
        data: {
          total_clients: mockStore.length,
          total_outstanding: mockStore.reduce((s, c) => s + (c.total_outstanding || 0), 0),
          total_recovered: mockStore.reduce((s, c) => s + (c.total_recovered || 0), 0),
          average_days_to_pay: 18,
          risk_breakdown: {
            low: mockStore.filter((c) => c.risk_tier === 'low').length || 1,
            medium: mockStore.filter((c) => c.risk_tier === 'medium').length,
            high: mockStore.filter((c) => c.risk_tier === 'high').length,
          },
          channel_breakdown: {
            auto: 0,
            email: mockStore.filter((c) => c.preferred_channel === 'email').length || 1,
            sms: mockStore.filter((c) => c.preferred_channel === 'sms').length,
            whatsapp: mockStore.filter((c) => c.preferred_channel === 'whatsapp').length,
          },
          top_high_risk_clients: mockStore
            .filter((c) => c.risk_tier === 'high' || (c.ai_late_risk_score || 0) >= 70)
            .slice(0, 5)
            .map((c) => ({
              id: c.id,
              name: c.name,
              company_name: c.company_name,
              total_outstanding: c.total_outstanding,
              ai_late_risk_score: c.ai_late_risk_score,
              effective_channel: c.effective_channel,
            })),
        },
      }
    }
    const { data } = await axiosClient.get('/api/clients/stats')
    return data
  },
}

export const clientsKeys = {
  all: ['clients'],
  list: (filters) => [...clientsKeys.all, 'list', filters ?? {}],
  detail: (id) => [...clientsKeys.all, 'detail', id],
  stats: () => [...clientsKeys.all, 'stats'],
}
