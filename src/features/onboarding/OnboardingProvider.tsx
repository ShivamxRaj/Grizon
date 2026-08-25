import { useCallback, useEffect, useMemo, useState, type JSX, type ReactNode } from 'react'
import { OnboardingFlow } from './OnboardingFlow'
import { OnboardingContext } from './onboardingContext'
import { ONBOARDING_ENABLED } from './onboardingFlags'
import {
  clearOnboardingComplete,
  hasCompletedOnboarding,
  markOnboardingComplete,
} from './onboardingStorage'
import { useAuth } from '@/features/auth/useAuth'
import { updateMe } from '@/features/auth/api'

/**
 * Owns the flow and the completion flag. Mount ABOVE SettingsModalProvider so
 * the Settings replay button can call `startOnboarding`; the flow itself needs
 * nothing from Settings, so it renders here rather than in a separate outlet.
 *
 * While `ONBOARDING_ENABLED` is false the flow never opens (auto or manual).
 * Email must be verified before onboarding opens.
 */
export function OnboardingProvider({ children }: { children: ReactNode }): JSX.Element {
  const { user, refreshUser } = useAuth()
  const emailVerified = Boolean(user?.email_verified_at)
  const [hasCompleted, setHasCompleted] = useState(hasCompletedOnboarding)
  const [isOpen, setIsOpen] = useState(false)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    if (!ONBOARDING_ENABLED || !emailVerified) {
      setIsOpen(false)
      return
    }
    if (!hasCompletedOnboarding()) setIsOpen(true)
  }, [emailVerified])

  const startOnboarding = useCallback((): void => {
    if (!ONBOARDING_ENABLED || !emailVerified) return
    clearOnboardingComplete()
    setHasCompleted(false)
    setRunId((current) => current + 1)
    setIsOpen(true)
  }, [emailVerified])

  const complete = useCallback(
    async (name: string): Promise<void> => {
      const trimmed = name.trim()
      if (trimmed) {
        try {
          await updateMe({ name: trimmed.slice(0, 60) })
          await refreshUser()
        } catch {
          // Still complete local onboarding; user can rename in Settings.
        }
      }
      markOnboardingComplete()
      setHasCompleted(true)
      setIsOpen(false)
    },
    [refreshUser],
  )

  const value = useMemo(() => ({ startOnboarding, hasCompleted }), [startOnboarding, hasCompleted])

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {ONBOARDING_ENABLED ? (
        <OnboardingFlow key={runId} isOpen={isOpen} onComplete={(name) => void complete(name)} />
      ) : null}
    </OnboardingContext.Provider>
  )
}
