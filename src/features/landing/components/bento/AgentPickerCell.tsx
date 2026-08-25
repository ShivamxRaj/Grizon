import type { JSX, SVGProps } from 'react'
import { SparkleIcon, TrendingUpIcon, CodeIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'
import { BentoCell } from './BentoCell'

interface AgentCardData {
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  name: string
  description: string
  active?: boolean
}

const AGENT_CARDS: AgentCardData[] = [
  { icon: SparkleIcon, name: 'Auto', description: 'Best model, picked for the task', active: true },
  { icon: TrendingUpIcon, name: 'Trading Analyst', description: 'Markets, charts & strategy' },
  { icon: CodeIcon, name: 'Coding Expert', description: 'Debugging & architecture' },
]

function AgentCard({ icon: Icon, name, description, active }: AgentCardData): JSX.Element {
  return (
    <div className={cn('flex items-center gap-xs rounded-sm p-2.5', active ? 'bg-accent-soft' : 'bg-paper')}>
      <span
        className={cn(
          'grid h-7.5 w-7.5 flex-none place-items-center rounded-sm',
          active ? 'bg-accent/[0.22] text-accent-text' : 'bg-paper-3 text-ink-2',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <b className="block font-body text-sm font-semibold text-ink [overflow-wrap:anywhere]">{name}</b>
        <small className="text-xs text-muted">{description}</small>
      </span>
    </div>
  )
}

export function AgentPickerCell({ index }: { index: number }): JSX.Element {
  return (
    <BentoCell index={index} span="2x2">
      <div>
        <h2 className="text-lg text-ink">Pick the agent for the job.</h2>
        <p className="max-w-[38ch] text-sm text-ink-2">
          Auto routes to whichever agent fits — or choose one yourself: a generalist, a trading analyst, a coding
          expert.
        </p>
      </div>
      <div className="flex w-full flex-col gap-1.5">
        {AGENT_CARDS.map((card) => (
          <AgentCard key={card.name} {...card} />
        ))}
      </div>
    </BentoCell>
  )
}
