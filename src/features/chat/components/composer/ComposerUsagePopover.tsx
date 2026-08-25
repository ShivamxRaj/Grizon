import type { JSX } from 'react'
import type { RateLimitWindow, RateLimitWindowKey, UsageRateLimit } from '@/features/billing/types'
import { cn } from '@/lib/utils/cn'
import {
  COMPOSER_WINDOW_LABELS,
  COMPOSER_WINDOW_ORDER,
  formatResetLabel,
  toneFillClass,
  usageTone,
  windowPercent,
} from './composerUsage'

interface ComposerUsagePopoverProps {
  rateLimit: UsageRateLimit
}

function UsageRow({
  windowKey,
  window,
}: {
  windowKey: RateLimitWindowKey
  window: RateLimitWindow
}): JSX.Element {
  const percent = windowPercent(window)
  const tone = usageTone(percent)
  const displayPercent = Math.round(percent)

  return (
    <div className="flex flex-col gap-3xs">
      <div className="flex items-baseline justify-between gap-xs">
        <span className="text-xs font-semibold text-ink">{COMPOSER_WINDOW_LABELS[windowKey]}</span>
        <span className="flex-none text-[0.7rem] tabular-nums text-muted">
          {displayPercent}% · resets {formatResetLabel(window.resetAt)}
        </span>
      </div>
      <span className="block h-1 overflow-hidden rounded-pill bg-paper-3" aria-hidden="true">
        <span
          className={cn('block h-full rounded-[inherit]', toneFillClass(tone))}
          style={{ width: `${percent}%` }}
        />
      </span>
    </div>
  )
}

export function ComposerUsagePopover({ rateLimit }: ComposerUsagePopoverProps): JSX.Element {
  const rows = COMPOSER_WINDOW_ORDER.filter((key) => {
    const window = rateLimit.windows[key]
    return window !== undefined && window.limit !== null
  })

  return (
    <div
      role="dialog"
      aria-label="Usage rate limits"
      className="w-[15.5rem] rounded-card border border-rule bg-paper px-xs py-xs shadow-md"
    >
      <p className="mb-xs text-[0.65rem] font-semibold tracking-wide text-muted uppercase">Usage</p>
      <div className="flex flex-col gap-xs">
        {rows.map((key) => (
          <UsageRow key={key} windowKey={key} window={rateLimit.windows[key]!} />
        ))}
      </div>
      {rateLimit.degraded && (
        <p className="mt-xs text-[0.7rem] text-warning-ink">Limits may be approximate right now.</p>
      )}
    </div>
  )
}
