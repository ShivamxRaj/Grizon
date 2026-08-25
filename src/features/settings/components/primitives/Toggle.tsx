import type { JSX, ReactNode } from 'react'
import { SettingRow } from './SettingsGroup'

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  /** Announced to screen readers — the visible label lives on the SettingRow. */
  label: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="settings-toggle grid h-6 w-10 flex-none items-center rounded-pill px-[0.15rem] active:scale-95"
    >
      <span className="settings-toggle-thumb block h-[1.05rem] w-[1.05rem] rounded-full" />
    </button>
  )
}

interface ToggleRowProps {
  label: string
  description?: ReactNode
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}

/** The most common row in the whole surface — label + description + switch. */
export function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps): JSX.Element {
  return (
    <SettingRow label={label} description={description}>
      <Toggle checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </SettingRow>
  )
}
