import { useContext } from 'react'
import { SettingsConfirmContext, type SettingsConfirmValue } from '../settingsConfirmContext'

export function useSettingsConfirm(): SettingsConfirmValue {
  const context = useContext(SettingsConfirmContext)
  if (!context) throw new Error('useSettingsConfirm must be used within the settings modal')
  return context
}
