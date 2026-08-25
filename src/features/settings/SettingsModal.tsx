import { useCallback, useRef, useState, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '@/features/auth/hooks/useBodyScrollLock'
import { useDelayedUnmount } from '@/features/auth/hooks/useDelayedUnmount'
import { useClickOutside } from '@/features/chat/hooks/useClickOutside'
import { useIsMobile } from '@/features/chat/hooks/useIsMobile'
import './settings.css'
import { SettingsDesktop } from './components/SettingsDesktop'
import { SettingsMobile } from './components/SettingsMobile'
import { ConfirmDialog } from './components/primitives/ConfirmDialog'
import { SettingsConfirmContext, type ConfirmRequest } from './settingsConfirmContext'
import { useFocusTrap } from './hooks/useFocusTrap'
import type { SettingsSectionId } from './data/sections'

const CLOSE_ANIMATION_MS = 300

export interface SettingsModalProps {
  isOpen: boolean
  section: SettingsSectionId | null
  onSectionChange: (section: SettingsSectionId | null) => void
  onClose: () => void
}

export function SettingsModal(props: SettingsModalProps): JSX.Element | null {
  const { isOpen, section, onSectionChange, onClose } = props
  const isMobile = useIsMobile()
  const shouldRender = useDelayedUnmount(isOpen, CLOSE_ANIMATION_MS)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const ask = useCallback((request: ConfirmRequest): void => setConfirm(request), [])
  const dismissConfirm = useCallback((): void => setConfirm(null), [])

  // While a confirm is stacked on top, Escape and outside-clicks belong to it, not to us.
  useClickOutside(cardRef, onClose, isOpen && confirm === null)
  useBodyScrollLock(isOpen)
  // Gated on shouldRender too: the card mounts one render after isOpen flips, so
  // trapping on isOpen alone would run while cardRef is still null and never re-run.
  useFocusTrap(cardRef, isOpen && shouldRender)

  if (!shouldRender) return null

  return createPortal(
    <SettingsConfirmContext.Provider value={{ ask }}>
      <div className="settings-scrim fixed inset-0 z-[900] backdrop-blur-[2px]" style={{ background: 'var(--color-scrim)' }} data-open={isOpen} aria-hidden="true" />
      <div className="fixed inset-0 z-[901] grid place-items-center md:p-md" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div
          ref={cardRef}
          data-open={isOpen}
          className="settings-shell flex h-dvh w-full flex-col overflow-hidden bg-paper md:h-[min(42rem,calc(100dvh-var(--space-lg)))] md:w-[min(58rem,calc(100vw-var(--space-lg)))] md:rounded-card md:border md:border-rule md:shadow-lg"
        >
          {isMobile ? (
            <SettingsMobile section={section} onSectionChange={onSectionChange} onClose={onClose} />
          ) : (
            <SettingsDesktop section={section} onSectionChange={onSectionChange} onClose={onClose} />
          )}
        </div>
      </div>
      {confirm && <ConfirmDialog request={confirm} onDismiss={dismissConfirm} />}
    </SettingsConfirmContext.Provider>,
    document.body,
  )
}
