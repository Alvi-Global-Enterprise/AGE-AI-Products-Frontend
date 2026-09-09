import { useEffect } from 'react'
import { useCurrentUser } from '@/modules/auth/hooks/useAuth'
import { useAppDispatch } from '@/app/store/hooks'
import { setUser, logout } from '@/app/store/slices/authSlice'
import { getPermanentToken } from '@/shared/api/tokenStorage'

/**
 * Hydrates Redux user from GET /api/user when a permanent token exists.
 */
export function AuthBootstrap({ children }) {
  const dispatch = useAppDispatch()
  const hasToken = Boolean(getPermanentToken())
  const { data, isError, error } = useCurrentUser({
    enabled: hasToken,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (data) dispatch(setUser(data))
  }, [data, dispatch])

  useEffect(() => {
    if (isError && error?.status === 401) dispatch(logout())
  }, [isError, error, dispatch])

  return children
}
