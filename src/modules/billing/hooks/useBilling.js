import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingApi, billingKeys } from '@/modules/billing/api/billing.api'
import { handleError } from '@/shared/errors/errorHandler'

export function useBillingPlans(product) {
  /**
   * - useBillingPlans() / undefined → GET /api/billing/plans (all products)
   * - useBillingPlans('duewise') → GET /api/billing/plans?product=duewise
   * - useBillingPlans(null) → disabled (wait until product selected)
   */
  const hasFilter = typeof product === 'string' && product.length > 0
  const fetchAll = product === undefined

  return useQuery({
    queryKey: billingKeys.plans(hasFilter ? product : 'all'),
    queryFn: () => billingApi.getPlans(hasFilter ? product : undefined),
    select: (res) => res.data || [],
    enabled: fetchAll || hasFilter,
  })
}

export function useBillingTransactions(params = { per_page: 15 }, options = {}) {
  const { enabled = true, ...rest } = options
  return useQuery({
    queryKey: billingKeys.transactions(params),
    queryFn: () => billingApi.getTransactions(params),
    enabled,
    ...rest,
  })
}

export function useSubscription(product = 'duewise') {
  return useQuery({
    queryKey: billingKeys.subscription(product),
    queryFn: () => billingApi.getSubscription(product),
    enabled: Boolean(product),
  })
}

export function useSubscribe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => billingApi.subscribe(payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: billingKeys.all })
      if (vars?.product) {
        qc.invalidateQueries({ queryKey: billingKeys.subscription(vars.product) })
        qc.invalidateQueries({ queryKey: billingKeys.plans(vars.product) })
      }
    },
    // IncompletePayment / 3DS is handled by the subscribe form — don't toast as hard failure
    onError: (e) => {
      const details = e?.details || {}
      const hasSecret =
        details.payment?.client_secret ||
        details.payment_intent?.client_secret ||
        details.client_secret ||
        details.payment_intent_client_secret
      if (hasSecret) return
      handleError(e, { context: 'billing.subscribe' })
    },
  })
}

export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => billingApi.cancel(payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: billingKeys.all })
      if (vars?.product) {
        qc.invalidateQueries({ queryKey: billingKeys.subscription(vars.product) })
        qc.invalidateQueries({ queryKey: billingKeys.plans(vars.product) })
      }
    },
    onError: (e) => handleError(e, { context: 'billing.cancel' }),
  })
}

function extractPaymentMethodsList(res) {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.payment_methods)) return res.payment_methods
  return []
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: billingKeys.paymentMethods(),
    queryFn: () => billingApi.getPaymentMethods(),
    select: (res) => extractPaymentMethodsList(res),
  })
}

export function useAddPaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => billingApi.addPaymentMethod(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.paymentMethods() })
    },
    onError: (e) => handleError(e, { context: 'billing.addPaymentMethod' }),
  })
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => billingApi.deletePaymentMethod(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.paymentMethods() })
    },
    onError: (e) => handleError(e, { context: 'billing.deletePaymentMethod' }),
  })
}
