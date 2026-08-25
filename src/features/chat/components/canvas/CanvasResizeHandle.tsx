import type { JSX } from 'react'
import { cn } from '@/lib/utils/cn'

interface CanvasResizeHandleProps {
  isResizing: boolean
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
}

export function CanvasResizeHandle({ isResizing, onPointerDown }: CanvasResizeHandleProps): JSX.Element {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize canvas"
      onPointerDown={onPointerDown}
      className={cn(
        'absolute inset-y-0 left-0 z-10 hidden w-1.5 -translate-x-1/2 cursor-col-resize md:block',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent after:transition-colors after:duration-short after:ease-out hover:after:bg-accent',
        isResizing && 'after:bg-accent',
      )}
    />
  )
}
