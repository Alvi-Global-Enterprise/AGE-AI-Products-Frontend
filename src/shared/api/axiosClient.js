import axios from 'axios'
import { APP_CONFIG } from '@/shared/constants/config'
import { attachInterceptors } from '@/shared/api/interceptors'

/**
 * Shared Axios instance — all product/module APIs should use this client.
 */
export const axiosClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: APP_CONFIG.requestTimeoutMs,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    // Avoid ngrok free-tier browser interstitial on API calls
    'ngrok-skip-browser-warning': 'true',
  },
})

attachInterceptors(axiosClient)

export default axiosClient
