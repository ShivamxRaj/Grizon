import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return undefined

    function handlePointerDown(event: PointerEvent): void {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside()
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onOutside()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, onOutside, enabled])
}
