import { useEffect, type RefObject } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null)
}

function wrapTab(container: HTMLElement, event: KeyboardEvent): void {
  const items = focusableWithin(container)
  if (items.length === 0) return

  const first = items[0]
  const last = items[items.length - 1]
  const target = event.target as HTMLElement

  if (event.shiftKey && (target === first || !container.contains(target))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && target === last) {
    event.preventDefault()
    first.focus()
  }
}

/**
 * Keeps Tab cycling inside `ref` while `enabled`, and returns focus to whatever
 * was focused when the trap engaged (the settings gear, in practice).
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const container = ref.current
    if (!enabled || !container) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    focusableWithin(container)[0]?.focus()

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Tab') wrapTab(container, event)
    }
    document.addEventListener('keydown', onKeyDown)

    return (): void => {
      document.removeEventListener('keydown', onKeyDown)
      // The trigger may have unmounted while the dialog was open (a menu item, say).
      // Focusing a detached node silently drops focus to <body>, so check first.
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [ref, enabled])
}
