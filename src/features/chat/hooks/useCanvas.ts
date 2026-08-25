import { useContext } from 'react'
import { CanvasContext, type CanvasContextValue } from '../context/canvasContext'

export function useCanvas(): CanvasContextValue {
  const context = useContext(CanvasContext)
  if (!context) throw new Error('useCanvas must be used within a CanvasProvider')
  return context
}
