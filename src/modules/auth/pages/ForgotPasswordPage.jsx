import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Formik, Form, useField, useFormikContext } from 'formik'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from 'lucide-react'
import { AuthLayout, StepIndicator } from '@/modules/auth/components/AuthLayout'
import { FormikAuthField } from '@/modules/auth/components/FormikAuthField'
import { cn } from '@/shared/lib/utils'
import {
  getForgotPasswordSchema,
  forgotPasswordFormInitialValues,
  DEMO_OTP,
  OTP_LENGTH,
} from '@/modules/auth/validation'

const STEPS = ['Email', 'Verify OTP', 'New password']

function OtpInput({ name, error: externalError }) {
  const [field, meta, helpers] = useField(name)
  const inputsRef = useRef([])
  const value = field.value || ''
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '')
  const error = externalError || (meta.touched && meta.error)

  const focusAt = (index) => {
    const el = inputsRef.current[index]
    if (el) el.focus()
  }

  const commit = (nextDigits) => {
    helpers.setValue(nextDigits.join(''))
    helpers.setTouched(true, false)
  }

  const setDigit = (index, char) => {
    const next = [...digits]
    next[index] = char
    commit(next)
  }

  const handleChange = (index, raw) => {
    const cleaned = raw.replace(/\D/g, '')
    if (!cleaned) {
      setDigit(index, '')
      return
    }
    if (cleaned.length > 1) {
      const next = cleaned.slice(0, OTP_LENGTH).split('')
      const filled = Array.from({ length: OTP_LENGTH }, (_, i) => next[i] || digits[i] || '')
      commit(filled)
      focusAt(Math.min(next.length, OTP_LENGTH - 1))
      return
    }
    setDigit(index, cleaned)
    if (index < OTP_LENGTH - 1) focusAt(index + 1)
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) setDigit(index, '')
      else if (index > 0) {
        focusAt(index - 1)
        setDigit(index - 1, '')
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) focusAt(index - 1)
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) focusAt(index + 1)
  }

  return (
    <div>
      <div className="flex justify-between gap-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onBlur={() => helpers.setTouched(true)}
            onFocus={(e) => e.target.select()}
            className={cn(
              'h-12 w-full max-w-[52px] rounded-2xl border bg-white text-center text-lg font-semibold tabular-nums text-slate-900 outline-none transition',
              'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15',
              error ? 'border-rose-300' : 'border-slate-200 hover:border-slate-300'
            )}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  )
}

function PasswordStrength() {
  const { values } = useFormikContext()
  const password = values.password || ''
  const checks = [
    { ok: password.length >= 8, label: '8+ characters' },
    { ok: /[A-Z]/.test(password), label: 'Uppercase' },
    { ok: /[0-9]/.test(password), label: 'Number' },
  ]
  const score = checks.filter((c) => c.ok).length

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i < score
                ? score === 3
                  ? 'bg-emerald-500'
                  : score === 2
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                : 'bg-slate-200'
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map((c) => (
          <span
            key={c.label}
            className={cn(
              'rounded-md px-2 py-0.5 text-[10px] font-medium',
              c.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
            )}
          >
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function PrimaryButton({ loading, children, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className="mt-1 w-full cursor-pointer rounded-full gradient-brand py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:brightness-105 disabled:opacity-60"
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Please wait…
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [done, setDone] = useState(false)
  const [emailSnapshot, setEmailSnapshot] = useState('')

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  const maskEmail = (value) => {
    const [user, domain] = value.split('@')
    if (!user || !domain) return value
    return `${user.slice(0, 2)}${'•'.repeat(Math.max(user.length - 2, 2))}@${domain}`
  }

  const stepMeta = [
    {
      icon: Mail,
      title: 'Forgot password?',
      description: 'Enter your work email and we’ll send a one-time verification code.',
    },
    {
      icon: ShieldCheck,
      title: 'Check your inbox',
      description: `Enter the 6-digit code sent to ${
        emailSnapshot ? maskEmail(emailSnapshot) : 'your email'
      }.`,
    },
    {
      icon: KeyRound,
      title: 'Set a new password',
      description: 'Choose a strong password you haven’t used on AGE AI before.',
    },
  ]

  const meta = stepMeta[Math.min(step, stepMeta.length - 1)]
  const Icon = meta.icon

  const handleSubmit = async (values, helpers) => {
    if (step === 0) {
      setLoading(true)
      await new Promise((r) => setTimeout(r, 800))
      setLoading(false)
      setEmailSnapshot(values.email.trim())
      setResendIn(45)
      helpers.setFieldValue('otp', '')
      helpers.setTouched({})
      setStep(1)
      return
    }

    if (step === 1) {
      setLoading(true)
      await new Promise((r) => setTimeout(r, 700))
      setLoading(false)
      helpers.setFieldValue('password', '')
      helpers.setFieldValue('confirm', '')
      helpers.setTouched({})
      setStep(2)
      return
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="Your password has been reset. You can sign in with your new credentials."
        footer={
          <p className="mb-3 text-center text-sm text-slate-500">
            <Link to="/auth" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Back to Login
            </Link>
          </p>
        }
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <CheckCircle2 className="h-7 w-7" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full gradient-brand py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:brightness-105"
        >
          Back to AGE AI Login
          <ArrowRight className="h-4 w-4" />
        </button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={meta.title}
      subtitle={meta.description}
      footer={
        <p className="mb-3 text-center text-sm text-slate-500">
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </p>
      }
    >
      <StepIndicator steps={STEPS} current={step} />

      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium text-slate-500">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      <Formik
        initialValues={forgotPasswordFormInitialValues}
        validationSchema={getForgotPasswordSchema(step)}
        validateOnBlur
        validateOnChange={false}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, setTouched, isSubmitting }) => (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <Form className="space-y-4" noValidate>
                {step === 0 && (
                  <>
                    <FormikAuthField
                      name="email"
                      id="reset-email"
                      label="Email"
                      type="email"
                      placeholder="mail@example.com"
                      autoComplete="email"
                      autoFocus
                    />
                    <PrimaryButton loading={loading || isSubmitting}>
                      <span className="inline-flex items-center gap-2">
                        Send verification code
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </PrimaryButton>
                  </>
                )}

                {step === 1 && (
                  <>
                    <OtpInput name="otp" />
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(0)
                          setFieldValue('otp', '')
                          setTouched({})
                        }}
                        className="cursor-pointer font-medium text-slate-500 hover:text-slate-700"
                      >
                        Change email
                      </button>
                      <button
                        type="button"
                        disabled={resendIn > 0 || loading}
                        onClick={() => {
                          setResendIn(45)
                          setFieldValue('otp', '')
                        }}
                        className={cn(
                          'font-medium cursor-pointer',
                          resendIn > 0
                            ? 'cursor-not-allowed text-slate-400'
                            : 'text-emerald-700 hover:text-emerald-800'
                        )}
                      >
                        {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                      </button>
                    </div>
                    <p className="rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                      Demo tip: use OTP{' '}
                      <span className="font-semibold text-slate-700">{DEMO_OTP}</span>
                    </p>
                    <PrimaryButton loading={loading || isSubmitting}>
                      <span className="inline-flex items-center gap-2">
                        Verify code
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </PrimaryButton>
                  </>
                )}

                {step === 2 && (
                  <>
                    <FormikAuthField
                      name="password"
                      id="new-password"
                      label="New password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      autoFocus
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      }
                    />
                    <PasswordStrength />
                    <FormikAuthField
                      name="confirm"
                      id="confirm-password"
                      label="Confirm password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                          {showConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      }
                    />
                    <PrimaryButton loading={loading || isSubmitting}>
                      <span className="inline-flex items-center gap-2">
                        Update password
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </PrimaryButton>
                  </>
                )}
              </Form>
            </motion.div>
          </AnimatePresence>
        )}
      </Formik>
    </AuthLayout>
  )
}
