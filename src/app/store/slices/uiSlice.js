import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    mobileNavOpen: false,
    globalToast: null, // { type, message } | null
  },
  reducers: {
    setSidebarCollapsed(state, action) {
      state.sidebarCollapsed = action.payload
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setMobileNavOpen(state, action) {
      state.mobileNavOpen = action.payload
    },
    showToast(state, action) {
      state.globalToast = action.payload
    },
    clearToast(state) {
      state.globalToast = null
    },
  },
})

export const {
  setSidebarCollapsed,
  toggleSidebar,
  setMobileNavOpen,
  showToast,
  clearToast,
} = uiSlice.actions

export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed
export const selectGlobalToast = (state) => state.ui.globalToast
export default uiSlice.reducer
