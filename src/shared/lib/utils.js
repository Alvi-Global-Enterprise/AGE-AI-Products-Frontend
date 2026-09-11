import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes with conflict resolution (shadcn pattern). */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Format currency for display. */
export function formatCurrency(amount, opts = {}) {
  const { compact = false, currency = 'USD' } = opts
  const code = String(currency || 'USD').toUpperCase()
  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount || 0)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

/** Relative time helper for sync badges and activity feeds. */
export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
