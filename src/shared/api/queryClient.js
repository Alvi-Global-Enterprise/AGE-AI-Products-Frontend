import { QueryClient } from '@tanstack/react-query'
import { handleError } from '@/shared/errors/errorHandler'

/**
 * Shared TanStack Query client — tuned for snappy UX without over-fetching.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        const status = error?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        handleError(error, { context: 'mutation' })
      },
    },
  },
})

queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'updated' && event.query.state.status === 'error') {
    handleError(event.query.state.error, {
      context: `query:${String(event.query.queryKey?.[0] ?? 'unknown')}`,
      silent: true,
    })
  }
})
