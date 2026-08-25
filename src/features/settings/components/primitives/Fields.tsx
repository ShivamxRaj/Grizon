import { useState, type JSX, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { ChevronDownIcon } from '@/components/ui/icons'
import { buttonClasses } from '@/components/ui/buttonStyles'

const FIELD_CLASSES =
  'w-full min-w-0 rounded-input border border-rule bg-paper px-sm py-[0.45rem] text-sm text-ink outline-none transition-colors duration-short ease-out placeholder:text-muted hover:border-accent/35 focus:border-accent disabled:cursor-not-allowed disabled:opacity-50'

interface SelectFieldProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (next: string) => void
  disabled?: boolean
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  disabled?: boolean
}

interface TextAreaProps {
  label: string
  value: string
  onSave: (next: string) => void
  rows?: number
  maxLength?: number
  placeholder?: string
  footnote?: ReactNode
}

export function SelectField({ label, value, options, onChange, disabled = false }: SelectFieldProps): JSX.Element {
  return (
    <span className="relative flex w-full md:w-56">
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(FIELD_CLASSES, 'appearance-none pr-8')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-sm top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
    </span>
  )
}

export function SettingsTextField({ label, value, onChange, placeholder, disabled = false }: TextFieldProps): JSX.Element {
  return (
    <input
      type="text"
      aria-label={label}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(FIELD_CLASSES, 'md:w-56')}
    />
  )
}

/** Free text is the one place we don't auto-save — explicit Save/Cancel, with a dirty guard. */
export function SettingsTextArea({ label, value, onSave, rows = 5, maxLength = 1500, placeholder, footnote }: TextAreaProps): JSX.Element {
  const [draft, setDraft] = useState(value)
  const [saved, setSaved] = useState(false)
  const isDirty = draft !== value

  const commit = (): void => {
    onSave(draft)
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-2xs pb-xs">
      <textarea
        aria-label={label}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => { setDraft(event.target.value); setSaved(false) }}
        className={cn(FIELD_CLASSES, 'resize-none py-xs leading-relaxed')}
      />
      <div className="flex flex-wrap items-center justify-between gap-2xs">
        <span className="settings-wrap text-xs text-muted">{footnote}</span>
        <span className="flex items-center gap-2xs">
          <span className="font-mono text-[0.68rem] tabular-nums text-muted">{draft.length}/{maxLength}</span>
          {saved && !isDirty && <span aria-live="polite" className="text-xs font-medium text-[var(--color-success-ink)]">Saved</span>}
          {isDirty && (
            <>
              <button type="button" onClick={() => setDraft(value)} className={buttonClasses('text', 'sm')}>Cancel</button>
              <button type="button" onClick={commit} className={buttonClasses('accent', 'sm')}>Save</button>
            </>
          )}
        </span>
      </div>
    </div>
  )
}
