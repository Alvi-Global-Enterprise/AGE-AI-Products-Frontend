import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi, clientsKeys } from '@/modules/clients/api/clients.api'
import { handleError } from '@/shared/errors/errorHandler'

/** Normalize list filters — always send Laravel pagination params */
export function buildClientListParams(filters = {}) {
  const params = {
    page: Number(filters.page) || 1,
    per_page: Number(filters.per_page) || 15,
  }
  if (filters.search) params.search = filters.search
  if (filters.risk_tier) params.risk_tier = filters.risk_tier
  return params
}

/**
 * GET /api/clients?page=&per_page=
 * Returns full paginated response: { data, links, meta }
 */
export function useClients(filters = {}, options = {}) {
  const params = buildClientListParams(filters)
  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: () => clientsApi.list(params),
    placeholderData: (prev) => prev,
    ...options,
  })
}

/** Convenience: client array only (dropdowns) — always page=1&per_page=100 */
export function useClientsOptions(filters = {}, options = {}) {
  return useClients(
    { page: 1, per_page: 100, ...filters },
    {
      ...options,
      select: options.select ?? ((res) => res?.data ?? []),
    }
  )
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

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => clientsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKeys.all }),
    onError: (e) => handleError(e, { context: 'clients.delete' }),
  })
}

export function useToggleClientDnc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => clientsApi.toggleDnc(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKeys.all }),
    onError: (e) => handleError(e, { context: 'clients.toggleDnc' }),
  })
}

export function useClientStats(options = {}) {
  return useQuery({
    queryKey: clientsKeys.stats(),
    queryFn: () => clientsApi.stats(),
    select: (res) => res.data ?? res,
    ...options,
  })
}
