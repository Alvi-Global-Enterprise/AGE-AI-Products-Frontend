import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { duewiseApi, duewiseKeys } from '@/products/duewise/api/duewise.api'
import { billingKeys } from '@/modules/billing/api/billing.api'
import { handleError } from '@/shared/errors/errorHandler'

export function useDuewiseDashboard() {
  return useQuery({
    queryKey: duewiseKeys.dashboard(),
    queryFn: () => duewiseApi.getDashboard(),
    select: (res) => res?.data ?? res,
  })
}

/** GET /api/duewise/entitlements — permission flags, cycle usage, quota limits & allowed channels */
export function useDuewiseEntitlements(options = {}) {
  return useQuery({
    queryKey: duewiseKeys.entitlements(),
    queryFn: () => duewiseApi.getEntitlements(),
    select: (res) => res?.data ?? res,
    ...options,
  })
}

/** GET /api/duewise/forecast — 30-day receivables projection */
export function useDuewiseForecast() {
  return useQuery({
    queryKey: duewiseKeys.forecast(),
    queryFn: () => duewiseApi.getForecast(),
    select: (res) => res?.data ?? res,
  })
}

/** GET /api/duewise/invoices — Laravel paginated list */
export function useInvoices(filters = {}, options = {}) {
  const params = {
    page: Number(filters.page) || 1,
    per_page: Number(filters.per_page) || 15,
    ...filters,
  }
  return useQuery({
    queryKey: duewiseKeys.invoices(params),
    queryFn: () => duewiseApi.getInvoices(params),
    placeholderData: (prev) => prev,
    ...options,
  })
}

export function useInvoice(id, options = {}) {
  return useQuery({
    queryKey: duewiseKeys.invoice(id),
    queryFn: () => duewiseApi.getInvoice(id),
    select: (res) => res?.data ?? res,
    enabled: Boolean(id),
    ...options,
  })
}

/** GET /api/duewise/invoices/{id}/activity */
export function useInvoiceActivity(id, options = {}) {
  return useQuery({
    queryKey: duewiseKeys.invoiceActivity(id),
    queryFn: () => duewiseApi.getInvoiceActivity(id),
    select: (res) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []),
    enabled: Boolean(id),
    ...options,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => duewiseApi.createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...duewiseKeys.all, 'invoices'] })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.entitlements() })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.dashboard() })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.forecast() })
    },
    onError: (error) => handleError(error, { context: 'duewise.createInvoice' }),
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => duewiseApi.updateInvoice(id, payload),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: [...duewiseKeys.all, 'invoices'] })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.invoice(vars.id) })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.dashboard() })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.forecast() })
    },
    onError: (error) => handleError(error, { context: 'duewise.updateInvoice' }),
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => duewiseApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...duewiseKeys.all, 'invoices'] })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.entitlements() })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.dashboard() })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.forecast() })
    },
    onError: (error) => handleError(error, { context: 'duewise.deleteInvoice' }),
  })
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => duewiseApi.markInvoicePaid(id, payload),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: [...duewiseKeys.all, 'invoices'] })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.invoice(vars.id) })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.invoiceActivity(vars.id) })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.dashboard() })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.forecast() })
    },
    onError: (error) => handleError(error, { context: 'duewise.markInvoicePaid' }),
  })
}

/** POST /api/duewise/invoices/{id}/remind */
export function useRemindInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => duewiseApi.remindInvoice(id, payload),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: duewiseKeys.invoice(vars.id) })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.invoiceActivity(vars.id) })
    },
    onError: (error) => handleError(error, { context: 'duewise.remindInvoice' }),
  })
}

/** Starts QuickBooks OAuth — returns authorization_url (caller opens new tab) */
export function useQuickBooksConnect() {
  return useMutation({
    mutationFn: async () => {
      const res = await duewiseApi.connectQuickBooks()
      const url = res?.data?.authorization_url || res?.authorization_url
      if (!url) {
        throw new Error('No authorization_url returned from QuickBooks connect.')
      }
      return url
    },
    onError: (error) => handleError(error, { context: 'duewise.quickbooksConnect' }),
  })
}

/** Completes QuickBooks OAuth with code + realmId + state from redirect query params */
export function useQuickBooksCallback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ code, realmId, state }) =>
      duewiseApi.callbackQuickBooks({ code, realmId, state }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: duewiseKeys.quickbooksStatus() })
      queryClient.invalidateQueries({ queryKey: billingKeys.accountsStatus() })
    },
    onError: (error) => handleError(error, { context: 'duewise.quickbooksCallback' }),
  })
}

/** @deprecated Prefer useAccountsStatus on Integrations — kept for niche QB-only callers */
export function useQuickBooksStatus(options = {}) {
  return useQuery({
    queryKey: duewiseKeys.quickbooksStatus(),
    queryFn: async () => {
      const res = await duewiseApi.getQuickBooksStatus()
      return res?.data ?? res
    },
    ...options,
  })
}

/** POST /api/duewise/quickbooks/sync — refresh invoices/clients after sync */
export function useQuickBooksSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => duewiseApi.syncQuickBooks(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...duewiseKeys.all, 'invoices'] })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.entitlements() })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.quickbooksStatus() })
      queryClient.invalidateQueries({ queryKey: billingKeys.accountsStatus() })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (error) => handleError(error, { context: 'duewise.quickbooksSync' }),
  })
}

/** POST /api/duewise/quickbooks/disconnect — then refresh status */
export function useQuickBooksDisconnect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => duewiseApi.disconnectQuickBooks(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: duewiseKeys.quickbooksStatus() })
      queryClient.invalidateQueries({ queryKey: billingKeys.accountsStatus() })
    },
    onError: (error) => handleError(error, { context: 'duewise.quickbooksDisconnect' }),
  })
}
