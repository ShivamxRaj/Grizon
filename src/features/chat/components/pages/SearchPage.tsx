import { useMemo, useState, type JSX, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { SearchIcon } from '@/components/ui/icons'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useRecentChats } from '../../hooks/useRecentChats'
import { filterChatsByQuery, type RecentChat } from '../../lib/recentChats'
import { ProjectChip } from '../sidebar/ProjectChip'
import { WorkspacePage } from './WorkspacePage'

export function SearchPage(): JSX.Element {
  const [query, setQuery] = useState('')
  const { chats, isLoading, isError, error } = useRecentChats()
  const results = useMemo(() => filterChatsByQuery(chats, query), [chats, query])

  return (
    <WorkspacePage title="Search" subtitle="Find any conversation across your workspace.">
      <SearchField query={query} onChange={setQuery} />
      <div className="flex min-h-0 flex-1 flex-col pt-md">
        <SearchResults
          query={query}
          results={results}
          isLoading={isLoading}
          isError={isError}
          error={error}
          totalCount={chats.length}
        />
      </div>
    </WorkspacePage>
  )
}

function SearchField({ query, onChange }: { query: string; onChange: (value: string) => void }): JSX.Element {
  return (
    <div className="flex flex-none items-center gap-xs rounded-input border border-rule bg-paper-2 px-md py-sm transition-colors duration-short ease-out focus-within:border-accent">
      <SearchIcon className="h-5 w-5 flex-none text-muted" />
      <input
        autoFocus
        type="text"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Search chats"
        className="min-w-0 flex-1 bg-transparent text-md text-ink outline-none"
      />
    </div>
  )
}

interface SearchResultsProps {
  query: string
  results: RecentChat[]
  isLoading: boolean
  isError: boolean
  error: unknown
  totalCount: number
}

function SearchResults({
  query,
  results,
  isLoading,
  isError,
  error,
  totalCount,
}: SearchResultsProps): JSX.Element {
  if (isLoading) return <StatusMessage>Loading chats…</StatusMessage>
  if (isError) {
    return (
      <StatusMessage tone="danger">{getApiErrorMessage(error, 'Could not load chats')}</StatusMessage>
    )
  }
  if (totalCount === 0) return <StatusMessage>No chats yet</StatusMessage>
  if (results.length === 0) {
    return <StatusMessage>No chats match “{query.trim()}”</StatusMessage>
  }

  const heading = query.trim() ? 'Results' : 'Recent'

  return (
    <section className="flex flex-col gap-3xs">
      <p className="px-2xs pb-3xs text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-muted">
        {heading}
      </p>
      {results.map((chat) => (
        <SearchResultRow key={chat.id} chat={chat} />
      ))}
    </section>
  )
}

function StatusMessage({
  children,
  tone = 'muted',
}: {
  children: ReactNode
  tone?: 'muted' | 'danger'
}): JSX.Element {
  return (
    <div className="flex flex-1 items-center justify-center py-2xl">
      <p className={`text-center text-sm ${tone === 'danger' ? 'text-danger-ink' : 'text-muted'}`}>
        {children}
      </p>
    </div>
  )
}

function SearchResultRow({ chat }: { chat: RecentChat }): JSX.Element {
  return (
    <Link
      to="/chat/$chatId"
      params={{ chatId: chat.id }}
      className="flex items-center gap-sm rounded-sm px-2xs py-xs text-left transition-colors duration-short ease-out hover:bg-paper-2 focus-visible:bg-paper-2 focus-visible:outline-none"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink">{chat.title}</span>
        {chat.project ? <ProjectChip name={chat.project} className="mt-3xs" /> : null}
      </span>
      <span className="flex-none tabular-nums text-xs text-muted">{chat.timestamp}</span>
    </Link>
  )
}
