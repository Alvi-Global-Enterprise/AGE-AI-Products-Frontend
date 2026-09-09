/**
 * Token helpers for AGE AI two-token lifecycle.
 * temp → sessionStorage | permanent → localStorage
 */
import { APP_CONFIG } from '@/shared/constants/config'

export function getPermanentToken() {
  try {
    return localStorage.getItem(APP_CONFIG.tokenKey)
  } catch {
    return null
  }
}

export function getTempToken() {
  try {
    return sessionStorage.getItem(APP_CONFIG.tempTokenKey)
  } catch {
    return null
  }
}

/** Prefer permanent token; fall back to temp for OTP step */
export function getActiveToken() {
  return getPermanentToken() || getTempToken()
}

export function setPermanentToken(token) {
  try {
    if (token) localStorage.setItem(APP_CONFIG.tokenKey, token)
    sessionStorage.removeItem(APP_CONFIG.tempTokenKey)
  } catch {
    /* ignore */
  }
}

export function setTempToken(token) {
  try {
    if (token) sessionStorage.setItem(APP_CONFIG.tempTokenKey, token)
    localStorage.removeItem(APP_CONFIG.tokenKey)
  } catch {
    /* ignore */
  }
}

export function clearAllTokens() {
  try {
    localStorage.removeItem(APP_CONFIG.tokenKey)
    localStorage.removeItem(APP_CONFIG.refreshTokenKey)
    sessionStorage.removeItem(APP_CONFIG.tempTokenKey)
  } catch {
    /* ignore */
  }
}
