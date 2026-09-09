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

export const clientsApi = {
  async list(params = {}) {
    if (APP_CONFIG.useMockApi) {
      await delay(350)
      let items = [...mockStore]
      if (params.risk_tier) items = items.filter((c) => c.risk_tier === params.risk_tier)
      if (params.search) {
        const q = params.search.toLowerCase()
        items = items.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.company_name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q)
        )
      }
      return { data: items }
    }
    const { data } = await axiosClient.get('/api/clients', { params })
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
}

export const clientsKeys = {
  all: ['clients'],
  list: (filters) => [...clientsKeys.all, 'list', filters ?? {}],
  detail: (id) => [...clientsKeys.all, 'detail', id],
}
