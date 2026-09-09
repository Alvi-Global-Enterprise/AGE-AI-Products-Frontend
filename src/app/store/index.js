import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/app/store/slices/authSlice'
import uiReducer from '@/app/store/slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['ui/showToast'],
      },
    }),
  devTools: import.meta.env.DEV,
})
