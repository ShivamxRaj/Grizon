import type { JSX } from 'react'
import { Logo } from '@/components/ui/Logo'
import type { StreamState } from '../../lib/streamReducer'
import { StreamTimeline } from './StreamTimeline'

export function StreamingAssistantTurn({ state }: { state: StreamState }): JSX.Element {
  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-center gap-2xs font-display text-sm font-bold text-accent-text">
        <Logo className="h-4 w-4" />
        Grizon
      </div>

      {state.blocks.length > 0 ? (
        <StreamTimeline blocks={state.blocks} />
      ) : (
        <p className="text-sm text-muted">Starting…</p>
      )}

      {state.error && (
        <p className="rounded-card border border-danger/30 bg-danger-soft px-sm py-xs text-sm text-danger-ink">
          {state.error.message}
        </p>
      )}
    </div>
  )
}
