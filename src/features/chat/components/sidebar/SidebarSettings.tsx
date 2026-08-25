import { useRef, useState, type JSX } from 'react'
import { cn } from '@/lib/utils/cn'
import { GearIcon } from '@/components/ui/icons'
import { useClickOutside } from '../../hooks/useClickOutside'
import { SettingsMenuPanel } from './SettingsMenuPanel'

type FlyoutId = 'themes' | 'learnmore' | null

interface SidebarSettingsProps {
  expanded: boolean
}

export function SidebarSettings({ expanded }: SidebarSettingsProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [flyout, setFlyout] = useState<FlyoutId>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = (): void => {
    setOpen(false)
    setFlyout(null)
    // Menu items unmount with the menu, so hand focus back to the trigger —
    // otherwise keyboard users are dropped at the top of the document.
    buttonRef.current?.focus()
  }
  useClickOutside(containerRef, close, open, '.chat-settings-menu, .chat-settings-flyout, .chat-settings-sheet')

  const toggleMenu = (): void => {
    setOpen((wasOpen) => !wasOpen)
    setFlyout(null)
  }

  const toggleFlyout = (id: Exclude<FlyoutId, null>): void => {
    setFlyout((current) => (current === id ? null : id))
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={open}
        data-tooltip={expanded ? undefined : 'Settings'}
        className={cn(
          'chat-tooltip relative flex items-center gap-xs rounded-sm text-sm font-medium text-muted transition-colors duration-short ease-out hover:bg-[var(--sb-hover)] hover:text-ink',
          expanded ? 'w-full justify-start p-2' : 'h-10 w-10 justify-center',
        )}
      >
        <GearIcon className="h-4.5 w-4.5 flex-none" />
        {expanded && <span>Settings</span>}
      </button>
      {open && <SettingsMenuPanel flyout={flyout} onToggleFlyout={toggleFlyout} onClose={close} anchorRef={buttonRef} />}
    </div>
  )
}
