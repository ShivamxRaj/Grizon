import type { JSX } from 'react'
import { useTheme, type ThemeMode } from '@/features/theme/useTheme'
import { Toggle } from '@/features/settings/components/primitives/Toggle'
import { StepField } from '../components/StepField'
import { ThemeSpecimen } from '../components/ThemeSpecimen'
import type { OnboardingDraftApi } from '../hooks/useOnboardingDraft'

/** Light and dark lead: the split "System" tile only makes sense after both halves. */
const THEME_CHOICES: { mode: ThemeMode; label: string; note: string }[] = [
  { mode: 'light', label: 'Light', note: 'Lavender-tinted paper.' },
  { mode: 'dark', label: 'Dark', note: 'Violet charcoal, kinder at night.' },
  { mode: 'system', label: 'System', note: 'Follows your device, and switches with it.' },
]

function MotionRow({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-sm rounded-card border border-rule bg-paper-2 px-sm py-xs">
      <div className="min-w-0">
        <p className="settings-wrap text-sm font-medium text-ink">Reduce motion</p>
        <p className="settings-wrap mt-3xs text-xs leading-relaxed text-muted">
          Cuts panel and message animations to a short fade.
        </p>
      </div>
      <Toggle label="Reduce motion" checked={checked} onChange={onChange} />
    </div>
  )
}

export function LookStep({ draft, set }: OnboardingDraftApi): JSX.Element {
  const { mode, setMode } = useTheme()

  return (
    <>
      <StepField label="Theme">
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-2xs sm:grid-cols-3">
          {THEME_CHOICES.map((choice) => (
            <ThemeSpecimen
              key={choice.mode}
              mode={choice.mode}
              label={choice.label}
              note={choice.note}
              selected={mode === choice.mode}
              onSelect={() => setMode(choice.mode)}
            />
          ))}
        </div>
      </StepField>

      <StepField label="Motion">
        <MotionRow checked={draft.reduceMotion} onChange={(next) => set('reduceMotion', next)} />
      </StepField>
    </>
  )
}
