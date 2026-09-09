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
