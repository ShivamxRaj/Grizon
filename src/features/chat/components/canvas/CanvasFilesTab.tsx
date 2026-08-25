import type { JSX, ReactNode } from 'react'
import { FileTextIcon } from '@/components/ui/icons'
import { useCanvas } from '../../hooks/useCanvas'
import type { Attachment, CanvasArtifactEntry } from '../../types'
import { CanvasEntryIcon } from './CanvasEntryIcon'

export function CanvasFilesTab(): JSX.Element {
  const { uploadedFiles, artifacts, listLoading, listError, activeConversationId } = useCanvas()

  if (!activeConversationId) {
    return <CanvasEmptyState message="Open a chat to see its files and artifacts." />
  }

  if (listLoading) {
    return <CanvasEmptyState message="Loading files…" />
  }

  if (listError) {
    return <CanvasEmptyState message={listError} />
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-md">
      <CanvasFileSection title="Uploaded files" emptyLabel="No uploaded files yet" count={uploadedFiles.length}>
        {uploadedFiles.map((attachment) => (
          <UploadedFileRow key={attachment.id} attachment={attachment} />
        ))}
      </CanvasFileSection>

      <CanvasFileSection title="Artifacts" emptyLabel="No generated artifacts yet" count={artifacts.length}>
        {artifacts.map((entry) => (
          <ArtifactRow key={entry.id} entry={entry} />
        ))}
      </CanvasFileSection>
    </div>
  )
}

function CanvasEmptyState({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-md">
      <p className="text-center text-sm text-muted">{message}</p>
    </div>
  )
}

interface CanvasFileSectionProps {
  title: string
  emptyLabel: string
  count: number
  children: ReactNode
}

function CanvasFileSection({ title, emptyLabel, count, children }: CanvasFileSectionProps): JSX.Element {
  return (
    <div className="mb-md last:mb-0">
      <div className="mb-xs font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">{title}</div>
      {count > 0 ? <div className="flex flex-col gap-px">{children}</div> : <p className="text-sm text-muted">{emptyLabel}</p>}
    </div>
  )
}

function UploadedFileRow({ attachment }: { attachment: Attachment }): JSX.Element {
  const { openSelection } = useCanvas()
  const ready = !attachment.processingStatus || attachment.processingStatus === 'ready'
  const statusLabel = attachment.processingStatus === 'ready' ? attachment.size : attachment.processingStatus ?? attachment.size

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => {
        if (!ready) return
        openSelection({ origin: 'uploaded', attachment })
      }}
      className="flex items-center gap-xs rounded-sm px-[0.5rem] py-[0.5rem] text-left transition-colors duration-short ease-out hover:bg-paper-3 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FileTextIcon className="h-4 w-4 flex-none text-muted" />
      <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{attachment.name}</span>
      <span className="flex-none font-mono text-[0.65rem] text-muted">{statusLabel}</span>
    </button>
  )
}

function ArtifactRow({ entry }: { entry: CanvasArtifactEntry }): JSX.Element {
  const { openSelection } = useCanvas()

  return (
    <button
      type="button"
      onClick={() => openSelection({ origin: 'artifact', entry })}
      className="flex items-center gap-xs rounded-sm px-[0.5rem] py-[0.5rem] text-left transition-colors duration-short ease-out hover:bg-paper-3"
    >
      <CanvasEntryIcon entry={entry} className="h-4 w-4 flex-none" />
      <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{entry.name}</span>
      <span className="flex-none font-mono text-[0.65rem] text-muted">{entry.meta}</span>
    </button>
  )
}
