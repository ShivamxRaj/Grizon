import { useContext } from 'react'
import { SettingsModalContext, type SettingsModalContextValue } from './settingsModalContext'

export function useSettingsModal(): SettingsModalContextValue {
  const context = useContext(SettingsModalContext)
  if (!context) throw new Error('useSettingsModal must be used within a SettingsModalProvider')
  return context
}
