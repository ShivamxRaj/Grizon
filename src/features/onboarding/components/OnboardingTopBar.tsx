import type { CSSProperties, JSX } from 'react'
import { Logo } from '@/components/ui/Logo'
import { ONBOARDING_STEPS } from '../data/steps'

interface OnboardingTopBarProps {
  activeIndex: number
}

/** The ladder is desktop-only, so mobile gets the same progress as a hairline meter. */
function MobileProgress({ activeIndex }: { activeIndex: number }): JSX.Element {
  const total = ONBOARDING_STEPS.length
  const fill = ((activeIndex + 1) / total) * 100

  return (
    <div className="flex flex-col gap-3xs md:hidden">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">
        Step {activeIndex + 1} of {total} · {ONBOARDING_STEPS[activeIndex].label}
      </span>
      <span aria-hidden="true" className="h-px w-full bg-rule">
        <span className="onboarding-meter-x block h-px rounded-pill" style={{ '--progress': fill } as CSSProperties} />
      </span>
    </div>
  )
}

export function OnboardingTopBar({ activeIndex }: OnboardingTopBarProps): JSX.Element {
  return (
    <header className="flex flex-none flex-col gap-xs px-md pt-md md:px-lg">
      <span className="flex items-center gap-2xs">
        <Logo className="h-5.5 w-5.5" />
        <span className="font-display text-sm font-semibold text-ink">Grizon</span>
      </span>
      <MobileProgress activeIndex={activeIndex} />
    </header>
  )
}
