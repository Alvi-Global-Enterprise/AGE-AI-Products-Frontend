import { APP_CONFIG } from '@/shared/constants/config'
import { delay } from '@/shared/lib/delay'
import axiosClient from '@/shared/api/axiosClient'
import {
  PLATFORM,
  PRODUCTS,
  PLATFORM_NAV,
  PLATFORM_STATS,
  CURRENT_USER,
} from '@/modules/platform/data/platformData'

export const platformApi = {
  async getCommandCenter() {
    if (APP_CONFIG.useMockApi) {
      await delay(350)
      return {
        platform: PLATFORM,
        products: PRODUCTS,
        stats: PLATFORM_STATS,
        user: CURRENT_USER,
      }
    }
    const { data } = await axiosClient.get('/platform/command-center')
    return data
  },

  async getNav() {
    if (APP_CONFIG.useMockApi) {
      await delay(100)
      return { platformNav: PLATFORM_NAV, products: PRODUCTS }
    }
    const { data } = await axiosClient.get('/platform/nav')
    return data
  },
}

export const platformKeys = {
  all: ['platform'],
  commandCenter: () => [...platformKeys.all, 'command-center'],
  nav: () => [...platformKeys.all, 'nav'],
}
