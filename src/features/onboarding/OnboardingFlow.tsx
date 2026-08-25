import { useRef, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '@/features/auth/hooks/useBodyScrollLock'
import { useDelayedUnmount } from '@/features/auth/hooks/useDelayedUnmount'
import { useFocusTrap } from '@/features/settings/hooks/useFocusTrap'
import './onboarding.css'
import { OnboardingShell } from './components/OnboardingShell'
import { ONBOARDING_STEPS } from './data/steps'
import { useOnboardingDraft } from './hooks/useOnboardingDraft'
import { useStepNavigation } from './hooks/useStepNavigation'

const CLOSE_ANIMATION_MS = 300

export interface OnboardingFlowProps {
  isOpen: boolean
  /** Fires on Finish with the display name from the You step. */
  onComplete: (name: string) => void
}

export function OnboardingFlow({ isOpen, onComplete }: OnboardingFlowProps): JSX.Element | null {
  const shouldRender = useDelayedUnmount(isOpen, CLOSE_ANIMATION_MS)
  const shellRef = useRef<HTMLDivElement>(null)
  const draftApi = useOnboardingDraft()
  const nav = useStepNavigation(ONBOARDING_STEPS.length, () => onComplete(draftApi.draft.name))

  useBodyScrollLock(isOpen)
  useFocusTrap(shellRef, isOpen && shouldRender)

  if (!shouldRender) return null

  return createPortal(
    <OnboardingShell
      isOpen={isOpen}
      shellRef={shellRef}
      nav={nav}
      step={ONBOARDING_STEPS[nav.index]}
      draftApi={draftApi}
    />,
    document.body,
  )
}
