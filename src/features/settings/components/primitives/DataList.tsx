import type { JSX, ReactNode, SVGProps } from 'react'
import { cn } from '@/lib/utils/cn'

interface DataListProps {
  children: ReactNode
  /** Shown instead of rows when the list is empty — must explain the concept, not just say "nothing here". */
  empty?: ReactNode
  isEmpty?: boolean
}

interface DataRowProps {
  icon?: (props: SVGProps<SVGSVGElement>) => JSX.Element
  title: ReactNode
  meta?: ReactNode
  badge?: ReactNode
  actions?: ReactNode
}

export function DataList({ children, empty, isEmpty = false }: DataListProps): JSX.Element {
  if (isEmpty) {
    return <p className="settings-wrap px-sm py-md text-center text-xs leading-relaxed text-muted">{empty}</p>
  }
  return <div className="[&>*+*]:border-t [&>*+*]:border-rule-2">{children}</div>
}

export function DataRow({ icon: Icon, title, meta, badge, actions }: DataRowProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-xs gap-y-2xs py-xs">
      {Icon && <Icon className="h-4 w-4 flex-none text-muted" />}
      <div className="min-w-0 flex-1 basis-40">
        <div className="settings-wrap flex items-center gap-2xs text-sm text-ink">
          <span className="min-w-0">{title}</span>
          {badge}
        </div>
        {meta && <div className="settings-wrap mt-3xs text-xs text-muted">{meta}</div>}
      </div>
      {actions && <div className="flex flex-none items-center gap-2xs">{actions}</div>}
    </div>
  )
}

/** Small inline action used inside data rows — quieter than a real button. */
export function RowAction({ label, onClick, tone = 'default' }: { label: string; onClick?: () => void; tone?: 'default' | 'danger' }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-sm border border-rule px-2xs py-[0.25rem] text-xs font-medium transition-colors duration-short ease-out active:scale-95',
        tone === 'danger' ? 'text-danger hover:border-danger hover:bg-[var(--color-danger-soft)]' : 'text-ink-2 hover:border-accent hover:text-accent-text',
      )}
    >
      {label}
    </button>
  )
}
