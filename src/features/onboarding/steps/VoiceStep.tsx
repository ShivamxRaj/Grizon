import type { JSX } from 'react'
import { RESPONSE_STYLES, STYLE_TRAITS } from '@/features/settings/data/personalization'
import { ChoiceCard } from '../components/ChoiceCard'
import { ChoiceChip } from '../components/ChoiceChip'
import { StepField } from '../components/StepField'
import type { OnboardingDraftApi } from '../hooks/useOnboardingDraft'

export function VoiceStep({ draft, set, toggleTrait }: OnboardingDraftApi): JSX.Element {
  return (
    <>
      <StepField label="Reply style">
        <div role="radiogroup" aria-label="Reply style" className="grid gap-2xs sm:grid-cols-2">
          {RESPONSE_STYLES.map((style) => (
            <ChoiceCard
              key={style.value}
              label={style.label}
              sample={style.sample}
              selected={draft.responseStyle === style.value}
              onSelect={() => set('responseStyle', style.value)}
            />
          ))}
        </div>
      </StepField>

      <StepField label="Habits" hint="Pick any that apply, or none. You can change these whenever.">
        <div role="group" aria-label="Reply habits" className="flex flex-wrap gap-2xs">
          {STYLE_TRAITS.map((trait) => (
            <ChoiceChip
              key={trait}
              mode="checkbox"
              label={trait}
              selected={draft.traits.includes(trait)}
              onSelect={() => toggleTrait(trait)}
            />
          ))}
        </div>
      </StepField>
    </>
  )
}
