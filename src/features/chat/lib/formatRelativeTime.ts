const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS

/** Formats an ISO timestamp as a short relative label for chat lists. */
export function formatRelativeTime(iso: string, nowMs: number = Date.now()): string {
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return ''
  const delta = Math.max(0, nowMs - then)

  if (delta < MINUTE_MS) return 'Just now'
  if (delta < HOUR_MS) return `${Math.floor(delta / MINUTE_MS)}m ago`
  if (delta < DAY_MS) return `${Math.floor(delta / HOUR_MS)}h ago`
  if (delta < 2 * DAY_MS) return 'Yesterday'
  if (delta < WEEK_MS) return `${Math.floor(delta / DAY_MS)} days ago`
  return 'Last week'
}
