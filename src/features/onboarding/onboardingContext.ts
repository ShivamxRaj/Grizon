import { createContext } from 'react'

export interface OnboardingContextValue {
  /** Clears the completion flag and replays the flow from step one. */
  startOnboarding: () => void
  /** Whether this browser has finished the flow before. */
  hasCompleted: boolean
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null)
