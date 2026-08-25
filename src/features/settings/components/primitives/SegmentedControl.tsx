import type { JSX } from 'react'
import { cn } from '@/lib/utils/cn'

export interface SegmentOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (next: T) => void
  label: string
  disabled?: boolean
  /** Let segments wrap instead of sharing one row — for 4+ options on mobile. */
  wrap?: boolean
}

export function SegmentedControl<T extends string>(props: SegmentedControlProps<T>): JSX.Element {
  const { options, value, onChange, label, disabled = false, wrap = false } = props

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex items-center gap-[0.2rem] rounded-sm bg-paper-3 p-[0.2rem]', wrap && 'flex-wrap', disabled && 'pointer-events-none opacity-50')}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 whitespace-nowrap rounded-sm px-sm py-[0.4rem] text-sm font-medium transition-colors duration-short ease-out',
            option.value === value ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
