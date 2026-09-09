import { Navigate } from 'react-router-dom'
import { useSubscription } from '@/modules/billing/hooks/useBilling'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { Button } from '@/shared/components/ui/Button'
import { Card, CardContent } from '@/shared/components/ui/Card'

/**
 * Protects product routes: GET /api/billing/subscription?product=…
 * If not subscribed and not on trial → /app/billing?product=…
 */
export function ProductSubscriptionGuard({ product, children }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useSubscription(product)

  if (isLoading || (isFetching && !data)) {
    return (
      <div className="mx-auto max-w-lg space-y-3 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-rose-600">{getUserMessage(error)}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasAccess = Boolean(data?.subscribed || data?.on_trial)

  if (!hasAccess) {
    return (
      <Navigate
        to={`/app/billing?product=${encodeURIComponent(product)}`}
        replace
        state={{ reason: 'subscription_required', product }}
      />
    )
  }

  return children
}
