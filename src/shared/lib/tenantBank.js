/**
 * Tenant must have both flags true before accessing the app.
 * Source: /api/user → user.tenant
 */
export function isTenantBankReady(tenant) {
  if (!tenant || typeof tenant !== 'object') return false
  return (
    Boolean(tenant.bank_account_connected) && Boolean(tenant.payouts_enabled)
  )
}

export function isUserBankReady(user) {
  return isTenantBankReady(user?.tenant)
}
