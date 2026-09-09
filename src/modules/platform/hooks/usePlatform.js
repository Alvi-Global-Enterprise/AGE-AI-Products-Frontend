import { useQuery } from '@tanstack/react-query'
import { platformApi, platformKeys } from '@/modules/platform/api/platform.api'

export function usePlatformCommandCenter() {
  return useQuery({
    queryKey: platformKeys.commandCenter(),
    queryFn: () => platformApi.getCommandCenter(),
  })
}

export function usePlatformNav() {
  return useQuery({
    queryKey: platformKeys.nav(),
    queryFn: () => platformApi.getNav(),
    staleTime: 5 * 60_000,
  })
}
