import type { JSX, SVGProps } from 'react'
import { SparkleIcon, GeneralAgentIcon, TrendingUpIcon, CodeIcon } from '@/components/ui/icons'

export interface AgentOption {
  id: string
  name: string
  description: string
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}

export const AGENT_OPTIONS: AgentOption[] = [
  { id: 'auto', name: 'Auto', description: 'Best model, picked for the task', icon: SparkleIcon },
  { id: 'general', name: 'General', description: 'All-purpose conversation', icon: GeneralAgentIcon },
  { id: 'trading-analyst', name: 'Trading Analyst', description: 'Markets, charts & strategy', icon: TrendingUpIcon },
  { id: 'coding-expert', name: 'Coding Expert', description: 'Debugging & architecture', icon: CodeIcon },
]

export const DEFAULT_AGENT_ID = 'auto'
