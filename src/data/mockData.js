/** Compatibility barrel — prefer product/platform data modules directly. */
export * from '@/modules/platform/data/platformData'
export {
  KPI_METRICS,
  CASH_FLOW_FORECAST,
  AI_PREDICTIONS,
  ACTIVITY_FEED,
  INVOICES,
  BILLING_SUMMARY,
  DUEWISE_PRODUCT,
} from '@/products/duewise/data/duewiseData'
