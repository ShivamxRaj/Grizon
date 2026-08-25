import { createContext } from 'react'
import type { SettingsSectionId } from './data/sections'

export interface SettingsModalContextValue {
  /** Opens the modal, optionally jumping straight to a section (deep link). */
  openSettings: (section?: SettingsSectionId) => void
  /** Closes it from inside a section — used when a row hands off to another surface. */
  closeSettings: () => void
}

export const SettingsModalContext = createContext<SettingsModalContextValue | null>(null)
