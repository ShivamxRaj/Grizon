import type { JSX } from 'react'
import { MicIcon } from '@/components/ui/icons'
import { BentoCell } from './BentoCell'

export function ComposerCell({ index }: { index: number }): JSX.Element {
  return (
    <BentoCell index={index} span="2x2">
      <div>
        <h2 className="text-lg text-ink">Type or talk.</h2>
        <p className="max-w-[38ch] text-sm text-ink-2">
          The composer stays out of the way until you need it — attachments, voice input, and the agent you're
          speaking to, all in one line.
        </p>
      </div>
      <div className="mt-auto flex w-full items-center gap-2 rounded-pill border border-rule bg-paper py-2 pl-4 pr-2 shadow-sm">
        <span className="min-w-0 flex-1 truncate text-base text-muted">Ask Grizon</span>
        <span className="grid h-8.5 w-8.5 flex-none place-items-center rounded-full bg-accent-soft text-accent-text">
          <MicIcon className="h-4 w-4" />
        </span>
      </div>
    </BentoCell>
  )
}
