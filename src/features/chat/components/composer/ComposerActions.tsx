import type { JSX } from 'react'
import { cn } from '@/lib/utils/cn'
import { AgentPicker } from '../AgentPicker'
import { MicButton } from '../MicButton'
import { ComposerUsageRing } from './ComposerUsageRing'
import { SendButton } from './SendButton'

interface ComposerActionsProps {
  showSend: boolean
  canSubmit: boolean
  selectedAgentSlug: string | null
  onAgentSelect: (slug: string | null) => void
  onTranscript?: (text: string) => void
}

/** Trailing controls: agent picker + usage ring + the mic ↔ send toggle.
 * Shared by both the compact and expanded composer layouts. */
export function ComposerActions({
  showSend,
  canSubmit,
  selectedAgentSlug,
  onAgentSelect,
  onTranscript,
}: ComposerActionsProps): JSX.Element {
  const isLegalMode = selectedAgentSlug === 'legal-counsel'

  return (
    <div className="composer-actions flex items-center gap-2xs self-center">
      <button
        type="button"
        onClick={() => onAgentSelect(isLegalMode ? null : 'legal-counsel')}
        className={cn(
          'flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium transition-all duration-short ease-out',
          isLegalMode
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            : 'text-muted hover:bg-paper-3 hover:text-ink',
        )}
        title="Toggle IPC ➔ BNS Legal Transition Mode"
      >
        <span className="text-xs">⚖️</span>
        <span className="max-[520px]:hidden font-semibold">IPC ➔ BNS</span>
      </button>
      <AgentPicker selectedAgentSlug={selectedAgentSlug} onSelect={onAgentSelect} />
      <ComposerUsageRing />
      {showSend ? <SendButton disabled={!canSubmit} /> : <MicButton onTranscript={onTranscript} />}
    </div>
  )
}
