import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/store/hooks'
import {
  selectIsAuthenticated,
  selectIsTemporary,
  selectUser,
} from '@/app/store/slices/authSlice'
import { getPermanentToken, getTempToken } from '@/shared/api/tokenStorage'

/**
 * Route guard per AGE AI auth matrix:
 * - unauthenticated → /auth
 * - temporary token → /auth/verify-otp
 * - authenticated && !profile complete → /auth/complete-profile
 */
export function AuthGuard({ children }) {
  const location = useLocation()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isTemporary = useAppSelector(selectIsTemporary)
  const user = useAppSelector(selectUser)
  const hasPermanent = Boolean(getPermanentToken())
  const hasTemp = Boolean(getTempToken())
  const path = location.pathname

  if (!isAuthenticated && !hasPermanent && !hasTemp) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  const onVerify = path.includes('verify-otp')
  const onComplete = path.includes('complete-profile')

  if ((isTemporary || (hasTemp && !hasPermanent)) && !onVerify) {
    return <Navigate to="/auth/verify-otp" replace />
  }

  if (hasPermanent && user && user.is_profile_complete === false && !onComplete) {
    return <Navigate to="/auth/complete-profile" replace />
  }

  return children
}

/** Public auth routes — bounce completed / mid-onboarding users */
export function GuestGuard({ children }) {
  const user = useAppSelector(selectUser)
  const hasPermanent = Boolean(getPermanentToken())
  const hasTemp = Boolean(getTempToken())

  if (hasTemp) {
    return <Navigate to="/auth/verify-otp" replace />
  }
  if (hasPermanent && user?.is_profile_complete) {
    return <Navigate to="/app" replace />
  }
  if (hasPermanent && user && user.is_profile_complete === false) {
    return <Navigate to="/auth/complete-profile" replace />
  }
  return children
}
