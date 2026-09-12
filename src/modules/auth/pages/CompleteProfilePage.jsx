import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Formik, Form } from 'formik'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, UserRound, Building2, Globe2 } from 'lucide-react'
import { AuthLayout, StepIndicator } from '@/modules/auth/components/AuthLayout'
import { FormikAuthField } from '@/modules/auth/components/FormikAuthField'
import { FormikSelect } from '@/modules/auth/components/FormikSelect'
import { FormikPhoneField } from '@/shared/components/FormikPhoneField'
import { useCompleteProfile } from '@/modules/auth/hooks/useAuth'
import {
  getCompleteProfileSchema,
  completeProfileInitialValues,
} from '@/modules/auth/validation'
import {
  BUSINESS_TYPES,
  BUSINESS_CATEGORIES,
  COUNTRIES,
  CURRENCIES,
} from '@/shared/constants/config'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'

const STEPS = [
  { key: 'personal', label: 'You', icon: UserRound, title: 'About you', subtitle: 'How should we address you on AGE AI?' },
  { key: 'business', label: 'Business', icon: Building2, title: 'Your business', subtitle: 'Tenant details for billing and ops isolation.' },
  { key: 'details', label: 'Details', icon: Globe2, title: 'Region & extras', subtitle: 'Optional — helps invoicing and localization.' },
]

export default function CompleteProfilePage() {
  const navigate = useNavigate()
  const completeProfile = useCompleteProfile()
  const [step, setStep] = useState(0)
  const [formError, setFormError] = useState('')
  const meta = STEPS[step]
  const Icon = meta.icon

  return (
    <AuthLayout title={meta.title} subtitle={meta.subtitle}>
      <StepIndicator steps={STEPS.map((s) => s.label)} current={step} />

      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium text-slate-500">
          Step {step + 1} of {STEPS.length} — Complete profile
        </p>
      </div>

      <Formik
        initialValues={completeProfileInitialValues}
        validationSchema={getCompleteProfileSchema(step)}
        validateOnBlur
        validateOnChange={false}
        onSubmit={async (values, helpers) => {
          setFormError('')
          if (step < STEPS.length - 1) {
            setStep((s) => s + 1)
            helpers.setTouched({})
            return
          }
          try {
            await completeProfile.mutateAsync({
              name: values.name.trim(),
              phone: values.phone?.trim() || undefined,
              business_name: values.business_name.trim(),
              business_type: values.business_type,
              business_category: values.business_category,
              business_phone: values.business_phone?.trim() || undefined,
              country: values.country || 'US',
              currency: (values.currency || 'USD').toLowerCase(),
              timezone: values.timezone || 'UTC',
              website: values.website?.trim() || undefined,
              tax_id: values.tax_id?.trim() || undefined,
            })
            navigate('/auth/connect-bank', { replace: true })
          } catch (err) {
            const appError = AppError.fromUnknown(err)
            appError.applyToFormik(helpers.setErrors)
            setFormError(getUserMessage(appError))
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-3" noValidate>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {step === 0 && (
                  <>
                    <FormikAuthField
                      name="name"
                      label="Full name"
                      placeholder="Sarah Jenkins"
                      autoComplete="name"
                      autoFocus
                    />
                    <FormikPhoneField
                      name="phone"
                      label="Phone (optional)"
                      defaultCountry="US"
                    />
                  </>
                )}

                {step === 1 && (
                  <>
                    <FormikAuthField
                      name="business_name"
                      label="Business name"
                      placeholder="Acme Legal Solutions LLC"
                      autoFocus
                    />
                    <FormikSelect name="business_type" label="Business type">
                      <option value="">Select type</option>
                      {BUSINESS_TYPES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </FormikSelect>
                    <FormikSelect name="business_category" label="Business category">
                      <option value="">Select category</option>
                      {BUSINESS_CATEGORIES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </FormikSelect>
                    <FormikPhoneField
                      name="business_phone"
                      label="Business phone (optional)"
                      defaultCountry="US"
                    />
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <FormikSelect name="country" label="Country">
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </FormikSelect>
                      <FormikSelect name="currency" label="Currency">
                        <option value="">Select currency</option>
                        {CURRENCIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </FormikSelect>
                    </div>
                    <FormikAuthField
                      name="timezone"
                      label="Timezone"
                      placeholder="America/New_York"
                    />
                    <FormikAuthField
                      name="website"
                      label="Website (optional)"
                      placeholder="https://acmelegal.com"
                    />
                    <FormikAuthField
                      name="tax_id"
                      label="Tax ID / EIN (optional)"
                      placeholder="EIN-12-3456789"
                    />
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {formError && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-100">
                {formError}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFormError('')
                    setStep((s) => s - 1)
                  }}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={completeProfile.isPending || isSubmitting}
                className="inline-flex flex-[1.4] cursor-pointer items-center justify-center gap-2 rounded-full gradient-brand py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:brightness-105 disabled:opacity-60"
              >
                {completeProfile.isPending ? (
                  'Saving…'
                ) : step < STEPS.length - 1 ? (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  'Finish & open AGE AI'
                )}
              </button>
            </div>

            <p className="text-center text-xs text-slate-400">
              <Link to="/auth" className="font-medium text-slate-500 hover:text-slate-800">
                Sign out and start over
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  )
}
