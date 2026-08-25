import type { JSX } from 'react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { cn } from '@/lib/utils/cn'
import { SIDEBAR_NAV_ITEMS, type SidebarNavItem } from '../../data/sidebarNav'

interface SidebarNavProps {
  expanded: boolean
}

export function SidebarNav({ expanded }: SidebarNavProps): JSX.Element {
  const matchRoute = useMatchRoute()

  return (
    <nav className={cn('mt-xs flex flex-col gap-[0.15rem]', expanded ? 'items-stretch' : 'items-center')}>
      {SIDEBAR_NAV_ITEMS.map((item) => (
        <SidebarNavButton
          key={item.id}
          item={item}
          expanded={expanded}
          active={Boolean(matchRoute({ to: item.to, fuzzy: item.to !== '/chat' }))}
        />
      ))}
    </nav>
  )
}

interface SidebarNavButtonProps {
  item: SidebarNavItem
  expanded: boolean
  active: boolean
}

function SidebarNavButton({ item, expanded, active }: SidebarNavButtonProps): JSX.Element {
  const isNewChat = item.id === 'new-chat'

  const className = cn(
    'chat-tooltip relative flex items-center gap-xs rounded-card text-sm font-medium transition-all duration-short ease-out',
    expanded ? 'w-full justify-start px-3 py-2.5' : 'h-10 w-10 justify-center rounded-sm',
    isNewChat
      ? 'bg-gradient-to-r from-accent-deep/40 via-accent/30 to-accent-deep/40 text-ink border border-accent/40 shadow-md shadow-accent/20 hover:border-accent-text/60 hover:shadow-accent/40 hover:-translate-y-0.5 font-semibold'
      : 'text-muted hover:bg-[var(--sb-hover)] hover:text-ink focus-visible:bg-[var(--sb-hover)] focus-visible:text-ink',
    active && !isNewChat && 'border-l-2 border-accent-text bg-accent-soft/40 font-semibold text-accent-text hover:bg-accent-soft/60',
  )

  return (
    <Link to={item.to} aria-current={active ? 'page' : undefined} data-tooltip={expanded ? undefined : item.label} className={className}>
      <item.icon className={cn('h-4.5 w-4.5 flex-none', isNewChat ? 'text-accent-text' : active && 'text-accent-text')} />
      {expanded && <span>{item.label}</span>}
    </Link>
  )
}
