export type OnboardingStepId = 'you' | 'voice' | 'look'

export interface OnboardingStep {
  id: OnboardingStepId
  /** Rail label. One word, so the ladder never wraps at 320px. */
  label: string
  /** Display heading on the stage. */
  title: string
  /** Why we're asking — one line, no marketing. */
  lede: string
  /** Names what the flow deliberately left out, and where to find it later. */
  settingsHint: string
}

/**
 * Three steps on purpose: each one maps onto settings that already exist, and
 * anything past the essentials is named in `settingsHint` rather than padding
 * the flow.
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'you',
    label: 'You',
    title: 'Start with your name.',
    lede: 'Grizon greets you by it, and uses your line of work to pitch answers at the right level.',
    settingsHint: 'Email, devices and sign-in live in Account',
  },
  {
    id: 'voice',
    label: 'Voice',
    title: 'Pick how it should reply.',
    lede: 'Every sample below is the same answer written six ways. Choose the one you would rather read.',
    settingsHint: 'Custom instructions and agent defaults live in Personalization',
  },
  {
    id: 'look',
    label: 'Look',
    title: 'Then make it yours.',
    lede: 'This one applies the moment you pick it — the whole app changes behind this screen.',
    settingsHint: 'Language, region, timezone and notifications live in General',
  },
]

export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEPS.length
