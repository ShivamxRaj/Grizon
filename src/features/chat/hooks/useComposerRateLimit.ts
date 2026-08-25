import { useCallback, useEffect, useState } from 'react'
import { fetchUsageRateLimit } from '@/features/billing/api'
import type { UsageRateLimit } from '@/features/billing/types'
import { hasLimitedWindows } from '../components/composer/composerUsage'

interface ComposerRateLimitState {
  rateLimit: UsageRateLimit | null
  loaded: boolean
  refresh: () => Promise<void>
}

export function useComposerRateLimit(): ComposerRateLimitState {
  const [rateLimit, setRateLimit] = useState<UsageRateLimit | null>(null)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchUsageRateLimit()
      setRateLimit(hasLimitedWindows(data) ? data : null)
    } catch {
      setRateLimit(null)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { rateLimit, loaded, refresh }
}
