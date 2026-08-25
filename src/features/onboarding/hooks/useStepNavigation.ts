import { useCallback, useState } from 'react'

export interface StepNavigation {
  index: number
  isFirst: boolean
  isLast: boolean
  next: () => void
  back: () => void
  goTo: (target: number) => void
}

/** Advancing past the final step is completion — the caller decides what that means. */
export function useStepNavigation(total: number, onComplete: () => void): StepNavigation {
  const [index, setIndex] = useState(0)
  const lastIndex = total - 1

  // Completion runs outside the updater: React may invoke updaters twice in
  // StrictMode, and a side effect in one would fire the callback twice.
  const next = useCallback((): void => {
    if (index >= lastIndex) {
      onComplete()
      return
    }
    setIndex(index + 1)
  }, [index, lastIndex, onComplete])

  const back = useCallback((): void => setIndex((current) => Math.max(0, current - 1)), [])
  const goTo = useCallback((target: number): void => setIndex(Math.min(Math.max(0, target), lastIndex)), [lastIndex])

  return { index, isFirst: index === 0, isLast: index === lastIndex, next, back, goTo }
}
