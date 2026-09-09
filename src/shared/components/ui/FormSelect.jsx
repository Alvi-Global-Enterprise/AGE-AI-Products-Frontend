import { cn } from '@/shared/lib/utils'

/** Themed select matching AuthField / Input styling */
export function FormSelect({ id, label, error, className, children, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'w-full appearance-none rounded-2xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition',
          'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
            : 'border-slate-200 hover:border-slate-300',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
