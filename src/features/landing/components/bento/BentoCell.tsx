import type { JSX, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export type CellSpan = '1x1' | '2x2' | '2x1' | '1x2'
export type CellTone = 'default' | 'cta' | 'quiet'

interface BentoCellProps {
  index: number
  span?: CellSpan
  tone?: CellTone
  children: ReactNode
}

const REVEAL_STAGGER_MS = 60

// justify-content lives here (per span), not in TONE_CLASSES, so a cell
// never carries two competing justify-* utilities — Tailwind resolves
// same-property utility classes by their position in its generated
// stylesheet, not by order in the className string, so "later wins" can't
// be relied on to layer a tone's justify-* over a span's.
const SPAN_CLASSES: Record<CellSpan, string> = {
  '1x1': '',
  '2x2': 'min-[40rem]:col-span-2 min-[60rem]:row-span-2 justify-between',
  '2x1': 'min-[40rem]:col-span-2',
  '1x2': 'min-[60rem]:row-span-2 justify-start',
}

const TONE_CLASSES: Record<CellTone, string> = {
  default: 'bg-paper-2',
  cta: 'items-start justify-center gap-md bg-accent-soft border-accent/25',
  quiet: 'bg-paper-2 justify-center',
}

export function BentoCell({ index, span = '1x1', tone = 'default', children }: BentoCellProps): JSX.Element {
  const [ref, isVisible] = useScrollReveal<HTMLElement>()

  return (
    <article
      ref={ref}
      style={{ transitionDelay: `${index * REVEAL_STAGGER_MS}ms` }}
      className={cn(
        'flex min-w-0 flex-col gap-sm rounded-card border border-rule p-lg transition-all duration-mid ease-out hover:-translate-y-0.5 hover:shadow-md',
        SPAN_CLASSES[span],
        TONE_CLASSES[tone],
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2.5 opacity-0',
      )}
    >
      {children}
    </article>
  )
}
