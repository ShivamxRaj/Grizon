import { useEffect, useRef, type CSSProperties, type JSX } from 'react'
import { cn } from '@/lib/utils/cn'
import { useClickOutside } from '../../hooks/useClickOutside'
import { useComposerRateLimit } from '../../hooks/useComposerRateLimit'
import { useHoverOpen } from '../../hooks/useHoverOpen'
import { ComposerUsagePopover } from './ComposerUsagePopover'
import { averageUsagePercent, toneStrokeVar, usageTone } from './composerUsage'

const RING_SIZE = 18
const RING_RADIUS = 7
const RING_STROKE = 2.5
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function UsageDonut({ percent }: { percent: number }): JSX.Element {
  const clamped = Math.min(100, Math.max(0, percent))
  const dash = (clamped / 100) * RING_CIRCUMFERENCE
  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="-rotate-90"
      aria-hidden="true"
    >
      <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke="var(--color-paper-3)" strokeWidth={RING_STROKE} />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke={toneStrokeVar(usageTone(clamped))}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${RING_CIRCUMFERENCE}`}
        style={{ transition: 'stroke-dasharray var(--dur-mid) var(--ease-out)' } as CSSProperties}
      />
    </svg>
  )
}

function UsageRingTrigger({
  percent,
  open,
  onToggle,
}: {
  percent: number
  open: boolean
  onToggle: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={`Usage ${Math.round(percent)}% average. Show rate limits.`}
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={onToggle}
      className={cn(
        'grid h-9.5 w-9.5 flex-none place-items-center rounded-full text-ink-2',
        'transition-colors duration-short ease-out',
        'hover:bg-paper-3 focus-visible:bg-paper-3 focus-visible:outline-none',
        open && 'bg-paper-3',
      )}
    >
      <UsageDonut percent={percent} />
    </button>
  )
}

export function ComposerUsageRing(): JSX.Element | null {
  const containerRef = useRef<HTMLDivElement>(null)
  const { rateLimit, loaded, refresh } = useComposerRateLimit()
  const { open, setOpen, openPopover, scheduleClose } = useHoverOpen()

  useEffect(() => {
    if (open) void refresh()
  }, [open, refresh])
  useClickOutside(containerRef, () => setOpen(false), open)

  if (!loaded || rateLimit === null) return null
  const average = averageUsagePercent(rateLimit)

  return (
    <div
      ref={containerRef}
      className="relative flex-none"
      onMouseEnter={openPopover}
      onMouseLeave={scheduleClose}
    >
      <UsageRingTrigger percent={average} open={open} onToggle={() => setOpen((prev) => !prev)} />
      {open && (
        <div className="absolute right-0 bottom-[calc(100%+var(--space-2xs))] z-50">
          <ComposerUsagePopover rateLimit={rateLimit} />
        </div>
      )}
    </div>
  )
}
