import type { JSX } from 'react'
import { FileLinesIcon } from '@/components/ui/icons'
import { useCanvas } from '../../hooks/useCanvas'
import type { GeneratedFile } from '../../types'

const ICON_STYLE_BY_KIND: Record<GeneratedFile['kind'], { iconVar: string; iconClass: string }> = {
  pdf: { iconVar: 'var(--color-file-pdf)', iconClass: 'text-file-pdf' },
  doc: { iconVar: 'var(--color-accent-deep)', iconClass: 'text-accent-text' },
  sheet: { iconVar: 'var(--color-success)', iconClass: 'text-success' },
}

export function FileCard({ file }: { file: GeneratedFile }): JSX.Element {
  const { openSelection } = useCanvas()
  const style = ICON_STYLE_BY_KIND[file.kind]

  function handleOpen(): void {
    openSelection({ origin: 'artifact', entry: { id: file.id, name: file.name, meta: file.meta, data: file } })
  }

  return (
    <div className="inline-flex w-fit max-w-full items-center gap-xs rounded-card border border-rule bg-paper-2 py-[0.65rem] pl-[0.7rem] pr-[0.9rem] transition-shadow duration-short ease-out hover:shadow-md">
      <div
        className="grid h-9 w-9 flex-none place-items-center rounded-sm"
        style={{ background: `color-mix(in oklch, ${style.iconVar} 14%, var(--color-paper))` }}
      >
        <FileLinesIcon className={`h-4.25 w-4.25 ${style.iconClass}`} />
      </div>
      <div className="min-w-0">
        <div className="truncate font-display text-sm font-semibold text-ink sm:max-w-50">{file.name}</div>
        <div className="font-mono text-[0.65rem] uppercase tracking-[0.05em] text-muted">{file.meta}</div>
      </div>
      <button
        type="button"
        onClick={handleOpen}
        className="flex-none rounded-pill bg-accent-soft px-[0.78rem] py-[0.32rem] font-display text-sm font-semibold text-accent-text transition-colors duration-short ease-out hover:bg-accent-deep hover:text-accent-ink"
      >
        Open
      </button>
    </div>
  )
}
