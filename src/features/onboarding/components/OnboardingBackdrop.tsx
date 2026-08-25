import type { JSX } from 'react'

/**
 * Tier-A CSS art. Same colour-mix bloom recipe as the landing page, so a first
 * run feels continuous with the marketing surface the user just came from.
 * Sizes are decorative one-offs, not scale steps.
 */
export function OnboardingBackdrop(): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="onboarding-bloom-a absolute left-[-14%] top-[-20%] h-[44rem] w-[44rem] rounded-full blur-[70px]" />
      <div className="onboarding-bloom-b absolute bottom-[-26%] right-[-16%] h-[36rem] w-[46rem] rounded-full blur-[80px]" />
    </div>
  )
}
