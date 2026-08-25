import { useCallback, useState } from 'react'
import { RESPONSE_STYLES, OCCUPATION_OPTIONS } from '@/features/settings/data/personalization'

export interface OnboardingDraft {
  name: string
  occupation: string
  responseStyle: string
  traits: string[]
  reduceMotion: boolean
}

export interface OnboardingDraftApi {
  draft: OnboardingDraft
  set: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void
  toggleTrait: (trait: string) => void
}

/** Defaults mirror what Settings already shows, so the flow never contradicts it. */
const INITIAL_DRAFT: OnboardingDraft = {
  name: '',
  occupation: OCCUPATION_OPTIONS[0].value,
  responseStyle: RESPONSE_STYLES[0].value,
  traits: [],
  reduceMotion: false,
}

export function useOnboardingDraft(): OnboardingDraftApi {
  const [draft, setDraft] = useState<OnboardingDraft>(INITIAL_DRAFT)

  const set = useCallback(<K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]): void => {
    setDraft((current) => ({ ...current, [key]: value }))
  }, [])

  const toggleTrait = useCallback((trait: string): void => {
    setDraft((current) => ({
      ...current,
      traits: current.traits.includes(trait)
        ? current.traits.filter((item) => item !== trait)
        : [...current.traits, trait],
    }))
  }, [])

  return { draft, set, toggleTrait }
}
