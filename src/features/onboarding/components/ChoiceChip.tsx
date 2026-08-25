import type { JSX } from 'react'
import { cn } from '@/lib/utils/cn'

interface ChoiceChipProps {
  label: string
  selected: boolean
  onSelect: () => void
  /** `radio` picks one of a set; `checkbox` toggles independently. */
  mode?: 'radio' | 'checkbox'
  disabled?: boolean
}

const BASE_CLASSES =
  'rounded-pill border px-xs py-[0.4rem] text-sm font-medium transition-[background-color,border-color,color,transform] duration-short ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-45'

const SELECTED_CLASSES = 'border-accent bg-accent-soft text-accent-text'
const IDLE_CLASSES = 'border-rule text-ink-2 hover:border-accent hover:text-accent-text'

/** Used for occupation (one of) and reply traits (any of). */
export function ChoiceChip(props: ChoiceChipProps): JSX.Element {
  const { label, selected, onSelect, mode = 'radio', disabled = false } = props

  return (
    <button
      type="button"
      // Both roles take aria-checked; only `checkbox` may be toggled off directly.
      role={mode}
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(BASE_CLASSES, selected ? SELECTED_CLASSES : IDLE_CLASSES)}
    >
      {label}
    </button>
  )
}
