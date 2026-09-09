import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CreditCard,
  Sparkles,
  Receipt,
  ExternalLink,
  Gift,
  ShieldCheck,
  Clock3,
  ArrowLeft,
  Package,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import {
  useBillingPlans,
  useBillingTransactions,
  useCancelSubscription,
} from '@/modules/billing/hooks/useBilling'
import { SubscribeModal } from '@/modules/billing/components/SubscribeModal'
import { CancelPlanModal } from '@/modules/billing/components/CancelPlanModal'
import { PaymentMethodsSection } from '@/modules/billing/components/PaymentMethodsSection'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { formatCurrency, cn } from '@/shared/lib/utils'

function money(amount, currency = 'USD') {
  if (amount == null) return '—'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amount))
  } catch {
    return formatCurrency(Number(amount))
  }
}

function trialLabel(endsAt) {
  if (!endsAt) return null
  const end = new Date(endsAt)
  const days = Math.ceil((end.getTime() - Date.now()) / 86400000)
  if (Number.isNaN(days)) return null
  if (days < 0) return 'Trial ended'
  if (days === 0) return 'Trial ends today'
  return `${days} day${days === 1 ? '' : 's'} left`
}

function statusBadge(status) {
  const map = {
    succeeded: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    failed: 'bg-rose-50 text-rose-700',
    refunded: 'bg-slate-100 text-slate-600',
  }
  return map[status] || 'bg-slate-100 text-slate-600'
}

function getBillingActions(overview, trialExpired) {
  const subscribed = Boolean(overview?.is_subscribed)
  const onTrial = Boolean(overview?.on_trial)
  const cancelPending = Boolean(overview?.current_subscription?.cancel_at_period_end)
  const canCancel =
    (subscribed || onTrial || Boolean(overview?.current_subscription)) && !cancelPending

  const showTrialCta =
    Boolean(overview?.trial_enabled) && !subscribed && !onTrial && !trialExpired

  let primary = null
  if (showTrialCta) {
    primary = { kind: 'trial', label: 'Start free trial' }
  } else if (!subscribed) {
    primary = {
      kind: 'subscribe',
      label: onTrial ? 'Upgrade to paid' : 'Subscribe',
    }
  }

  return { primary, canCancel, showTrialCta, subscribed, onTrial }
}

function lowestPrice(plans = []) {
  const amounts = plans
    .filter((p) => p.is_active !== false && p.flat_amount != null)
    .map((p) => Number(p.flat_amount))
  if (!amounts.length) return null
  return Math.min(...amounts)
}

export default function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedProduct = searchParams.get('product') || null

  // 1) Landing: GET /api/billing/plans (all products)
  const {
    data: catalog = [],
    isLoading: catalogLoading,
    isError: catalogError,
    error: catalogErr,
    refetch: refetchCatalog,
  } = useBillingPlans()

  // 2) Product selected: GET /api/billing/plans?product=duewise
  const {
    data: productDetails = [],
    isLoading: detailLoading,
    isError: detailError,
    error: detailErr,
    refetch: refetchDetail,
  } = useBillingPlans(selectedProduct)

  const txParams = useMemo(
    () =>
      selectedProduct
        ? { product: selectedProduct, per_page: 15 }
        : { per_page: 15 },
    [selectedProduct]
  )
  const {
    data: txPage,
    isLoading: txLoading,
    isError: txError,
    error: txErr,
    refetch: refetchTx,
  } = useBillingTransactions(txParams, { enabled: Boolean(selectedProduct) })

  const cancel = useCancelSubscription()

  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [subscribeIntent, setSubscribeIntent] = useState('subscribe')
  const [subscribePlan, setSubscribePlan] = useState(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  const overview = selectedProduct ? productDetails?.[0] : null
  const plans = useMemo(
    () => (overview?.plans || []).filter((p) => p.is_active !== false),
    [overview]
  )
  const transactions = txPage?.data || []
  const sub = overview?.current_subscription
  const trialDays = overview?.trial_days || plans[0]?.trial_days || 7
  const trialText = trialLabel(overview?.trial_ends_at || sub?.trial_ends_at)

  const trialExpired =
    Boolean(overview?.trial_ends_at) &&
    new Date(overview.trial_ends_at).getTime() < Date.now() &&
    !overview?.on_trial

  const actions = overview
    ? getBillingActions(overview, trialExpired)
    : { primary: null, canCancel: false, showTrialCta: false, subscribed: false, onTrial: false }

  const currentPlan = plans.find((p) => p.plan_key === overview?.current_plan)

  const selectProduct = (productSlug) => {
    setSearchParams(productSlug ? { product: productSlug } : {})
  }

  const openSubscribe = (intent, planKey) => {
    setSubscribeIntent(intent)
    setSubscribePlan(planKey || plans[0]?.plan_key || 'base')
    setSubscribeOpen(true)
  }

  const openCancel = () => {
    cancel.reset()
    setCancelOpen(true)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {selectedProduct ? (
            <button
              type="button"
              onClick={() => selectProduct(null)}
              className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              All products
            </button>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Billing</h1>
          <p className="mt-1 text-sm text-slate-500">
            {selectedProduct
              ? `Plans and subscription for ${overview?.product_name || selectedProduct}.`
              : 'Choose a product to view plans and manage your subscription.'}
          </p>
        </div>
      </div>

      {!selectedProduct && <PaymentMethodsSection />}

      {/* ——— Catalog: all products ——— */}
      {!selectedProduct && (
        <>
          {catalogLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          )}
          {catalogError && (
            <Card>
              <CardContent className="space-y-3 p-6">
                <p className="text-sm text-rose-600">{getUserMessage(catalogErr)}</p>
                <Button variant="secondary" onClick={() => refetchCatalog()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
          {!catalogLoading && !catalogError && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Products
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catalog.map((item) => {
                  const from = lowestPrice(item.plans)
                  const planCount = (item.plans || []).filter((p) => p.is_active !== false).length
                  return (
                    <button
                      key={item.product}
                      type="button"
                      onClick={() => selectProduct(item.product)}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <Package className="h-5 w-5" />
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-600" />
                      </div>
                      <p className="mt-3 font-semibold text-slate-900">
                        {item.product_name || item.product}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.is_subscribed && (
                          <Badge className="bg-emerald-50 text-emerald-700">Subscribed</Badge>
                        )}
                        {item.on_trial && (
                          <Badge className="bg-teal-50 text-teal-700">On trial</Badge>
                        )}
                        {!item.is_subscribed && !item.on_trial && (
                          <Badge variant="secondary">Available</Badge>
                        )}
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        {planCount} plan{planCount === 1 ? '' : 's'}
                        {from != null ? ` · from ${money(from)}/mo` : ''}
                        {item.trial_enabled && item.trial_days
                          ? ` · ${item.trial_days}-day trial`
                          : ''}
                      </p>
                    </button>
                  )
                })}
              </div>
              {!catalog.length && (
                <Card>
                  <CardContent className="p-8 text-center text-sm text-slate-500">
                    No products available.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* ——— Product detail: ?product=slug ——— */}
      {selectedProduct && (
        <>
          {detailLoading && <Skeleton className="h-40 rounded-2xl" />}
          {detailError && (
            <Card>
              <CardContent className="space-y-3 p-6">
                <p className="text-sm text-rose-600">{getUserMessage(detailErr)}</p>
                <Button variant="secondary" onClick={() => refetchDetail()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {overview && (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white shadow-md shadow-emerald-600/20">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {overview.product_name || selectedProduct}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {overview.on_trial && (
                          <Badge className="bg-teal-50 text-teal-700">
                            <Clock3 className="mr-1 h-3 w-3" />
                            Free trial
                          </Badge>
                        )}
                        {overview.is_subscribed && (
                          <Badge className="bg-emerald-50 text-emerald-700">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Active subscription
                          </Badge>
                        )}
                        {!overview.is_subscribed && !overview.on_trial && (
                          <Badge variant="secondary">
                            {trialExpired ? 'Trial ended' : 'No active plan'}
                          </Badge>
                        )}
                        {overview.current_plan && (
                          <Badge variant="secondary">
                            {currentPlan?.name || overview.current_plan}
                          </Badge>
                        )}
                        {sub?.stripe_status && (
                          <Badge variant="secondary">{sub.stripe_status}</Badge>
                        )}
                        {sub?.cancel_at_period_end && (
                          <Badge className="bg-amber-50 text-amber-700">
                            Cancels at period end
                          </Badge>
                        )}
                      </div>

                      {overview.on_trial && trialText && (
                        <p className="mt-3 text-sm text-slate-600">
                          <span className="font-medium text-slate-800">{trialText}</span>
                          {overview.trial_ends_at && (
                            <span className="text-slate-400">
                              {' '}
                              · ends {new Date(overview.trial_ends_at).toLocaleString()}
                            </span>
                          )}
                        </p>
                      )}
                      {actions.showTrialCta && (
                        <p className="mt-3 max-w-lg text-sm text-slate-500">
                          Start with a {trialDays}-day free trial — checkout uses Stripe
                          subscription.
                        </p>
                      )}
                      {trialExpired && !overview.is_subscribed && (
                        <p className="mt-3 max-w-lg text-sm text-amber-800">
                          Your free trial has ended. Subscribe to restore access.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:max-w-xs">
                    {actions.canCancel && (
                      <Button variant="outline" className="w-full" onClick={openCancel}>
                        Cancel plan
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Plans
            </h2>
            {detailLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-56 rounded-2xl" />
                <Skeleton className="h-56 rounded-2xl" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {plans.map((plan) => {
                  const current = overview?.current_plan === plan.plan_key
                  return (
                    <Card
                      key={plan.plan_key}
                      className={cn(current && 'ring-2 ring-emerald-500/30')}
                    >
                      <CardContent className="flex h-full flex-col space-y-3 p-5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                            <p className="font-semibold text-slate-900">{plan.name}</p>
                          </div>
                          {current && (
                            <Badge className="bg-emerald-50 text-emerald-700">Current</Badge>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-slate-900">
                          {plan.flat_amount != null
                            ? `${money(plan.flat_amount, plan.currency)}`
                            : 'Usage-based'}
                          {plan.flat_amount != null && (
                            <span className="text-sm font-medium text-slate-400">
                              /{plan.billing_interval || 'mo'}
                            </span>
                          )}
                        </p>
                        {(plan.trial_days || trialDays) > 0 && overview?.trial_enabled && (
                          <p className="text-xs font-medium text-teal-700">
                            Includes {plan.trial_days || trialDays}-day free trial
                          </p>
                        )}
                        {plan.description && (
                          <p className="text-sm text-slate-500">{plan.description}</p>
                        )}
                        {plan.performance_fee_percent != null && (
                          <p className="text-xs font-medium text-slate-500">
                            + {plan.performance_fee_percent}% performance fee
                          </p>
                        )}
                        {Array.isArray(plan.features) && plan.features.length > 0 && (
                          <ul className="space-y-1.5 border-t border-slate-100 pt-3">
                            {plan.features.map((f) => (
                              <li key={f} className="text-xs text-slate-600">
                                · {f}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-auto space-y-2 pt-2">
                          {actions.showTrialCta ? (
                            <Button
                              className="w-full"
                              onClick={() => openSubscribe('trial', plan.plan_key)}
                            >
                              <Gift className="h-4 w-4" />
                              Start free trial
                            </Button>
                          ) : !actions.subscribed ? (
                            <Button
                              className="w-full"
                              variant={current ? 'default' : 'secondary'}
                              onClick={() => openSubscribe('subscribe', plan.plan_key)}
                            >
                              {actions.onTrial
                                ? `Upgrade · ${plan.name}`
                                : `Subscribe · ${plan.name}`}
                            </Button>
                          ) : (
                            <Button
                              className="w-full"
                              variant="secondary"
                              onClick={() => openSubscribe('subscribe', plan.plan_key)}
                            >
                              {current ? 'Update payment method' : `Switch to ${plan.name}`}
                            </Button>
                          )}
                          {current && actions.canCancel && (
                            <Button
                              variant="ghost"
                              className="w-full text-rose-600"
                              onClick={openCancel}
                            >
                              Cancel this plan
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Transactions
              </h2>
              <Button variant="ghost" size="sm" disabled={txLoading} onClick={() => refetchTx()}>
                Refresh
              </Button>
            </div>

            {txLoading && <Skeleton className="h-48 rounded-2xl" />}
            {txError && (
              <Card>
                <CardContent className="space-y-3 p-6">
                  <p className="text-sm text-rose-600">{getUserMessage(txErr)}</p>
                  <Button variant="secondary" onClick={() => refetchTx()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {!txLoading && !txError && transactions.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                  <Receipt className="h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">No billing transactions yet.</p>
                </CardContent>
              </Card>
            )}

            {transactions.length > 0 && (
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-50 last:border-0">
                          <td className="max-w-xs px-4 py-3 text-slate-800">
                            {tx.description || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{tx.type}</td>
                          <td className="px-4 py-3 font-medium tabular-nums text-slate-900">
                            {money(tx.amount, tx.currency)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={statusBadge(tx.status)}>{tx.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {tx.paid_at || tx.created_at
                              ? new Date(tx.paid_at || tx.created_at).toLocaleString()
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {tx.receipt_url && (
                              <a
                                href={tx.receipt_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                              >
                                Receipt <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        productOverview={overview}
        initialPlan={subscribePlan}
        intent={subscribeIntent}
      />

      <CancelPlanModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        productName={overview?.product_name || selectedProduct || 'Product'}
        planLabel={currentPlan?.name || overview?.current_plan || 'Current plan'}
        endsHint={
          sub?.ends_at
            ? `Current period ends ${new Date(sub.ends_at).toLocaleString()}`
            : overview?.trial_ends_at
              ? `Trial ends ${new Date(overview.trial_ends_at).toLocaleString()}`
              : undefined
        }
        isPending={cancel.isPending}
        error={cancel.error}
        onConfirm={async (immediately) => {
          try {
            await cancel.mutateAsync({
              product: selectedProduct || overview?.product || 'duewise',
              immediately,
            })
            setCancelOpen(false)
          } catch {
            /* shown in modal */
          }
        }}
      />
    </div>
  )
}
