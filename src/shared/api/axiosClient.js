import axios from 'axios'
import { APP_CONFIG } from '@/shared/constants/config'
import { attachInterceptors } from '@/shared/api/interceptors'

/**
 * Shared Axios instance — all product/module APIs should use this client.
 */
const PROD_API_BASE_URL = 'https://production.nexservepakistan.com/'
const DEV_API_BASE_URL = 'https://dev.nexservepakistan.com/'
const STAGING_API_BASE_URL = 'https://staging.nexservepakistan.com/'

export const axiosClient = axios.create({
  baseURL: DEV_API_BASE_URL,
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
