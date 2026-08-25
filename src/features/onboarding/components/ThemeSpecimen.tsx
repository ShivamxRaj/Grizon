import type { JSX } from 'react'
import { cn } from '@/lib/utils/cn'
import type { ThemeMode } from '@/features/theme/useTheme'

interface ThemeSpecimenProps {
  mode: ThemeMode
  label: string
  /** What picking this actually does — one line, no restating the label. */
  note: string
  selected: boolean
  onSelect: () => void
}

const SPECIMEN_CLASSES: Record<ThemeMode, string> = {
  light: 'onboarding-specimen-light',
  dark: 'onboarding-specimen-dark',
  system: 'onboarding-specimen-system',
}

/**
 * A colour specimen, not a mock app window — fake browser/app chrome is the
 * tell we're avoiding. Fixed --specimen-* tokens keep "Light" looking light
 * while the app itself is dark.
 */
function SpecimenTile({ mode }: { mode: ThemeMode }): JSX.Element {
  return (
    <span aria-hidden="true" className={cn('onboarding-specimen flex aspect-[5/3] w-full flex-col justify-center gap-1.5 overflow-hidden rounded-sm px-xs', SPECIMEN_CLASSES[mode])}>
      <span className="onboarding-specimen-dot h-2 w-2 rounded-full" />
      <span className="onboarding-specimen-bar h-1 w-4/5 rounded-pill opacity-90" />
      <span className="onboarding-specimen-bar h-1 w-3/5 rounded-pill opacity-55" />
    </span>
  )
}

export function ThemeSpecimen({ mode, label, note, selected, onSelect }: ThemeSpecimenProps): JSX.Element {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex flex-col gap-2xs rounded-card border p-2xs text-left transition-[border-color,background-color,transform,box-shadow] duration-short ease-out hover:-translate-y-0.5 active:translate-y-0',
        selected ? 'border-accent bg-accent-soft shadow-sm' : 'border-rule bg-paper-2 hover:border-accent hover:shadow-sm',
      )}
    >
      <SpecimenTile mode={mode} />
      <span className="px-3xs pb-3xs">
        <span className={cn('block font-display text-sm font-semibold', selected ? 'text-accent-text' : 'text-ink')}>{label}</span>
        <span className="settings-wrap mt-3xs block text-xs leading-relaxed text-muted">{note}</span>
      </span>
    </button>
  )
}
