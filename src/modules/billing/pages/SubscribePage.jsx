import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Elements } from '@stripe/react-stripe-js'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { SubscribeCheckoutForm } from '@/modules/billing/components/SubscribeModal'
import { useBillingPlans } from '@/modules/billing/hooks/useBilling'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { APP_CONFIG } from '@/shared/constants/config'
import { getStripe } from '@/shared/lib/stripe'

/** Standalone subscribe route — same checkout form as billing modal */
export default function SubscribePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: products, isLoading, isError, error, refetch } = useBillingPlans(
    params.get('product') || 'duewise'
  )
  const overview = products?.[0]
  const stripePromise = getStripe()
  const hasKey = Boolean(APP_CONFIG.stripePublishableKey)
  const intent = params.get('intent') === 'trial' ? 'trial' : 'subscribe'

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          to="/app/billing"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to billing
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {intent === 'trial' ? 'Start free trial' : 'Subscribe'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Stripe subscription checkout with 3D Secure support.
        </p>
      </div>

      {!hasKey && (
        <Card>
          <CardContent className="space-y-2 p-5 text-sm text-amber-900">
            <p className="font-semibold">Stripe publishable key missing</p>
            <p className="text-amber-800/90">
              Add <code className="font-mono text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code> to your{' '}
              <code className="font-mono text-xs">.env</code> and restart the Vite server.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && <Skeleton className="h-72 rounded-2xl" />}

      {isError && (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-rose-600">{getUserMessage(error)}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {overview && hasKey && (
        <Card>
          <CardContent className="p-6">
            <Elements stripe={stripePromise}>
              <SubscribeCheckoutForm
                productOverview={overview}
                initialPlan={params.get('plan') || undefined}
                intent={intent}
                onSuccess={() => navigate('/app/billing')}
              />
            </Elements>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
