import type { JSX } from 'react'
import { BentoCell } from './BentoCell'

interface QuietCellProps {
  index: number
  title: string
  description: string
}

export function QuietCell({ index, title, description }: QuietCellProps): JSX.Element {
  return (
    <BentoCell index={index} tone="quiet">
      <h2 className="text-lg text-ink">{title}</h2>
      <p className="text-sm text-muted">{description}</p>
    </BentoCell>
  )
}
