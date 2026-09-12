import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Formik, Form } from 'formik'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { AuthLayout, StepIndicator } from '@/modules/auth/components/AuthLayout'
import { FormikAuthField } from '@/modules/auth/components/FormikAuthField'
import { useCheckEmail, useLogin, useRegister } from '@/modules/auth/hooks/useAuth'
import { getAuthSchema, authFormInitialValues } from '@/modules/auth/validation'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { isUserBankReady } from '@/shared/lib/tenantBank'

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

const STEP_LABELS = {
  email: ['Email'],
  signin: ['Email', 'Password'],
  register: ['Email', 'Password', 'Verify', 'Profile'],
}

function postAuthRedirect(navigate, user) {
  if (user && !user.is_profile_complete) {
    navigate('/auth/complete-profile')
    return
  }
  if (user && !isUserBankReady(user)) {
    navigate('/auth/connect-bank')
    return
  }
  navigate('/app')
}

export default function AuthPage() {
  const navigate = useNavigate()
  const checkEmail = useCheckEmail()
  const login = useLogin()
  const register = useRegister()

  const [step, setStep] = useState('email') // email | signin | register
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formError, setFormError] = useState('')

  const loading = checkEmail.isPending || login.isPending || register.isPending

  const title =
    step === 'email' ? 'Login' : step === 'signin' ? 'Welcome back' : 'Create account'

  const subtitle =
    step === 'email'
      ? 'Enter your work email to continue with AGE AI.'
      : step === 'signin'
        ? 'Account found — enter your password to continue.'
        : 'Create a password to start your 30-day trial.'

  const indicatorSteps =
    step === 'register'
      ? STEP_LABELS.register
      : step === 'signin'
        ? STEP_LABELS.signin
        : STEP_LABELS.email
  const indicatorCurrent = step === 'email' ? 0 : 1

  const handleSubmit = async (values, helpers) => {
    setFormError('')
    const { setErrors, setFieldValue, setTouched } = helpers

    if (step === 'email') {
      try {
        const result = await checkEmail.mutateAsync(values.email.trim())
        await setFieldValue('password', '')
        await setFieldValue('password_confirmation', '')
        setShowPassword(false)
        setShowConfirm(false)
        setTouched({})
        setStep(result.is_registered ? 'signin' : 'register')
      } catch (err) {
        const appError = AppError.fromUnknown(err)
        appError.applyToFormik(setErrors)
        setFormError(getUserMessage(appError))
      }
      return
    }

    if (step === 'signin') {
      try {
        const data = await login.mutateAsync({
          email: values.email.trim(),
          password: values.password,
        })
        postAuthRedirect(navigate, data.user)
      } catch (err) {
        const appError = AppError.fromUnknown(err)
        appError.applyToFormik(setErrors)
        setFormError(getUserMessage(appError))
        if (!appError.fieldErrors) {
          setErrors({ password: getUserMessage(appError) })
        }
      }
      return
    }

    // register
    try {
      await register.mutateAsync({
        email: values.email.trim(),
        password: values.password,
        password_confirmation: values.password_confirmation,
      })
      navigate('/auth/verify-otp', { state: { email: values.email.trim() } })
    } catch (err) {
      const appError = AppError.fromUnknown(err)
      appError.applyToFormik(setErrors)
      setFormError(getUserMessage(appError))
    }
  }

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {(step === 'signin' || step === 'register') && (
        <StepIndicator steps={indicatorSteps} current={indicatorCurrent} />
      )}

      <button
        type="button"
        onClick={async () => {
          try {
            const data = await login.mutateAsync({
              email: 'demo@age.ai',
              password: 'password123',
            })
            postAuthRedirect(navigate, data.user)
          } catch (err) {
            setFormError(getUserMessage(err))
          }
        }}
        disabled={loading}
        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">or continue with email</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <Formik
        initialValues={authFormInitialValues}
        validationSchema={getAuthSchema(step)}
        validateOnBlur
        validateOnChange={false}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, setTouched }) => (
          <Form className="space-y-3" noValidate>
            {step !== 'email' && (
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setFormError('')
                  setShowPassword(false)
                  setShowConfirm(false)
                  setFieldValue('password', '')
                  setFieldValue('password_confirmation', '')
                  setTouched({})
                }}
                className="mb-1 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Change email
              </button>
            )}

            <FormikAuthField
              name="email"
              label="Email"
              type="email"
              placeholder="mail@example.com"
              autoComplete="email"
              disabled={loading && step !== 'email'}
              onChange={(e) => {
                setFieldValue('email', e.target.value)
                if (step !== 'email') {
                  setStep('email')
                  setFormError('')
                  setFieldValue('password', '')
                  setFieldValue('password_confirmation', '')
                  setTouched({})
                }
              }}
            />

            <AnimatePresence mode="wait">
              {(step === 'signin' || step === 'register') && (
                <motion.div
                  key="creds"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <FormikAuthField
                    name="password"
                    label={step === 'register' ? 'Create password' : 'Password'}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={
                      step === 'register' ? 'Min. 8 chars, uppercase + number' : 'Enter your password'
                    }
                    autoComplete={
                      step === 'signin' ? 'current-password' : 'new-password'
                    }
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

                  {step === 'register' && (
                    <FormikAuthField
                      name="password_confirmation"
                      label="Confirm password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm password"
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
                  )}

                  {step === 'signin' && (
                    <div className="flex justify-end">
                      <Link
                        to="/auth/forgot-password"
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {formError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-100">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full cursor-pointer rounded-full gradient-brand py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:brightness-105 disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Please wait…
                </span>
              ) : step === 'email' ? (
                'Continue'
              ) : step === 'signin' ? (
                'Login'
              ) : (
                'Create account'
              )}
            </button>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  )
}
