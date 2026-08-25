import type { CSSProperties, JSX } from 'react'
import { useCanvas } from '../../hooks/useCanvas'
import { useCanvasResize } from '../../hooks/useCanvasResize'
import { CanvasFilesTab } from './CanvasFilesTab'
import { CanvasHeader } from './CanvasHeader'
import { CanvasResizeHandle } from './CanvasResizeHandle'
import { CanvasViewerTab } from './CanvasViewerTab'

export function CanvasPanel(): JSX.Element {
  const { tab, width, setWidth } = useCanvas()
  const { isResizing, onHandlePointerDown } = useCanvasResize(width, setWidth)

  return (
    <aside
      aria-label="Canvas"
      className="chat-canvas-panel fixed inset-0 z-20 flex flex-none flex-col border-rule bg-paper md:relative md:z-auto md:border-l"
      style={{ '--canvas-width': `${width}px` } as CSSProperties}
    >
      <CanvasResizeHandle isResizing={isResizing} onPointerDown={onHandlePointerDown} />
      <CanvasHeader />
      {tab === 'viewer' ? <CanvasViewerTab /> : <CanvasFilesTab />}
    </aside>
  )
}
