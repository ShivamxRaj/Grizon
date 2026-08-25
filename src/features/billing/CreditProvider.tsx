import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useAuth } from '@/features/auth/useAuth'
import { fetchSubscription, fetchUsageSummary, fetchWallet } from './api'
import { CreditsContext, type CreditsContextValue } from './creditsContext'
import type { CreditBalance } from './types'

function walletToBalance(wallet: Awaited<ReturnType<typeof fetchWallet>>): CreditBalance {
  return {
    available: wallet.spendable,
    reserved: wallet.pending,
    total: wallet.balance,
    lifetimeEarned: wallet.lifetimeEarned,
    lifetimeSpent: wallet.lifetimeSpent,
    lastRefreshedAt: wallet.updatedAt,
  }
}

export function CreditProvider({ children }: { children: ReactNode }): JSX.Element {
  const { status } = useAuth()
  const authenticated = status === 'authenticated'
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [subscription, setSubscription] = useState<CreditsContextValue['subscription']>(null)
  const [usageSummary, setUsageSummary] = useState<CreditsContextValue['usageSummary']>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!authenticated) {
      setBalance(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      setBalance(walletToBalance(await fetchWallet()))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Wallet unavailable'))
    } finally {
      setIsLoading(false)
    }
  }, [authenticated])

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!authenticated) {
      setSubscription(null)
      return
    }
    try {
      const result = await fetchSubscription()
      setSubscription(result.subscription)
    } catch {
      setSubscription(null)
    }
  }, [authenticated])

  const refreshUsageSummary = useCallback(async (): Promise<void> => {
    if (!authenticated) {
      setUsageSummary(null)
      return
    }
    try {
      setUsageSummary(await fetchUsageSummary())
    } catch {
      setUsageSummary(null)
    }
  }, [authenticated])

  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all([refreshBalance(), refreshSubscription(), refreshUsageSummary()])
  }, [refreshBalance, refreshSubscription, refreshUsageSummary])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  const value = useMemo(
    (): CreditsContextValue => ({
      balance,
      subscription,
      usageSummary,
      isLoading,
      error,
      refreshBalance,
      refreshSubscription,
      refreshUsageSummary,
      refreshAll,
    }),
    [
      balance,
      subscription,
      usageSummary,
      isLoading,
      error,
      refreshBalance,
      refreshSubscription,
      refreshUsageSummary,
      refreshAll,
    ],
  )

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
}
