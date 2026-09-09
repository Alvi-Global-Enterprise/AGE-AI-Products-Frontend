import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700',
        paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
        overdue: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15',
        pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15',
        unpaid: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15',
        email: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10',
        sms: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/15',
        whatsapp: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
        sent: 'bg-slate-100 text-slate-600',
        delivered: 'bg-sky-50 text-sky-700',
        opened: 'bg-indigo-50 text-indigo-700',
        clicked: 'bg-teal-50 text-teal-700',
        replied: 'bg-emerald-50 text-emerald-700',
        synced: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
        error: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15',
        ai: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/15',
        live: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export function Badge({ className, variant, pulse = false, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
      )}
      {children}
    </span>
  )
}
