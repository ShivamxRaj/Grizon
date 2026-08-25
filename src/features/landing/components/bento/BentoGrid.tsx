import type { JSX } from 'react'
import { ComposerCell } from './ComposerCell'
import { AgentPickerCell } from './AgentPickerCell'
import { RecentsCell } from './RecentsCell'
import { QuietCell } from './QuietCell'
import { LoginPromptCell } from './LoginPromptCell'
import { CtaCell } from './CtaCell'

const QUIET_CELLS = [
  { title: 'No new app to learn.', description: 'Same box you already trust, sharper answers underneath.' },
  { title: 'Pick up anywhere.', description: 'Start on your phone, keep going on desktop — same thread, same context.' },
  { title: "Nothing you didn't ask for.", description: 'No inbox, no notifications — just answers when you ask for them.' },
]

export function BentoGrid(): JSX.Element {
  return (
    <section
      id="bento"
      aria-label="What Grizon does"
      className="grid grid-cols-1 auto-rows-[minmax(180px,auto)] grid-flow-row-dense gap-md py-lg pb-3xl min-[40rem]:grid-cols-2 min-[60rem]:grid-cols-4"
    >
      <ComposerCell index={0} />
      <AgentPickerCell index={1} />
      <RecentsCell index={2} />
      {QUIET_CELLS.map((cell, i) => (
        <QuietCell key={cell.title} index={i + 3} title={cell.title} description={cell.description} />
      ))}
      <LoginPromptCell index={6} />
      <CtaCell index={7} />
    </section>
  )
}
