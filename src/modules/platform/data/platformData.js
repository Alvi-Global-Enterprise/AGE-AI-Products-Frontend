import { DUEWISE_PRODUCT } from '@/products/duewise/data/duewiseData'

/** AGE AI platform catalog / shell mock data */

export const CURRENT_USER = {
  name: 'Sarah Chen',
  email: 'sarah@northstar.io',
  avatar: 'SC',
  role: 'Tenant Admin',
  company: 'Northstar Labs',
  tenant: 'northstar-labs',
}

export const ROLES = [
  { id: 'admin', label: 'Admin', description: 'Full access & billing' },
  { id: 'finance', label: 'Finance Manager', description: 'Invoices & recovery' },
  { id: 'viewer', label: 'Viewer', description: 'Read-only dashboards' },
]

export const PLATFORM = {
  name: 'AGE AI',
  tagline: 'Done-for-you outcomes for small businesses',
  operatorHub: 'Karachi Ops',
}

export const PRODUCT_CATEGORIES = [
  {
    id: 'collections',
    label: 'Products',
    description: 'Done-for-you outcome products on the shared platform.',
  },
]

/** Registered products on the AGE AI platform */
export const PRODUCTS = [DUEWISE_PRODUCT]

export const PLATFORM_NAV = [
  { id: 'home', label: 'Command Center', path: '/app', icon: 'LayoutDashboard' },
  { id: 'operator', label: 'Operator Queue', path: '/app/operator', icon: 'Headphones' },
  { id: 'clients', label: 'Clients', path: '/app/clients', icon: 'Users' },
  { id: 'billing', label: 'Billing', path: '/app/billing', icon: 'CreditCard' },
  { id: 'settings', label: 'Tenant Settings', path: '/app/settings', icon: 'Settings' },
]

export const PLATFORM_STATS = [
  { label: 'Active tenants', value: '48', hint: 'Karachi ops capacity' },
  { label: 'Product live', value: 'DueWise', hint: 'AR · collections' },
  { label: 'Pending approvals', value: '12', hint: 'First-30-day mode' },
  { label: 'Exception queue', value: '7', hint: 'Human-in-the-loop' },
]

/** @deprecated use PRODUCTS[0].pages */
export const NAV_ITEMS = PRODUCTS[0].pages
