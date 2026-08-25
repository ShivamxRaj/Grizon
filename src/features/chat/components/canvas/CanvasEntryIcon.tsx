import type { JSX } from 'react'
import { CodeIcon, FileLinesIcon, LayersIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'
import type { CanvasArtifactEntry } from '../../types'

const FILE_ICON_COLOR: Record<'pdf' | 'doc' | 'sheet', string> = {
  pdf: 'text-file-pdf',
  doc: 'text-accent-text',
  sheet: 'text-success',
}

export function CanvasEntryIcon({ entry, className }: { entry: CanvasArtifactEntry; className?: string }): JSX.Element {
  if (entry.data.kind === 'code' || entry.data.kind === 'markdown') {
    const Icon = entry.data.kind === 'code' ? CodeIcon : LayersIcon
    return <Icon className={cn('text-accent-text', className)} />
  }

  return <FileLinesIcon className={cn(FILE_ICON_COLOR[entry.data.kind], className)} />
}
