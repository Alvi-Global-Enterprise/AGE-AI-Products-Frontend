import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { duewiseApi, duewiseKeys } from '@/products/duewise/api/duewise.api'
import { handleError } from '@/shared/errors/errorHandler'

export function useDuewiseDashboard() {
  return useQuery({
    queryKey: duewiseKeys.dashboard(),
    queryFn: () => duewiseApi.getDashboard(),
  })
}

export function useInvoices(filters) {
  return useQuery({
    queryKey: duewiseKeys.invoices(filters),
    queryFn: () => duewiseApi.getInvoices(filters),
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => duewiseApi.createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: duewiseKeys.invoices() })
      queryClient.invalidateQueries({ queryKey: duewiseKeys.dashboard() })
    },
    onError: (error) => handleError(error, { context: 'duewise.createInvoice' }),
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
    },
    onError: (error) => handleError(error, { context: 'duewise.quickbooksCallback' }),
  })
}

/** GET /api/duewise/quickbooks/status — drives Connect button visibility */
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
