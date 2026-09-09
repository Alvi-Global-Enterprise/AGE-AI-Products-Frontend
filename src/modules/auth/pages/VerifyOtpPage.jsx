import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Formik, Form, useField } from 'formik'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { AuthLayout, StepIndicator } from '@/modules/auth/components/AuthLayout'
import { useVerifyOtp, useResendOtp } from '@/modules/auth/hooks/useAuth'
import { useAppSelector } from '@/app/store/hooks'
import { selectUser } from '@/app/store/slices/authSlice'
import { verifyOtpSchema, verifyOtpInitialValues } from '@/modules/auth/validation'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { cn } from '@/shared/lib/utils'
import { getTempToken } from '@/shared/api/tokenStorage'

const OTP_LENGTH = 6
const OTP_EXPIRY_SECONDS = 60

function OtpInput({ name, disabled }) {
  const [field, meta, helpers] = useField(name)
  const inputsRef = useRef([])
  const value = field.value || ''
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '')
  const error = meta.touched && meta.error

  const focusAt = (i) => inputsRef.current[i]?.focus()
  const commit = (next) => {
    helpers.setValue(next.join(''))
    helpers.setTouched(true, false)
  }

  const applyDigits = (raw) => {
    const cleaned = String(raw || '').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!cleaned) return
    const filled = Array.from({ length: OTP_LENGTH }, (_, idx) => cleaned[idx] || '')
    commit(filled)
    focusAt(Math.min(cleaned.length, OTP_LENGTH - 1))
  }

  useEffect(() => {
    focusAt(0)
  }, [])

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
            disabled={disabled}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '')
              if (!cleaned) {
                const next = [...digits]
                next[i] = ''
                commit(next)
                return
              }
              // Multi-digit (some browsers paste into onChange)
              if (cleaned.length > 1) {
                applyDigits(cleaned)
                return
              }
              const next = [...digits]
              next[i] = cleaned
              commit(next)
              if (i < OTP_LENGTH - 1) focusAt(i + 1)
            }}
            onPaste={(e) => {
              e.preventDefault()
              applyDigits(e.clipboardData.getData('text'))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                if (digits[i]) {
                  const next = [...digits]
                  next[i] = ''
                  commit(next)
                } else if (i > 0) focusAt(i - 1)
              }
              if (e.key === 'ArrowLeft' && i > 0) focusAt(i - 1)
              if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) focusAt(i + 1)
            }}
            onBlur={() => helpers.setTouched(true)}
            onFocus={(e) => e.target.select()}
            className={cn(
              'h-12 w-full max-w-[52px] rounded-2xl border bg-white text-center text-lg font-semibold tabular-nums text-slate-900 outline-none transition',
              'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
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

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppSelector(selectUser)
  const verifyOtp = useVerifyOtp()
  const resendOtp = useResendOtp()
  const [expiresIn, setExpiresIn] = useState(OTP_EXPIRY_SECONDS)
  const [formError, setFormError] = useState('')

  const email = location.state?.email || user?.email || ''
  const expired = expiresIn <= 0

  useEffect(() => {
    if (!getTempToken() && !email) {
      navigate('/auth', { replace: true })
    }
  }, [email, navigate])

  useEffect(() => {
    if (expiresIn <= 0) return undefined
    const t = setTimeout(() => setExpiresIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [expiresIn])

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        email
          ? `Enter the 6-digit code sent to ${email}.`
          : 'Enter the 6-digit verification code from your inbox.'
      }
      footer={
        <p className="mb-0 text-center text-sm text-slate-500">
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
      <StepIndicator steps={['Email', 'Password', 'Verify', 'Profile']} current={2} />

      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium text-slate-500">Step 3 of 4 — Email verification</p>
      </div>

      <Formik
        initialValues={verifyOtpInitialValues}
        validationSchema={verifyOtpSchema}
        validateOnBlur
        validateOnChange={false}
        onSubmit={async (values, { setErrors }) => {
          if (expired) {
            setFormError('Code expired. Please resend a new OTP.')
            return
          }
          setFormError('')
          try {
            const data = await verifyOtp.mutateAsync({
              otp: values.otp,
              email,
              token: getTempToken() || undefined,
            })
            if (!data.user?.is_profile_complete) {
              navigate('/auth/complete-profile')
            } else {
              navigate('/app')
            }
          } catch (err) {
            const appError = AppError.fromUnknown(err)
            appError.applyToFormik(setErrors)
            setFormError(getUserMessage(appError))
            if (!appError.fieldErrors) setErrors({ otp: getUserMessage(appError) })
          }
        }}
      >
        {({ setFieldValue }) => (
          <Form className="space-y-4" noValidate>
            <OtpInput name="otp" disabled={expired} />

            <div className="flex min-h-[1.25rem] items-center justify-between gap-3 text-xs">
              {expired ? (
                <span className="font-medium text-amber-600">Code expired</span>
              ) : (
                <span className="tabular-nums text-slate-400">
                  Code expires in{' '}
                  <span className="font-semibold text-slate-600">{expiresIn}s</span>
                </span>
              )}

              {expired && (
                <button
                  type="button"
                  disabled={resendOtp.isPending || !email}
                  onClick={async () => {
                    setFormError('')
                    try {
                      await resendOtp.mutateAsync(email)
                      setFieldValue('otp', '')
                      setExpiresIn(OTP_EXPIRY_SECONDS)
                    } catch (err) {
                      const appError = AppError.fromUnknown(err)
                      const wait = appError.details?.retry_after_seconds
                      if (wait) setExpiresIn(Number(wait))
                      setFormError(getUserMessage(appError))
                    }
                  }}
                  className="cursor-pointer font-semibold text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendOtp.isPending ? 'Sending…' : 'Resend OTP'}
                </button>
              )}
            </div>

            {formError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-100">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={verifyOtp.isPending || expired}
              className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full gradient-brand py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifyOtp.isPending ? (
                'Verifying…'
              ) : expired ? (
                'Code expired'
              ) : (
                <>
                  Verify & continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  )
}
