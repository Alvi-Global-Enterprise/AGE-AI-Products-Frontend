import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, authKeys } from '@/modules/auth/api/auth.api'
import { useAppDispatch } from '@/app/store/hooks'
import { setCredentials, setUser, logout } from '@/app/store/slices/authSlice'
import { handleError } from '@/shared/errors/errorHandler'
import { AppError } from '@/shared/errors/AppError'

export function useCheckEmail() {
  return useMutation({
    mutationFn: (email) => authApi.checkEmail(email),
    onError: (error) => handleError(error, { context: 'auth.checkEmail' }),
  })
}

export function useRegister() {
  const dispatch = useAppDispatch()
  return useMutation({
    mutationFn: (payload) => authApi.register(payload),
    onSuccess: (data) => {
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.token,
          isTemporary: true,
        })
      )
    },
    onError: (error) => handleError(error, { context: 'auth.register' }),
  })
}

export function useLogin() {
  const dispatch = useAppDispatch()
  return useMutation({
    mutationFn: (payload) => authApi.login(payload),
    onSuccess: (data) => {
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.token,
          isTemporary: Boolean(data.is_temporary),
        })
      )
    },
    onError: (error) => handleError(error, { context: 'auth.login' }),
  })
}

export function useVerifyOtp() {
  const dispatch = useAppDispatch()
  return useMutation({
    mutationFn: (payload) => authApi.verifyOtp(payload),
    onSuccess: (data) => {
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.token,
          isTemporary: false,
        })
      )
    },
    onError: (error) => handleError(error, { context: 'auth.verifyOtp' }),
  })
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (email) => authApi.resendOtp(email),
    onError: (error) => handleError(error, { context: 'auth.resendOtp' }),
  })
}

export function useCompleteProfile() {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => authApi.completeProfile(payload),
    onSuccess: (data) => {
      dispatch(setUser(data.data))
      queryClient.setQueryData(authKeys.user(), data)
    },
    onError: (error) => handleError(error, { context: 'auth.completeProfile' }),
  })
}

export function useCurrentUser(options = {}) {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authApi.getUser(),
    select: (res) => res.data,
    retry: (count, error) => {
      const err = AppError.fromUnknown(error)
      if (err.status === 401 || err.status === 403) return false
      return count < 1
    },
    ...options,
  })
}

export function useLogout() {
  const dispatch = useAppDispatch()
  return () => {
    dispatch(logout())
  }
}

/** @deprecated use useRegister */
export function useSignup() {
  return useRegister()
}
