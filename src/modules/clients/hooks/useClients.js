import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi, clientsKeys } from '@/modules/clients/api/clients.api'
import { handleError } from '@/shared/errors/errorHandler'

export function useClients(filters) {
  return useQuery({
    queryKey: clientsKeys.list(filters),
    queryFn: () => clientsApi.list(filters),
    select: (res) => res.data ?? [],
  })
}

export function useClient(id, options = {}) {
  return useQuery({
    queryKey: clientsKeys.detail(id),
    queryFn: () => clientsApi.get(id),
    select: (res) => res.data,
    enabled: Boolean(id),
    ...options,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => clientsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKeys.all }),
    onError: (e) => handleError(e, { context: 'clients.create' }),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => clientsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKeys.all }),
    onError: (e) => handleError(e, { context: 'clients.update' }),
  })
}
