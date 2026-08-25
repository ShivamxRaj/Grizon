import { useEffect, useState } from 'react'

export function useDelayedUnmount(isOpen: boolean, delayMs: number): boolean {
  const [shouldRender, setShouldRender] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      return undefined
    }
    const timer = setTimeout(() => setShouldRender(false), delayMs)
    return () => clearTimeout(timer)
  }, [isOpen, delayMs])

  return shouldRender
}
