import type { JSX } from 'react'
import { FileTextIcon } from '@/components/ui/icons'
import { useCanvas } from '../../hooks/useCanvas'
import type { Attachment } from '../../types'

export function AttachmentChip({ attachment }: { attachment: Attachment }): JSX.Element {
  const { openSelection } = useCanvas()
  const ready = !attachment.processingStatus || attachment.processingStatus === 'ready'

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => {
        if (!ready) return
        openSelection({ origin: 'uploaded', attachment })
      }}
      className="inline-flex items-center gap-[0.45rem] rounded-sm border border-rule bg-paper-2 py-[0.3rem] pl-[0.45rem] pr-[0.65rem] text-xs transition-colors duration-short ease-out hover:bg-paper-3 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FileTextIcon className="h-3.5 w-3.5 flex-none text-muted" />
      <span className="font-medium text-ink">{attachment.name}</span>
      <span className="font-mono text-[0.65rem] text-muted">{attachment.size}</span>
    </button>
  )
}
