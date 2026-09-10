import { APP_CONFIG } from '@/shared/constants/config'
import { delay } from '@/shared/lib/delay'
import axiosClient from '@/shared/api/axiosClient'
import {
  KPI_METRICS,
  CASH_FLOW_FORECAST,
  AI_PREDICTIONS,
  ACTIVITY_FEED,
  INVOICES,
  BILLING_SUMMARY,
} from '@/products/duewise/data/duewiseData'

export const duewiseApi = {
  async getDashboard() {
    if (APP_CONFIG.useMockApi) {
      await delay(450)
      return {
        kpis: KPI_METRICS,
        cashFlow: CASH_FLOW_FORECAST,
        predictions: AI_PREDICTIONS,
        activity: ACTIVITY_FEED,
        billing: BILLING_SUMMARY,
      }
    }
    const { data } = await axiosClient.get('/products/duewise/dashboard')
    return data
  },

  async getInvoices(params = {}) {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      return { data: INVOICES, items: INVOICES, total: INVOICES.length, ...params }
    }
    const { data } = await axiosClient.get('/api/invoices', { params })
    return data
  },

  async createInvoice(payload) {
    if (APP_CONFIG.useMockApi) {
      await delay(600)
      return {
        ...payload,
        id: `INV-${Math.floor(2000 + Math.random() * 8000)}`,
        status: 'unpaid',
        qbSync: 'pending',
      }
    }
    const { data } = await axiosClient.post('/products/duewise/invoices', payload)
    return data
  },

  /**
   * GET /api/duewise/quickbooks/connect
   * Returns Intuit OAuth authorization_url for QuickBooks Online.
   */
  async connectQuickBooks() {
    if (APP_CONFIG.useMockApi) {
      await delay(400)
      return {
        data: {
          authorization_url:
            'https://appcenter.intuit.com/connect/oauth2?client_id=mock&response_type=code&scope=com.intuit.quickbooks.accounting',
        },
      }
    }
    const { data } = await axiosClient.get('/api/duewise/quickbooks/connect')
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
   * GET /api/duewise/quickbooks/status
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
}

export const duewiseKeys = {
  all: ['duewise'],
  dashboard: () => [...duewiseKeys.all, 'dashboard'],
  invoices: (filters) => [...duewiseKeys.all, 'invoices', filters ?? {}],
  quickbooksStatus: () => [...duewiseKeys.all, 'quickbooks', 'status'],
}
