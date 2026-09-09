import { Link } from 'react-router-dom'
import {
  Building2,
  Globe2,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { useCurrentUser } from '@/modules/auth/hooks/useAuth'
import { getUserMessage } from '@/shared/errors/errorHandler'
import {
  BUSINESS_TYPES,
  BUSINESS_CATEGORIES,
  COUNTRIES,
  CURRENCIES,
} from '@/shared/constants/config'

function labelFrom(options, value) {
  if (!value) return '—'
  return options.find((o) => o.value === value)?.label || value
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800 break-all">{value || '—'}</p>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  )
}

export default function ProfilePage() {
  const { data: user, isLoading, isError, error, refetch, isFetching } = useCurrentUser({
    staleTime: 30_000,
  })

  if (isLoading) return <ProfileSkeleton />

  if (isError) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <p className="text-sm text-rose-600">{getUserMessage(error)}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">
            No profile data found.
          </CardContent>
        </Card>
      </div>
    )
  }

  const tenant = user.tenant || {}
  const initials = (user.name || user.email || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your AGE AI account and tenant details from the platform.
          </p>
        </div>
        <Button variant="secondary" disabled={isFetching} onClick={() => refetch()}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {!user.is_profile_complete && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">Profile incomplete</p>
              <p className="text-xs text-amber-800/80">
                Finish onboarding so ops and billing can use your business details.
              </p>
            </div>
            <Link
              to="/auth/complete-profile"
              className="inline-flex h-10 items-center justify-center rounded-lg gradient-brand px-4 text-sm font-medium text-white shadow-sm"
            >
              Complete profile
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Hero identity */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand text-lg font-bold text-white shadow-md shadow-emerald-600/25">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">
                {user.name || 'Unnamed user'}
              </h2>
              {user.is_profile_complete ? (
                <Badge className="bg-emerald-50 text-emerald-700">Profile complete</Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-700">Incomplete</Badge>
              )}
              {tenant.on_trial && <Badge className="bg-teal-50 text-teal-700">On trial</Badge>}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(user.roles || []).map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
              {user.tenant_id && (
                <Badge variant="secondary">Tenant · {user.tenant_id}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Personal</p>
                <p className="text-xs text-slate-400">From GET /api/user</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={user.name} />
              <Field label="Phone" value={user.phone} />
              <Field label="Email" value={user.email} />
              <Field
                label="Email verified"
                value={
                  user.email_verified_at
                    ? new Date(user.email_verified_at).toLocaleString()
                    : 'Not verified'
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security / account meta */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Account</p>
                <p className="text-xs text-slate-400">Identity & access</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="User ID" value={String(user.id ?? '—')} />
              <Field
                label="Roles"
                value={(user.roles || []).join(', ') || '—'}
              />
              <Field
                label="Created"
                value={user.created_at ? new Date(user.created_at).toLocaleString() : '—'}
              />
              <Field
                label="Updated"
                value={user.updated_at ? new Date(user.updated_at).toLocaleString() : '—'}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business / tenant */}
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Business / tenant</p>
              <p className="text-xs text-slate-400">
                Set via POST /api/complete-profile (one-time)
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Business name" value={tenant.name} />
            <Field
              label="Business type"
              value={labelFrom(BUSINESS_TYPES, tenant.business_type)}
            />
            <Field
              label="Category"
              value={labelFrom(BUSINESS_CATEGORIES, tenant.business_category)}
            />
            <Field label="Business phone" value={tenant.phone} />
            <Field
              label="Country"
              value={labelFrom(COUNTRIES, tenant.country)}
            />
            <Field
              label="Currency"
              value={labelFrom(
                CURRENCIES,
                tenant.currency ? String(tenant.currency).toUpperCase() : ''
              )}
            />
            <Field label="Timezone" value={tenant.timezone} />
            <Field label="Tax ID" value={tenant.tax_id} />
            <Field
              label="Trial ends"
              value={
                tenant.trial_ends_at
                  ? new Date(tenant.trial_ends_at).toLocaleString()
                  : '—'
              }
            />
          </div>

          {(tenant.website || tenant.phone) && (
            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              {tenant.website && (
                <a
                  href={tenant.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <Globe2 className="h-4 w-4" />
                  {tenant.website}
                </a>
              )}
              {tenant.phone && (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {tenant.phone}
                </span>
              )}
            </div>
          )}

          {user.is_profile_complete && (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Profile is locked after completion. Backend does not expose an update-profile
              endpoint yet — contact support if business details need changing.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
