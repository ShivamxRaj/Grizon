import { useLayoutEffect, useRef, useState, type JSX, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useIsMobile } from '../../hooks/useIsMobile'

const FLYOUT_GAP_PX = 8

interface SettingsFlyoutProps {
  label: string
  anchorRef: RefObject<HTMLElement | null>
  children: ReactNode
}

interface FlyoutCoords {
  top: number
  left: number
}

function readCoords(anchor: HTMLElement): FlyoutCoords {
  const rect = anchor.getBoundingClientRect()
  const menu = anchor.closest('[role="menu"]')
  const menuRight = menu?.getBoundingClientRect().right ?? rect.right
  return { top: Math.round(rect.top), left: Math.round(menuRight + FLYOUT_GAP_PX) }
}

export function SettingsFlyout({ label, anchorRef, children }: SettingsFlyoutProps): JSX.Element | null {
  const isMobile = useIsMobile()
  const [coords, setCoords] = useState<FlyoutCoords | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor || isMobile) return

    const update = (): void => setCoords(readCoords(anchor))
    update()
    window.addEventListener('resize', update)
    return (): void => window.removeEventListener('resize', update)
  }, [anchorRef, isMobile])

  // Mobile: render inline inside the bottom sheet (portaled fixed panels would land off-screen).
  if (isMobile) {
    return (
      <div role="menu" aria-label={label} className="chat-settings-flyout mt-px ml-6 flex flex-col gap-px rounded-card p-2xs">
        {children}
      </div>
    )
  }

  if (!coords) return null

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      aria-label={label}
      className="chat-settings-flyout chat-menu-pop fixed z-[70] flex min-w-50 max-w-65 flex-col gap-px rounded-card p-2xs"
      style={{ top: coords.top, left: coords.left }}
    >
      {children}
    </div>,
    document.body,
  )
}
