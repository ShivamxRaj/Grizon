import type { JSX } from 'react'
import { FolderIcon } from '@/components/ui/icons'
import { useCanvas } from '../../hooks/useCanvas'
import { CanvasEntryPreview } from './CanvasEntryPreview'

export function CanvasViewerTab(): JSX.Element {
  const { selection, setTab } = useCanvas()

  if (!selection) return <CanvasViewerEmptyState onBrowse={() => setTab('files')} />

  return <CanvasEntryPreview selection={selection} />
}

function CanvasViewerEmptyState({ onBrowse }: { onBrowse: () => void }): JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-sm px-lg text-center">
      <FolderIcon className="h-9 w-9 text-muted" />
      <p className="text-sm text-muted">Select a file from the Files tab</p>
      <button
        type="button"
        onClick={onBrowse}
        className="rounded-sm border border-rule px-sm py-[0.4rem] text-sm font-medium text-ink-2 transition-colors duration-short ease-out hover:bg-paper-3 hover:text-ink"
      >
        Browse files
      </button>
    </div>
  )
}
