import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean,
  extraSelector?: string,
): void {
  useEffect(() => {
    if (!enabled) return

    function handlePointerDown(event: PointerEvent): void {
      const target = event.target as Node
      if (ref.current?.contains(target)) return
      if (extraSelector && target instanceof Element && target.closest(extraSelector)) return
      onOutside()
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onOutside()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return (): void => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, onOutside, enabled, extraSelector])
}
