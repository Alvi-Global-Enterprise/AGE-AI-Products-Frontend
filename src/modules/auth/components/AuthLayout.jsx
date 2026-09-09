import { motion } from 'framer-motion'
import { PLATFORM } from '@/modules/platform/data/platformData'
import { cn } from '@/shared/lib/utils'

/**
 * Shared split auth card — same UI for login, signup, and forgot-password.
 * Left: form children · Right: hero image + text overlays
 */
export function AuthLayout({ children, title, subtitle, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef5f8] px-4 py-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex w-full max-w-6xl max-h-[calc(100vh-0.75rem)] items-stretch overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/60"
      >
        {/* LEFT — form (vertically centered) */}
        <div className="flex w-full flex-col justify-center px-7 py-9 sm:px-10 sm:py-10 lg:w-1/2">
          <div>
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow-sm shadow-emerald-600/25">
                <span className="text-[10px] font-bold text-white">AGE</span>
              </div>
              <span className="text-sm font-semibold text-slate-800">{PLATFORM.name}</span>
            </div>

            {(title || subtitle) && (
              <div className="mb-5">
                {title && (
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    {title}
                  </h1>
                )}
                {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
              </div>
            )}

            {children}
          </div>

          {footer && <div className="mt-6">{footer}</div>}
        </div>

        {/* RIGHT — equal-width cover image + overlays */}
        <div className="relative hidden min-h-[720px] overflow-hidden lg:block lg:w-1/2">
          <img
            src="/images/auth-layout-img.jfif"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_70%]"
            aria-hidden
          />

          {/* Headline — same placement as old baked-in text */}
          <div className="pointer-events-none absolute left-6 top-8 z-10 max-w-[280px] xl:left-8 xl:top-24 xl:max-w-[320px]">
            <p className="text-[1.85rem] font-bold leading-[1.15] tracking-tight text-white xl:text-[2.50rem]">
              One platform.
              <br />
              Done-for-you
              <br />
              outcomes.
            </p>
            <p className="mt-3 text-[13px] leading-snug text-white/90 xl:text-xl">
              Smarter tools. Brighter results.
              <br />
              Built for you.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function AuthField({ id, label, error, className, trailing, ...props }) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={cn(
            'w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400',
            'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
              : 'border-slate-200 hover:border-slate-300',
            trailing && 'pr-11',
            className
          )}
          {...props}
        />
        {trailing}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  )
}

export function StepIndicator({ steps, current }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {steps.map((label, i) => {
        const active = i === current
        const done = i < current
        return (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <div
              className={`h-1 rounded-full transition-colors ${
                done || active ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            />
            <span
              className={`text-[10px] font-medium ${
                active ? 'text-emerald-700' : done ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
