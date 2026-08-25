import type { JSX } from 'react'
import { OCCUPATION_OPTIONS } from '@/features/settings/data/personalization'
import { ChoiceChip } from '../components/ChoiceChip'
import { StepField } from '../components/StepField'
import type { OnboardingDraftApi } from '../hooks/useOnboardingDraft'

const NAME_MAX_LENGTH = 40

export function YouStep({ draft, set }: OnboardingDraftApi): JSX.Element {
  return (
    <>
      <StepField label="Display name">
        <input
          type="text"
          aria-label="Display name"
          value={draft.name}
          maxLength={NAME_MAX_LENGTH}
          placeholder="What should we call you?"
          onChange={(event) => set('name', event.target.value)}
          className="w-full min-w-0 rounded-input border border-rule bg-paper px-sm py-xs font-display text-md text-ink outline-none transition-colors duration-short ease-out placeholder:font-body placeholder:text-md placeholder:text-muted hover:border-accent/35 focus:border-accent md:max-w-96"
        />
      </StepField>

      <StepField label="Line of work" hint="Optional. It changes how much background Grizon assumes, nothing else.">
        <div role="radiogroup" aria-label="Line of work" className="flex flex-wrap gap-2xs">
          {OCCUPATION_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.value}
              label={option.label}
              selected={draft.occupation === option.value}
              onSelect={() => set('occupation', option.value)}
            />
          ))}
        </div>
      </StepField>
    </>
  )
}
