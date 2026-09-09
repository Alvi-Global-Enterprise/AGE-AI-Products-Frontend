import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { store } from '@/app/store'
import { queryClient } from '@/shared/api/queryClient'
import { ErrorBoundary } from '@/shared/errors/ErrorBoundary'
import { AuthBootstrap } from '@/app/providers/AuthBootstrap'

/**
 * Root providers — Redux (client/UI state) + TanStack Query (server/API state).
 */
export function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthBootstrap>{children}</AuthBootstrap>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  )
}
