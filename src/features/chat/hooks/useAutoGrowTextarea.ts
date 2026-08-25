import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { MAX_TEXTAREA_ROWS } from '../components/composer/constants'

interface Metrics {
  lineHeight: number
  paddingY: number
}

function readMetrics(el: HTMLTextAreaElement): Metrics {
  const style = getComputedStyle(el)
  const parsed = Number.parseFloat(style.lineHeight)
  const lineHeight = Number.isNaN(parsed) ? Number.parseFloat(style.fontSize) * 1.5 : parsed
  return { lineHeight, paddingY: Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom) }
}

/** Grows the textarea with its content up to MAX_TEXTAREA_ROWS lines, then
 * caps and scrolls. Also reports `multiline` (content spans 2+ rows) so the
 * composer can switch between its compact pill and expanded card layouts.
 * All sizing derives from the element's own measured line-height. */
export function useAutoGrowTextarea(value: string): {
  ref: RefObject<HTMLTextAreaElement | null>
  multiline: boolean
} {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [multiline, setMultiline] = useState(false)

  const resize = useCallback((): void => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    const { lineHeight, paddingY } = readMetrics(el)
    const rows = Math.round((el.scrollHeight - paddingY) / lineHeight)
    const maxHeight = lineHeight * MAX_TEXTAREA_ROWS + paddingY
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
    setMultiline(rows > 1)
  }, [])

  useLayoutEffect(resize, [value, resize])

  return { ref, multiline }
}
