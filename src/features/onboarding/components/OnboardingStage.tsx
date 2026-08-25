import type { JSX } from 'react'
import { YouStep } from '../steps/YouStep'
import { VoiceStep } from '../steps/VoiceStep'
import { LookStep } from '../steps/LookStep'
import { SettingsPointer } from './SettingsPointer'
import type { OnboardingStep, OnboardingStepId } from '../data/steps'
import type { OnboardingDraftApi } from '../hooks/useOnboardingDraft'

interface OnboardingStageProps {
  step: OnboardingStep
  draftApi: OnboardingDraftApi
}

const STEP_BODIES: Record<OnboardingStepId, (api: OnboardingDraftApi) => JSX.Element> = {
  you: YouStep,
  voice: VoiceStep,
  look: LookStep,
}

/**
 * The body renders as a fragment, so its fields become direct children of
 * `.onboarding-stage` and pick up the staggered reveal alongside the header
 * and the pointer.
 */
export function OnboardingStage({ step, draftApi }: OnboardingStageProps): JSX.Element {
  const Body = STEP_BODIES[step.id]

  return (
    // `m-auto` on the inner block centres short steps without the top-clipping
    // that `justify-center` causes once a step overflows the scroll container.
    <div key={step.id} className="flex min-h-0 flex-1 overflow-y-auto px-md py-md md:px-lg">
      <div className="onboarding-stage m-auto flex w-full max-w-[54rem] flex-col gap-md">
        <header className="max-w-[46ch]">
          <h2 id="onboarding-title" className="settings-wrap font-display text-xl font-semibold tracking-[-0.03em] text-ink md:text-2xl">
            {step.title}
          </h2>
          <p className="settings-wrap mt-2xs text-sm leading-relaxed text-ink-2 md:text-base">{step.lede}</p>
        </header>

        <Body {...draftApi} />

        <SettingsPointer hint={step.settingsHint} />
      </div>
    </div>
  )
}
