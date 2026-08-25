import { useEffect, useState, type Dispatch, type JSX, type SetStateAction } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils/cn'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSidebarDrawer } from '../hooks/useSidebarDrawer'
import { useSidebarPeek } from '../hooks/useSidebarPeek'
import { SidebarBrand } from './sidebar/SidebarBrand'
import { SidebarNav } from './sidebar/SidebarNav'
import { SidebarRecents } from './sidebar/SidebarRecents'
import { SidebarSettings } from './sidebar/SidebarSettings'
import { SidebarAccount } from './sidebar/SidebarAccount'

/* Below md the sidebar is an off-canvas drawer (fixed, slides in over a backdrop);
   at md+ it is the in-flow icon-rail — pinned expand pushes layout; hover peek overlays. */
const DRAWER_BASE =
  'fixed inset-y-0 left-0 z-40 w-[min(82vw,17rem)] flex-none overflow-y-auto p-2xs shadow-glass backdrop-blur-[10px] transition-transform duration-mid ease-in-out md:overflow-visible md:relative md:inset-auto md:z-10 md:translate-x-0 md:transition-all'
const RAIL_COLLAPSED = 'md:m-0 md:w-16 md:p-3xs md:rounded-none md:shadow-none md:backdrop-blur-none'
const RAIL_EXPANDED = 'md:m-sm md:w-60 md:rounded-card md:p-2xs md:shadow-glass md:backdrop-blur-[10px]'
const PEEK_OVERLAY = 'md:absolute md:inset-y-0 md:left-0 md:z-30'

function sidebarClass(open: boolean, expanded: boolean, peeking: boolean): string {
  const showExpanded = expanded || peeking
  return cn(
    'chat-sidebar flex flex-col border border-transparent',
    DRAWER_BASE,
    open ? 'translate-x-0' : '-translate-x-full',
    showExpanded ? RAIL_EXPANDED : RAIL_COLLAPSED,
    peeking && PEEK_OVERLAY,
  )
}

export function ChatSidebar(): JSX.Element {
  const state = useSidebarRailState()
  return (
    <>
      <SidebarBackdrop open={state.open} onClose={() => state.setOpen(false)} />
      <SidebarRail {...state} />
    </>
  )
}

interface SidebarRailState {
  open: boolean
  expanded: boolean
  peeking: boolean
  labeled: boolean
  setOpen: (open: boolean) => void
  setExpanded: Dispatch<SetStateAction<boolean>>
  closePeek: () => void
  sidebarRef: ReturnType<typeof useSidebarPeek>['sidebarRef']
  onPointerEnter: () => void
  onPointerLeave: ReturnType<typeof useSidebarPeek>['onPointerLeave']
}

function useSidebarRailState(): SidebarRailState {
  const [expanded, setExpanded] = useState(false)
  const { open, setOpen } = useSidebarDrawer()
  const isMobile = useIsMobile()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const peek = useSidebarPeek({ enabled: !expanded && !open && !isMobile })

  useSidebarDismissEffects({ pathname, open, setOpen, closePeek: peek.closePeek })

  return {
    open,
    expanded,
    peeking: peek.peeking,
    labeled: open || expanded || peek.peeking,
    setOpen,
    setExpanded,
    closePeek: peek.closePeek,
    sidebarRef: peek.sidebarRef,
    onPointerEnter: peek.onPointerEnter,
    onPointerLeave: peek.onPointerLeave,
  }
}

function useSidebarDismissEffects(args: {
  pathname: string
  open: boolean
  setOpen: (open: boolean) => void
  closePeek: () => void
}): void {
  const { pathname, open, setOpen, closePeek } = args
  useEffect(() => setOpen(false), [pathname, setOpen])
  useEffect(() => closePeek(), [pathname, closePeek])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])
}

function SidebarRail(state: SidebarRailState): JSX.Element {
  const { open, expanded, peeking, labeled, sidebarRef, onPointerEnter, onPointerLeave } = state
  return (
    <div
      className={cn(
        expanded
          ? 'md:contents'
          : 'relative flex flex-none flex-col self-stretch md:w-16',
      )}
    >
      <aside
        ref={sidebarRef}
        data-expanded={expanded}
        data-peeking={peeking || undefined}
        aria-label="Primary"
        className={cn(sidebarClass(open, expanded, peeking), !expanded && 'h-full')}
        style={labeled ? { background: 'var(--glass-sheen)', borderColor: 'var(--glass-stroke)' } : undefined}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <SidebarRailBody state={state} />
      </aside>
    </div>
  )
}

function SidebarRailBody({ state }: { state: SidebarRailState }): JSX.Element {
  const { open, peeking, labeled, setOpen, closePeek, setExpanded } = state
  return (
    <>
      <div className={cn('mb-3xs', labeled ? '' : 'pt-1')}>
        <SidebarBrand
          expanded={labeled}
          peeking={peeking}
          showClose={open}
          onToggle={() => handleBrandToggle({ open, peeking, setOpen, closePeek, setExpanded })}
        />
      </div>
      <SidebarNav expanded={labeled} />
      <SidebarRecents expanded={labeled} />
      <SidebarRailFooter labeled={labeled} />
    </>
  )
}

function SidebarRailFooter({ labeled }: { labeled: boolean }): JSX.Element {
  return (
    <div className={cn('mt-auto flex flex-col gap-[0.15rem] pt-xs', labeled ? 'items-stretch' : 'items-center')}>
      <SidebarSettings expanded={labeled} />
      <div className={cn('my-[0.2rem] h-px bg-rule', labeled ? 'mx-2xs' : 'mx-auto w-7')} />
      <SidebarAccount expanded={labeled} />
    </div>
  )
}

interface BrandToggleArgs {
  open: boolean
  peeking: boolean
  setOpen: (open: boolean) => void
  closePeek: () => void
  setExpanded: Dispatch<SetStateAction<boolean>>
}

function handleBrandToggle({ open, peeking, setOpen, closePeek, setExpanded }: BrandToggleArgs): void {
  if (open) {
    setOpen(false)
    return
  }
  if (peeking) {
    closePeek()
    setExpanded(true)
    return
  }
  setExpanded((v) => !v)
}

function SidebarBackdrop({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element | null {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      aria-hidden="true"
      className="fixed inset-0 z-30 backdrop-blur-[2px] md:hidden"
      style={{ background: 'var(--color-scrim)' }}
    />
  )
}
