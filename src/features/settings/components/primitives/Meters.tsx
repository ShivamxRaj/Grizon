import type { CSSProperties, JSX } from 'react'
import { cn } from '@/lib/utils/cn'

export interface BarDatum {
  label: string
  value: number
}

interface UsageMeterProps {
  used: number
  limit: number
  unit: string
  /** Turns the fill amber past 80% and red at 100% — the number alone is easy to miss. */
  tone?: 'accent' | 'auto'
}

const NEAR_LIMIT_PERCENT = 80
/** Never draw more than this many x-axis labels — they collide below ~8. */
const MAX_BAR_LABELS = 8

function meterTone(percent: number): string {
  if (percent >= 100) return 'bg-danger'
  if (percent >= NEAR_LIMIT_PERCENT) return 'bg-warning'
  return ''
}

export function UsageMeter({ used, limit, unit, tone = 'auto' }: UsageMeterProps): JSX.Element {
  const percent = Math.min(100, Math.round((used / limit) * 100))
  const toneClass = tone === 'auto' ? meterTone(percent) : ''

  return (
    <div style={{ '--usage': percent } as CSSProperties}>
      <div className="flex flex-wrap items-baseline justify-between gap-2xs">
        <span className="font-display text-md font-semibold tabular-nums text-ink">
          {used.toLocaleString()} <span className="text-sm font-medium text-muted">of {limit.toLocaleString()} {unit}</span>
        </span>
        <span className="font-mono text-xs tabular-nums text-muted">{percent}%</span>
      </div>
      <span className="mt-2xs block h-2 overflow-hidden rounded-pill bg-paper-3" aria-hidden="true">
        <span
          className={cn('chat-usage-meter-fill block h-full rounded-[inherit]', toneClass)}
          style={toneClass ? undefined : { background: 'linear-gradient(90deg, var(--color-accent-cool), var(--color-accent))' }}
        />
      </span>
    </div>
  )
}

/** CSS-only bars — no chart library, no new dependency. */
export function MiniBarChart({ data, unit }: { data: BarDatum[]; unit: string }): JSX.Element {
  const max = Math.max(...data.map((datum) => datum.value), 1)
  const labelStep = Math.ceil(data.length / MAX_BAR_LABELS)

  return (
    <div className="flex h-26 items-end gap-[0.2rem] py-xs">
      {data.map((datum, index) => (
        <div key={datum.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3xs">
          <span
            title={`${datum.label}: ${datum.value.toLocaleString()} ${unit}`}
            style={{ '--bar': (datum.value / max) * 100 } as CSSProperties}
            className="settings-bar w-full rounded-t-[3px]"
          />
          {/* The label row is always rendered so every bar shares one baseline —
              hiding it on alternate columns would push those bars downward. */}
          <span className="h-3.5 w-full truncate text-center font-mono text-[0.6rem] leading-3.5 text-muted">
            {index % labelStep === 0 ? datum.label : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * One rate-limit window: headline percentage, used/limit, a track, and the
 * remaining count. The track turns amber past 80% and red once spent, so a
 * window that's about to bite is visible without reading the numbers.
 */
export function RateLimitRow({ label, used, limit, resets }: { label: string; used: number; limit: number; resets: string }): JSX.Element {
  const percent = limit === 0 ? 0 : Math.min(100, (used / limit) * 100)
  const toneClass = meterTone(percent) || 'bg-accent'

  return (
    <div className="py-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-sm gap-y-3xs">
        <span className="font-display text-sm font-semibold text-ink">{label}</span>
        <span className="font-display text-sm font-semibold tabular-nums text-ink">{percent.toFixed(1)}% used</span>
        <span className="w-full order-3 flex items-baseline justify-between gap-sm">
          <span className="text-xs text-muted">{resets}</span>
          <span className="font-mono text-xs tabular-nums text-muted">{used.toLocaleString()} / {limit.toLocaleString()}</span>
        </span>
      </div>
      <span className="mt-2xs block h-1.5 overflow-hidden rounded-pill bg-paper-3" aria-hidden="true">
        <span className={cn('block h-full rounded-[inherit]', toneClass)} style={{ width: `${percent}%` }} />
      </span>
      <p className="mt-2xs text-xs text-muted">{(limit - used).toLocaleString()} remaining</p>
    </div>
  )
}

/** Horizontal breakdown bar — for "by agent" / "by feature" splits. */
export function BreakdownBar({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }): JSX.Element {
  return (
    <div className="py-2xs">
      <div className="flex items-baseline justify-between gap-2xs text-xs">
        <span className="min-w-0 truncate text-ink-2">{label}</span>
        <span className="flex-none font-mono tabular-nums text-muted">{value.toLocaleString()} {unit}</span>
      </div>
      <span className="mt-3xs block h-1.5 overflow-hidden rounded-pill bg-paper-3" aria-hidden="true">
        <span className="block h-full rounded-[inherit] bg-accent" style={{ width: `${(value / max) * 100}%` }} />
      </span>
    </div>
  )
}
