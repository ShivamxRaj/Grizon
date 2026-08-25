import type { JSX, SVGProps } from 'react'
import { MessageSquareIcon, FolderIcon, LayersIcon } from '@/components/ui/icons'
import { BentoCell } from './BentoCell'

interface RecentItem {
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  label: string
}

const RECENT_ITEMS: RecentItem[] = [
  { icon: MessageSquareIcon, label: 'Q3 marketing plan draft' },
  { icon: FolderIcon, label: 'Onboarding email — Projects' },
  { icon: LayersIcon, label: 'Q3 assets — synced from Drive' },
]

export function RecentsCell({ index }: { index: number }): JSX.Element {
  return (
    <BentoCell index={index} span="1x2">
      <h2 className="text-lg text-ink">Stays where you left it.</h2>
      <p className="text-sm text-ink-2">Recent threads, projects, and connected Drive files sit in one rail.</p>
      <div className="mt-xs flex w-full flex-col divide-y divide-rule-2">
        {RECENT_ITEMS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex min-w-0 items-center gap-xs py-2 text-sm text-ink-2">
            <Icon className="h-4 w-4 flex-none text-muted" />
            <span className="min-w-0 truncate">{label}</span>
          </div>
        ))}
      </div>
    </BentoCell>
  )
}
