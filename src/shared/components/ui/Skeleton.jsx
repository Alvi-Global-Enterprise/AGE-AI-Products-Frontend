import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-200/70', className)}
      {...props}
    />
  )
}

export function Avatar({ initials, size = 'md', className, colorIndex = 0 }) {
  const sizes = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  }

  const palettes = [
    'from-emerald-500 to-teal-600',
    'from-indigo-500 to-sky-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-blue-600',
    'from-slate-600 to-slate-800',
  ]

  const gradient = palettes[colorIndex % palettes.length]

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm',
        sizes[size],
        gradient,
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}
