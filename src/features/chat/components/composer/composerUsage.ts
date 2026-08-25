import type { RateLimitWindow, RateLimitWindowKey, UsageRateLimit } from '@/features/billing/types'

export type UsageTone = 'success' | 'warning' | 'danger'

export const USAGE_NEAR_LIMIT_PERCENT = 80
const MS_PER_MINUTE = 60_000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

export const COMPOSER_WINDOW_ORDER: RateLimitWindowKey[] = [
  'hourly',
  'daily',
  'weekly',
  'monthly',
]

export const COMPOSER_WINDOW_LABELS: Record<RateLimitWindowKey, string> = {
  hourly: 'Hourly limit',
  daily: 'Daily limit',
  weekly: 'Weekly limit',
  monthly: 'Monthly limit',
}

export function usageTone(percent: number): UsageTone {
  if (percent >= 100) return 'danger'
  if (percent >= USAGE_NEAR_LIMIT_PERCENT) return 'warning'
  return 'success'
}

export function toneFillClass(tone: UsageTone): string {
  if (tone === 'danger') return 'bg-danger'
  if (tone === 'warning') return 'bg-warning'
  return 'bg-success'
}

export function toneStrokeVar(tone: UsageTone): string {
  if (tone === 'danger') return 'var(--color-danger)'
  if (tone === 'warning') return 'var(--color-warning)'
  return 'var(--color-success)'
}

/** Mean of limited windows only; unlimited (`usagePercent: null`) are skipped. */
export function averageUsagePercent(rateLimit: UsageRateLimit): number {
  const percents: number[] = []
  for (const key of COMPOSER_WINDOW_ORDER) {
    const percent = rateLimit.windows[key]?.usagePercent
    if (percent === null || percent === undefined) continue
    percents.push(percent)
  }
  if (percents.length === 0) return 0
  const sum = percents.reduce((acc, value) => acc + value, 0)
  return sum / percents.length
}

export function hasLimitedWindows(rateLimit: UsageRateLimit): boolean {
  return COMPOSER_WINDOW_ORDER.some((key) => {
    const window = rateLimit.windows[key]
    return window !== undefined && window.limit !== null
  })
}

export function windowPercent(window: RateLimitWindow): number {
  if (window.usagePercent !== null) return Math.min(100, Math.max(0, window.usagePercent))
  if (window.limit === null || window.limit === 0) return 0
  return Math.min(100, (window.used / window.limit) * 100)
}

/** Relative only: `59m`, `23h`, `27d` (days left — never a calendar date). */
export function formatResetLabel(resetAt: string, nowMs: number = Date.now()): string {
  const resetMs = new Date(resetAt).getTime()
  if (Number.isNaN(resetMs)) return '—'
  const delta = Math.max(0, resetMs - nowMs)
  if (delta < MS_PER_HOUR) return `${Math.max(1, Math.round(delta / MS_PER_MINUTE))}m`
  if (delta < MS_PER_DAY) return `${Math.max(1, Math.round(delta / MS_PER_HOUR))}h`
  return `${Math.max(1, Math.round(delta / MS_PER_DAY))}d`
}
