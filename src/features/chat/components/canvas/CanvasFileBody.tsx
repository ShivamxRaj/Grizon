import type { JSX } from 'react'
import { FileLinesIcon } from '@/components/ui/icons'

/** Fallback body when only metadata is available (e.g. project mock sources). */
export function CanvasFileBody({
  name,
  typeLabel,
  footerRight,
}: {
  name: string
  typeLabel: string
  footerRight: string
}): JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-sm overflow-auto bg-paper-2 p-lg text-center">
        <div className="grid h-16 w-16 place-items-center rounded-card border border-rule bg-paper shadow-sm">
          <FileLinesIcon className="h-7 w-7 text-muted" />
        </div>
        <p className="max-w-70 truncate text-sm font-medium text-ink">{name}</p>
        <p className="text-sm text-muted">Download to open this file</p>
      </div>
      <div className="flex flex-none items-center justify-between border-t border-rule-2 px-md py-[0.5rem] font-mono text-[0.68rem] text-muted">
        <span>{typeLabel} · Preview</span>
        <span>{footerRight}</span>
      </div>
    </div>
  )
}
