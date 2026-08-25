import type { JSX, RefObject } from 'react'
import { OnboardingActions } from './OnboardingActions'
import { OnboardingBackdrop } from './OnboardingBackdrop'
import { OnboardingLadder } from './OnboardingLadder'
import { OnboardingStage } from './OnboardingStage'
import { OnboardingTopBar } from './OnboardingTopBar'
import type { OnboardingStep } from '../data/steps'
import type { OnboardingDraftApi } from '../hooks/useOnboardingDraft'
import type { StepNavigation } from '../hooks/useStepNavigation'

interface OnboardingShellProps {
  isOpen: boolean
  shellRef: RefObject<HTMLDivElement | null>
  nav: StepNavigation
  step: OnboardingStep
  draftApi: OnboardingDraftApi
}

/** Below `md` the ladder is replaced by the top bar's meter — see OnboardingTopBar. */
function LadderColumn({ nav }: { nav: StepNavigation }): JSX.Element {
  return (
    <aside className="hidden w-44 flex-none px-lg pt-lg lg:w-52 md:block">
      <OnboardingLadder activeIndex={nav.index} onSelect={nav.goTo} />
    </aside>
  )
}

export function OnboardingShell(props: OnboardingShellProps): JSX.Element {
  const { isOpen, shellRef, nav, step, draftApi } = props

  return (
    <div
      ref={shellRef}
      data-open={isOpen}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="onboarding-shell fixed inset-0 z-[950] flex flex-col overflow-hidden bg-paper"
    >
      <OnboardingBackdrop />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <OnboardingTopBar activeIndex={nav.index} />
        <div className="flex min-h-0 flex-1">
          <LadderColumn nav={nav} />
          <OnboardingStage step={step} draftApi={draftApi} />
        </div>
        <OnboardingActions isFirst={nav.isFirst} isLast={nav.isLast} onBack={nav.back} onNext={nav.next} />
      </div>
    </div>
  )
}
