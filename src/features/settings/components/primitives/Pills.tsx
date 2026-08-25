import type { JSX, ReactNode, SVGProps } from 'react'
import { cn } from '@/lib/utils/cn'

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success-ink)]',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning-ink)]',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger-ink)]',
  neutral: 'bg-paper-3 text-muted',
}

export function StatusPill({ tone, label, icon: Icon }: { tone: StatusTone; label: string; icon?: (props: SVGProps<SVGSVGElement>) => JSX.Element }): JSX.Element {
  return (
    <span className={cn('inline-flex flex-none items-center gap-3xs rounded-pill px-2xs py-[0.1rem] text-[0.68rem] font-semibold', TONE_CLASSES[tone])}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  )
}

/** A banner that states what is happening and what to do about it. */
export function Banner({ tone, icon: Icon, children, action }: { tone: StatusTone; icon?: (props: SVGProps<SVGSVGElement>) => JSX.Element; children: ReactNode; action?: ReactNode }): JSX.Element {
  return (
    <div className={cn('mb-md flex flex-wrap items-center gap-xs rounded-card px-sm py-xs', TONE_CLASSES[tone])}>
      {Icon && <Icon className="h-4.5 w-4.5 flex-none" />}
      <p className="settings-wrap min-w-0 flex-1 basis-48 text-sm leading-relaxed">{children}</p>
      {action}
    </div>
  )
}

