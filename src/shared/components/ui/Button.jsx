import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'gradient-brand text-white shadow-sm shadow-emerald-600/20 hover:shadow-md hover:shadow-emerald-600/25 hover:-translate-y-0.5 active:translate-y-0',
        secondary:
          'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        outline:
          'border border-slate-200 bg-transparent text-slate-700 hover:bg-white hover:border-slate-300',
        danger:
          'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100',
        ai: 'gradient-ai text-white shadow-sm shadow-indigo-500/20 hover:shadow-md hover:-translate-y-0.5',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </button>
  )
}

export { buttonVariants }
