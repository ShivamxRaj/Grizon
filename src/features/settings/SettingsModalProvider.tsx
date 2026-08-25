import { useCallback, useEffect, useMemo, useState, type JSX, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { SettingsModal } from './SettingsModal'
import { SettingsModalContext } from './settingsModalContext'
import type { SettingsSectionId } from './data/sections'

/**
 * `section === null` means "no section chosen yet": desktop falls back to General,
 * mobile shows the level-1 list. One piece of state drives both layouts.
 */
export function SettingsModalProvider({ children }: { children: ReactNode }): JSX.Element {
  const { status } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [section, setSection] = useState<SettingsSectionId | null>(null)

  const openSettings = useCallback((target?: SettingsSectionId): void => {
    setSection(target ?? null)
    setIsOpen(true)
  }, [])

  const close = useCallback((): void => setIsOpen(false), [])

  // Logout clears the session but settings is portaled above the in-tree auth modal —
  // close it so the login UI is actually visible.
  useEffect(() => {
    if (status === 'unauthenticated') setIsOpen(false)
  }, [status])

  const value = useMemo(() => ({ openSettings, closeSettings: close }), [openSettings, close])

  return (
    <SettingsModalContext.Provider value={value}>
      {children}
      <SettingsModal isOpen={isOpen} section={section} onSectionChange={setSection} onClose={close} />
    </SettingsModalContext.Provider>
  )
}
