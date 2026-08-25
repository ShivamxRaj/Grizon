import type { JSX } from 'react'
import { ArrowRightIcon, ChevronLeftIcon } from '@/components/ui/icons'
import { buttonClasses } from '@/components/ui/buttonStyles'

interface OnboardingActionsProps {
  isFirst: boolean
  isLast: boolean
  onBack: () => void
  onNext: () => void
}

export function OnboardingActions({ isFirst, isLast, onBack, onNext }: OnboardingActionsProps): JSX.Element {
  return (
    <footer className="flex flex-none items-center justify-between gap-sm border-t border-rule px-md py-sm md:px-lg">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className={`${buttonClasses('text', 'md')} disabled:pointer-events-none disabled:opacity-0`}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back
      </button>
      <button type="button" onClick={onNext} className={buttonClasses('accent', 'md')}>
        {isLast ? 'Finish setup' : 'Continue'}
        {!isLast && <ArrowRightIcon className="h-4 w-4" />}
      </button>
    </footer>
  )
}
