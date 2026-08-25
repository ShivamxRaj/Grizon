import type { JSX } from 'react'
import { FolderIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'

interface ProjectChipProps {
  name: string
  className?: string
}

export function ProjectChip({ name, className }: ProjectChipProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-pill bg-accent-soft px-2xs py-3xs text-[0.68rem] font-medium text-accent-text',
        className,
      )}
    >
      <FolderIcon className="h-3 w-3 flex-none" />
      <span className="truncate">{name}</span>
    </span>
  )
}
