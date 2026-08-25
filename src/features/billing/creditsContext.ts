import { createContext } from 'react'
import type { CreditBalance, Subscription, UsageSummary } from './types'

export interface CreditsContextValue {
  balance: CreditBalance | null
  subscription: Subscription | null
  usageSummary: UsageSummary | null
  isLoading: boolean
  error: string | null
  refreshBalance: () => Promise<void>
  refreshSubscription: () => Promise<void>
  refreshUsageSummary: () => Promise<void>
  refreshAll: () => Promise<void>
}

export const CreditsContext = createContext<CreditsContextValue | null>(null)
