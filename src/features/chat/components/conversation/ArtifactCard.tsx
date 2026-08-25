import type { JSX } from 'react'
import { ChevronRightIcon, CodeIcon, LayersIcon } from '@/components/ui/icons'
import { useCanvas } from '../../hooks/useCanvas'
import { formatFileSize } from '../../lib/formatFileSize'
import type { Artifact } from '../../types'

export function ArtifactCard({ artifact }: { artifact: Artifact }): JSX.Element {
  const { selection, openSelection } = useCanvas()
  const KindIcon = artifact.kind === 'code' ? CodeIcon : LayersIcon
  const active = selection?.origin === 'artifact' && selection.entry.id === artifact.id
  const sizeLabel =
    artifact.fileSize != null && artifact.fileSize > 0 ? formatFileSize(artifact.fileSize) : null
  const subtitle = sizeLabel ?? artifact.description

  function handleOpen(): void {
    openSelection({
      origin: 'artifact',
      entry: {
        id: artifact.id,
        name: artifact.title,
        meta: sizeLabel ?? artifact.description,
        data: artifact,
      },
    })
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      aria-pressed={active}
      className={`flex w-full max-w-100 items-center gap-xs rounded-card border py-[0.65rem] pl-[0.7rem] pr-[0.85rem] text-left transition-colors duration-short ease-out ${
        active ? 'border-accent bg-accent-soft' : 'border-rule bg-paper-2 hover:bg-paper-3'
      }`}
    >
      <div className="grid h-9 w-9 flex-none place-items-center rounded-sm bg-paper text-accent-text">
        <KindIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm font-semibold text-ink">{artifact.title}</div>
        <div className="truncate text-xs text-muted">{subtitle}</div>
      </div>
      <ChevronRightIcon className="h-4 w-4 flex-none text-muted" />
    </button>
  )
}
