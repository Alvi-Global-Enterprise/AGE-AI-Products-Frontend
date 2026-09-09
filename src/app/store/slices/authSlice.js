import { createSlice } from '@reduxjs/toolkit'
import {
  getPermanentToken,
  getTempToken,
  setPermanentToken,
  setTempToken,
  clearAllTokens,
} from '@/shared/api/tokenStorage'

const permanent = getPermanentToken()
const temp = getTempToken()

const initialState = {
  user: null,
  accessToken: permanent || temp,
  isTemporary: Boolean(temp && !permanent),
  isAuthenticated: Boolean(permanent || temp),
  status: 'idle',
  error: null,
}  

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, accessToken, isTemporary = false } = action.payload
      state.user = user ?? state.user
      state.accessToken = accessToken ?? state.accessToken
      state.isTemporary = Boolean(isTemporary)
      state.isAuthenticated = true
      state.status = 'succeeded'
      state.error = null
      if (accessToken) {
        if (isTemporary) setTempToken(accessToken)
        else setPermanentToken(accessToken)
      }
    },
    setUser(state, action) {
      state.user = action.payload
      state.isAuthenticated = Boolean(action.payload) || state.isAuthenticated
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.isTemporary = false
      state.isAuthenticated = false
      state.status = 'idle'
      state.error = null
      clearAllTokens()
    },
    setAuthError(state, action) {
      state.error = action.payload
      state.status = 'failed'
    },
  },
})

export const { setCredentials, setUser, logout, setAuthError } = authSlice.actions
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectIsTemporary = (state) => state.auth.isTemporary
export const selectIsProfileComplete = (state) =>
  Boolean(state.auth.user?.is_profile_complete)
export default authSlice.reducer
