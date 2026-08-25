import type { JSX } from 'react'
import type { MetaChip } from '../../types'

export function MetaChipRow({ chips }: { chips: MetaChip[] }): JSX.Element {
  return (
    <div className="mt-[0.15rem] flex flex-wrap gap-[0.35rem]">
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-[0.3rem] rounded-pill border border-rule bg-paper-2 py-[0.2rem] pl-[0.4rem] pr-[0.55rem] font-mono text-[0.68rem] text-muted"
        >
          <chip.icon className="h-2.75 w-2.75 flex-none opacity-70" />
          {chip.label}
        </span>
      ))}
    </div>
  )
}
