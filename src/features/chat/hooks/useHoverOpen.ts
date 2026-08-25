import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

const HOVER_CLOSE_DELAY_MS = 160

interface HoverOpenControls {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  openPopover: () => void
  scheduleClose: () => void
}

/** Hover opens immediately; leave closes after a short delay so the cursor
 * can move from the trigger into the popover without flicker. */
export function useHoverOpen(): HoverOpenControls {
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCloseTimer = useCallback((): void => {
    if (closeTimerRef.current === null) return
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }, [])

  const openPopover = useCallback((): void => {
    clearCloseTimer()
    setOpen(true)
  }, [clearCloseTimer])

  const scheduleClose = useCallback((): void => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY_MS)
  }, [clearCloseTimer])

  useEffect(() => (): void => clearCloseTimer(), [clearCloseTimer])

  return { open, setOpen, openPopover, scheduleClose }
}
