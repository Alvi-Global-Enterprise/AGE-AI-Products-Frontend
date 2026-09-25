import { motion } from 'framer-motion'
import { ShieldCheck, Zap, RefreshCw } from 'lucide-react'
import { PLATFORM } from '@/modules/platform/data/platformData'

const HIGHLIGHTS = [
  { Icon: Zap, text: 'Ten products · one shared platform · ~85% code reuse' },
  { Icon: RefreshCw, text: 'Human-in-the-loop: automation + Karachi ops exceptions' },
  { Icon: ShieldCheck, text: 'Tenant isolation · fail closed · billing ships first' },
]

/** Shared split-screen shell for auth & password recovery. */
export function AuthShell({ children, mobileSubtitle = 'Done-for-you outcomes' }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="relative hidden w-[46%] max-w-xl flex-col justify-between overflow-hidden px-10 py-10 text-white lg:flex xl:px-14"
        style={{
          background:
            'linear-gradient(160deg, #064e3b 0%, #047857 42%, #0f766e 78%, #115e59 100%)',
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
              <span className="text-xs font-bold tracking-tight">AGE</span>
            </div>

            <div>
              <p className="text-lg font-semibold tracking-tight">{PLATFORM.name}</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-100/80">
                Outcomes platform
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl leading-[1.15] tracking-tight text-white xl:text-5xl">
            {PLATFORM.tagline}.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-emerald-50/85">
            Connect a data source. Our system plus ops does the job the owner hates.
            Flat fee, share of result — or both. DueWise ships first.
          </p>

          <ul className="mt-10 space-y-3">
            {HIGHLIGHTS.map(({ Icon, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="flex items-start gap-3 rounded-xl bg-white/10 px-3.5 py-3 ring-1 ring-white/10 backdrop-blur-sm"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4 text-emerald-100" />
                </span>
                <span className="text-sm leading-snug text-emerald-50/95">{text}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-emerald-100/60">
          Company-controlled everything · MFA · secrets in vault · Demo Fridays
        </p>
      </motion.aside>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="relative flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 50% at 80% 0%, rgba(16, 185, 129, 0.07), transparent)',
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand shadow-md shadow-emerald-600/20">
              <span className="text-xs font-bold text-white">AGE</span>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">{PLATFORM.name}</p>
              <p className="text-xs text-slate-500">{mobileSubtitle}</p>
            </div>
          </div>

          {children}
        </div>
      </motion.main>
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
              className={`h-1 rounded-full transition-colors ${done || active ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
            />
            <span
              className={`text-[10px] font-medium ${active ? 'text-emerald-700' : done ? 'text-slate-500' : 'text-slate-400'
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
