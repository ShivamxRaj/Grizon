import type { CSSProperties, JSX } from 'react'
import { cn } from '@/lib/utils/cn'
import { CheckIcon } from '@/components/ui/icons'
import { ONBOARDING_STEPS } from '../data/steps'

interface OnboardingLadderProps {
  activeIndex: number
  /** Only steps already passed are reachable — you can go back, not skip forward. */
  onSelect: (index: number) => void
}

interface LadderItemProps {
  index: number
  activeIndex: number
  label: string
  onSelect: (index: number) => void
}

/** The visible "01 You" reads as "zero one you" aloud, so state it properly instead. */
function stepLabel(index: number, label: string, isDone: boolean, isCurrent: boolean): string {
  if (isCurrent) return `Step ${index + 1}, ${label}, current step`
  return `Step ${index + 1}, ${label}, ${isDone ? 'completed — go back to it' : 'not yet reached'}`
}

function LadderItem({ index, activeIndex, label, onSelect }: LadderItemProps): JSX.Element {
  const isDone = index < activeIndex
  const isCurrent = index === activeIndex

  return (
    <button
      type="button"
      disabled={!isDone}
      onClick={() => onSelect(index)}
      aria-current={isCurrent ? 'step' : undefined}
      aria-label={stepLabel(index, label, isDone, isCurrent)}
      className={cn(
        'flex items-center gap-2xs rounded-sm py-3xs text-left transition-colors duration-short ease-out',
        isDone && 'text-ink-2 hover:text-accent-text',
        isCurrent && 'text-ink',
        !isDone && !isCurrent && 'text-muted',
      )}
    >
      {/* The whole row is described by the button's aria-label above. */}
      <span aria-hidden="true" className={cn('font-mono text-xs tabular-nums', isCurrent ? 'text-accent-text' : 'text-muted')}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <span aria-hidden="true" className={cn('text-sm', isCurrent ? 'font-semibold' : 'font-medium')}>{label}</span>
      {isDone && <CheckIcon aria-hidden="true" className="h-3 w-3 text-accent" />}
    </button>
  )
}

export function OnboardingLadder({ activeIndex, onSelect }: OnboardingLadderProps): JSX.Element {
  const fill = ((activeIndex + 1) / ONBOARDING_STEPS.length) * 100

  return (
    <nav aria-label="Setup steps" className="relative flex flex-col gap-2xs pl-sm">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-rule" />
      <span aria-hidden="true" className="onboarding-meter-y absolute left-0 top-0 w-px rounded-pill" style={{ '--progress': fill } as CSSProperties} />
      {ONBOARDING_STEPS.map((step, index) => (
        <LadderItem key={step.id} index={index} activeIndex={activeIndex} label={step.label} onSelect={onSelect} />
      ))}
    </nav>
  )
}
