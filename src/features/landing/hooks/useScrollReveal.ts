import { useEffect, useRef, useState } from 'react'

const VISIBILITY_THRESHOLD = 0.15

export function useScrollReveal<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || !('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: VISIBILITY_THRESHOLD },
    )
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  return [ref, isVisible]
}
