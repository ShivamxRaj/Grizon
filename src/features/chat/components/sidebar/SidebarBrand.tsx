import type { JSX } from 'react'
import { Logo } from '@/components/ui/Logo'
import { CloseIcon, PanelIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'

interface SidebarBrandProps {
  expanded: boolean
  onToggle: () => void
  /** On mobile the sidebar is a drawer — the toggle closes it and shows a Close (×) glyph. */
  showClose?: boolean
  /** Desktop hover peek — toggle pins the rail open instead of collapsing. */
  peeking?: boolean
}

function brandToggleLabel(showClose: boolean, peeking: boolean, expanded: boolean): string {
  if (showClose) return 'Close sidebar'
  if (peeking) return 'Keep sidebar expanded'
  if (expanded) return 'Collapse sidebar'
  return 'Expand sidebar'
}

export function SidebarBrand({
  expanded,
  onToggle,
  showClose = false,
  peeking = false,
}: SidebarBrandProps): JSX.Element {
  const toggleLabel = brandToggleLabel(showClose, peeking, expanded)
  const ToggleIcon = showClose ? CloseIcon : PanelIcon

  return (
    <div
      onClick={onToggle}
      className={cn('group relative flex min-h-10 items-center', expanded ? 'justify-between' : 'cursor-pointer justify-center')}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex items-center gap-2 font-display text-[0.95rem] font-bold text-ink transition-opacity duration-short ease-out',
          !expanded && 'group-hover:opacity-0 group-focus-within:opacity-0',
        )}
      >
        <Logo className="h-5.5 w-5.5 flex-none" />
        {expanded && (
          <span className="flex items-center gap-1.5">
            <span>Grizon</span>
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-accent-text border border-accent-text/20">
              Legal AI
            </span>
          </span>
        )}
      </span>

      <button
        type="button"
        aria-label={toggleLabel}
        aria-expanded={expanded}
        data-tooltip={toggleLabel}
        className={cn(
          'chat-tooltip grid h-10 w-10 flex-none place-items-center rounded-sm text-ink-2 transition-colors duration-short ease-out hover:bg-[var(--sb-hover)]',
          expanded
            ? 'order-2'
            : 'pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100',
        )}
      >
        <ToggleIcon className="h-4.5 w-4.5" />
      </button>
    </div>
  )
}
