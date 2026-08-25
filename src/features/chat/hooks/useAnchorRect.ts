import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'

/* Tracks an anchor's viewport rect so a portaled (position: fixed) menu can be
   placed against it. Portalling is what keeps such a menu out of any ancestor's
   backdrop-filter group — nesting one backdrop-filter inside another leaves the
   inner element with nothing to blur, so its frosted glass turns into plain
   translucency and the content behind bleeds through. */
export function useAnchorRect(anchorRef: RefObject<HTMLElement | null>): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const update = (): void => setRect(anchor.getBoundingClientRect())
    update()
    window.addEventListener('resize', update)
    return (): void => window.removeEventListener('resize', update)
  }, [anchorRef])

  return rect
}
