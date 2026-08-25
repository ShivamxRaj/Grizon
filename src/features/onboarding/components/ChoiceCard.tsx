import type { JSX } from 'react'
import { cn } from '@/lib/utils/cn'
import { CheckIcon } from '@/components/ui/icons'

interface ChoiceCardProps {
  label: string
  /** The thing being chosen, shown verbatim — never a description of it. */
  sample: string
  selected: boolean
  onSelect: () => void
}

const BASE_CLASSES =
  'group relative flex flex-col gap-2xs rounded-card border p-sm text-left transition-[background-color,border-color,transform,box-shadow] duration-short ease-out hover:-translate-y-0.5 active:translate-y-0'

const SELECTED_CLASSES = 'border-accent bg-accent-soft shadow-sm'
const IDLE_CLASSES = 'border-rule bg-paper-2 hover:border-accent hover:shadow-sm'

function SelectedMark({ selected }: { selected: boolean }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid h-4.5 w-4.5 flex-none place-items-center rounded-full border transition-colors duration-short ease-out',
        selected ? 'border-accent-deep bg-accent-deep text-accent-ink' : 'border-rule text-transparent',
      )}
    >
      <CheckIcon className="h-2.5 w-2.5" />
    </span>
  )
}

/** Reply-style picker: the sample sentence is the real choice, the name is the label. */
export function ChoiceCard({ label, sample, selected, onSelect }: ChoiceCardProps): JSX.Element {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className={cn(BASE_CLASSES, selected ? SELECTED_CLASSES : IDLE_CLASSES)}>
      <span className="flex items-center justify-between gap-2xs">
        <span className={cn('font-display text-sm font-semibold', selected ? 'text-accent-text' : 'text-ink')}>{label}</span>
        <SelectedMark selected={selected} />
      </span>
      <span className="settings-wrap border-l border-rule pl-2xs text-sm leading-relaxed text-muted">{sample}</span>
    </button>
  )
}
