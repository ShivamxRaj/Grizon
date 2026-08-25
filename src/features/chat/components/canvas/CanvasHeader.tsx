import type { JSX } from 'react'
import { FileTextIcon, FolderIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'
import { useCanvas } from '../../hooks/useCanvas'
import type { CanvasTab } from '../../types'

export function CanvasHeader(): JSX.Element {
  const { tab, setTab, close, uploadedFiles, artifacts } = useCanvas()
  const filesCount = uploadedFiles.length + artifacts.length

  return (
    <div className="flex flex-none items-center justify-between gap-xs border-b border-rule-2 px-sm py-[0.65rem] sm:gap-sm sm:px-md">
      <div className="flex items-center gap-[0.2rem]">
        <CanvasTabButton id="viewer" active={tab === 'viewer'} onClick={() => setTab('viewer')} icon={FileTextIcon} label="Viewer" />
        <CanvasTabButton id="files" active={tab === 'files'} onClick={() => setTab('files')} icon={FolderIcon} label="Files" count={filesCount} />
      </div>
      <button
        type="button"
        onClick={close}
        className="flex-none rounded-sm border border-rule px-sm py-[0.4rem] text-sm font-medium text-ink-2 transition-colors duration-short ease-out hover:bg-paper-3 hover:text-ink"
      >
        <span className="sm:hidden">Close</span>
        <span className="hidden sm:inline">Close Canvas</span>
      </button>
    </div>
  )
}

interface CanvasTabButtonProps {
  id: CanvasTab
  active: boolean
  onClick: () => void
  icon: (props: { className?: string }) => JSX.Element
  label: string
  count?: number
}

function CanvasTabButton({ active, onClick, icon: Icon, label, count }: CanvasTabButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-[0.4rem] rounded-sm px-sm py-[0.4rem] text-sm font-medium transition-colors duration-short ease-out',
        active ? 'bg-accent-soft text-accent-text' : 'text-muted hover:bg-paper-3 hover:text-ink',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {count !== undefined && (
        <span className="rounded-pill bg-paper-3 px-[0.4rem] py-px font-mono text-[0.65rem] text-muted">{count}</span>
      )}
    </button>
  )
}
