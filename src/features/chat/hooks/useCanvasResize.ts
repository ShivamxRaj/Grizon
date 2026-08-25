import { useCallback, useEffect, useRef, useState } from 'react'
import { CANVAS_MAX_WIDTH, CANVAS_MIN_WIDTH } from '../context/canvasContext'

interface UseCanvasResize {
  isResizing: boolean
  onHandlePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
}

export function useCanvasResize(width: number, setWidth: (width: number) => void): UseCanvasResize {
  const [isResizing, setIsResizing] = useState(false)
  const startRef = useRef({ pointerX: 0, width })

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const delta = startRef.current.pointerX - event.clientX
      const next = Math.min(CANVAS_MAX_WIDTH, Math.max(CANVAS_MIN_WIDTH, startRef.current.width + delta))
      setWidth(next)
    },
    [setWidth],
  )

  const onPointerUp = useCallback(() => {
    setIsResizing(false)
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
  }, [onPointerMove])

  const onHandlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      startRef.current = { pointerX: event.clientX, width }
      setIsResizing(true)
      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
    },
    [width, onPointerMove, onPointerUp],
  )

  useEffect(() => {
    if (!isResizing) return
    document.body.classList.add('select-none', 'cursor-col-resize')
    return (): void => document.body.classList.remove('select-none', 'cursor-col-resize')
  }, [isResizing])

  return { isResizing, onHandlePointerDown }
}
