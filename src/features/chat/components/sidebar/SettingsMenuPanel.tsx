import type { JSX, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from '@tanstack/react-router'
import { GearIcon, ExtensionsIcon, UpgradeIcon, HelpCircleIcon, LogOutIcon } from '@/components/ui/icons'
import { useAuth } from '@/features/auth/useAuth'
import { useSettingsModal } from '@/features/settings/useSettingsModal'
import type { SettingsSectionId } from '@/features/settings/data/sections'
import { ROUTE_PRICING } from '@/constants/routes'
import { useAnchorRect } from '../../hooks/useAnchorRect'
import { useIsMobile } from '../../hooks/useIsMobile'
import { LearnMoreMenuItem } from './LearnMoreMenuItem'
import { SettingsMenuItem } from './SettingsMenuItem'
import { ThemesMenuItem } from './ThemesMenuItem'

const MENU_GAP_PX = 8

type FlyoutId = 'themes' | 'learnmore' | null

interface SettingsMenuPanelProps {
  flyout: FlyoutId
  onToggleFlyout: (id: Exclude<FlyoutId, null>) => void
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
}

type MenuContentsProps = Pick<SettingsMenuPanelProps, 'flyout' | 'onToggleFlyout' | 'onClose'>

function MenuDivider(): JSX.Element {
  return <div className="chat-settings-divider" />
}

function MenuContents({ flyout, onToggleFlyout, onClose }: MenuContentsProps): JSX.Element {
  const { user, logout } = useAuth()
  const { openSettings, closeSettings } = useSettingsModal()
  const navigate = useNavigate()

  const open = (section?: SettingsSectionId) => (): void => {
    openSettings(section)
    onClose()
  }

  const openPricing = (): void => {
    closeSettings()
    onClose()
    void navigate({ to: ROUTE_PRICING })
  }

  const handleLogout = (): void => {
    onClose()
    void logout()
  }

  return (
    <>
      <div className="truncate px-[0.6rem] pt-2 pb-1 text-xs text-muted">{user?.email ?? 'Signed in'}</div>
      <MenuDivider />
      <div className="flex flex-col gap-px">
        <SettingsMenuItem icon={GearIcon} label="Settings" onClick={open()} />
        <ThemesMenuItem open={flyout === 'themes'} onToggle={() => onToggleFlyout('themes')} />
        <SettingsMenuItem icon={ExtensionsIcon} label="Extensions" />
        <SettingsMenuItem icon={UpgradeIcon} label="Upgrade plan" onClick={openPricing} />
      </div>
      <MenuDivider />
      <div className="flex flex-col gap-px">
        <SettingsMenuItem icon={HelpCircleIcon} label="Get help" />
        <LearnMoreMenuItem open={flyout === 'learnmore'} onToggle={() => onToggleFlyout('learnmore')} />
      </div>
      <MenuDivider />
      <div className="flex flex-col gap-px">
        <SettingsMenuItem icon={LogOutIcon} label="Log out" onClick={handleLogout} />
      </div>
    </>
  )
}

function MobileSettingsSheet({ flyout, onToggleFlyout, onClose }: Omit<SettingsMenuPanelProps, 'anchorRef'>): JSX.Element {
  return createPortal(
    <div className="fixed inset-0 z-[60] md:hidden">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0" style={{ background: 'var(--color-scrim)' }} />
      <div
        role="menu"
        aria-label="Account menu"
        className="chat-settings-sheet absolute inset-x-0 bottom-0 flex max-h-[80dvh] flex-col gap-px overflow-y-auto rounded-t-card p-sm pb-[calc(env(safe-area-inset-bottom)+var(--space-sm))]"
      >
        <div className="mx-auto mb-2xs h-1 w-9 flex-none rounded-pill bg-rule" aria-hidden="true" />
        <MenuContents flyout={flyout} onToggleFlyout={onToggleFlyout} onClose={onClose} />
      </div>
    </div>,
    document.body,
  )
}

/* Portaled to <body>: the expanded sidebar sets its own backdrop-filter, which
   would otherwise neutralise this menu's frosted-glass blur and let the recents
   list behind it bleed through. Same reason the agent picker is portaled. */
function DesktopSettingsMenu({ flyout, onToggleFlyout, onClose, anchorRef }: SettingsMenuPanelProps): JSX.Element | null {
  const rect = useAnchorRect(anchorRef)
  if (!rect) return null

  return createPortal(
    <div
      role="menu"
      aria-label="Account menu"
      className="chat-settings-menu chat-menu-pop fixed z-[70] flex w-66 max-w-[calc(100vw-var(--space-md))] flex-col gap-px rounded-card p-2xs"
      style={{ bottom: Math.round(window.innerHeight - rect.top + MENU_GAP_PX), left: Math.round(rect.left) }}
    >
      <MenuContents flyout={flyout} onToggleFlyout={onToggleFlyout} onClose={onClose} />
    </div>,
    document.body,
  )
}

export function SettingsMenuPanel({ flyout, onToggleFlyout, onClose, anchorRef }: SettingsMenuPanelProps): JSX.Element | null {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileSettingsSheet flyout={flyout} onToggleFlyout={onToggleFlyout} onClose={onClose} />
  }
  return <DesktopSettingsMenu flyout={flyout} onToggleFlyout={onToggleFlyout} onClose={onClose} anchorRef={anchorRef} />
}
