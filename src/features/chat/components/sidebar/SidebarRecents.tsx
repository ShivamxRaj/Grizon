import type { JSX } from 'react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { cn } from '@/lib/utils/cn'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useRecentChats } from '../../hooks/useRecentChats'
import type { RecentChat } from '../../lib/recentChats'

interface SidebarRecentsProps {
  expanded: boolean
}

export function SidebarRecents({ expanded }: SidebarRecentsProps): JSX.Element {
  const matchRoute = useMatchRoute()
  const { chats, isLoading, isError, error } = useRecentChats()

  return (
    <div
      aria-label="Recent chats"
      className={cn(
        'mt-sm flex min-h-0 flex-1 flex-col gap-[0.15rem] overflow-y-auto transition-all duration-short ease-out',
        expanded ? 'visible translate-x-0 opacity-100' : 'invisible pointer-events-none -translate-x-2.5 opacity-0',
      )}
    >
      <div className="px-2xs pb-3xs pt-3xs text-xs font-semibold uppercase tracking-[0.04em] text-muted" aria-hidden="true">
        Recent
      </div>
      {isLoading && <p className="px-2xs py-xs text-xs text-muted">Loading…</p>}
      {isError && (
        <p className="px-2xs py-xs text-xs text-danger-ink">
          {getApiErrorMessage(error, 'Could not load chats')}
        </p>
      )}
      {!isLoading && !isError && chats.length === 0 && (
        <p className="px-2xs py-xs text-xs text-muted">No chats yet</p>
      )}
      {chats.map((chat) => (
        <RecentChatLink
          key={chat.id}
          chat={chat}
          active={Boolean(matchRoute({ to: '/chat/$chatId', params: { chatId: chat.id } }))}
        />
      ))}
    </div>
  )
}

function RecentChatLink({ chat, active }: { chat: RecentChat; active: boolean }): JSX.Element {
  return (
    <Link
      to="/chat/$chatId"
      params={{ chatId: chat.id }}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex shrink-0 items-center rounded-sm px-2.5 py-1.5 text-left text-sm font-medium transition-all duration-short ease-out hover:bg-paper-3 hover:text-ink',
        active
          ? 'border-l-2 border-accent-text bg-accent-soft/30 font-semibold text-accent-text'
          : 'text-ink-2 hover:text-ink',
      )}
    >
      <span className="block min-w-0 flex-1 truncate group-hover:translate-x-0.5 transition-transform">{chat.title}</span>
    </Link>
  )
}
