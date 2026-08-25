import type { JSX, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface SettingsGroupProps {
  label: string
  children: ReactNode
  /** Renders the group on the danger wash — used for irreversible actions. */
  tone?: 'default' | 'danger'
}

interface SettingRowProps {
  label: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Stack the control under the label even on desktop — for wide inputs. */
  stacked?: boolean
}

export function SettingsGroup({ label, children, tone = 'default' }: SettingsGroupProps): JSX.Element {
  return (
    <section className="mb-md last:mb-0">
      <h4 className={cn('mb-2xs font-mono text-[0.68rem] uppercase tracking-[0.08em]', tone === 'danger' ? 'text-danger' : 'text-muted')}>
        {label}
      </h4>
      <div
        className={cn(
          'rounded-card border px-sm [&>*+*]:border-t [&>*+*]:border-rule-2',
          tone === 'danger' ? 'border-danger/30 bg-[var(--color-danger-soft)]' : 'border-rule bg-paper-2',
        )}
      >
        {children}
      </div>
    </section>
  )
}

export function SettingRow({ label, description, children, stacked = false }: SettingRowProps): JSX.Element {
  return (
    <div className={cn('grid gap-2xs py-xs', !stacked && 'md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-md')}>
      <div className="min-w-0">
        <div className="settings-wrap text-sm font-medium text-ink">{label}</div>
        {description && <p className="settings-wrap mt-3xs text-xs leading-relaxed text-muted">{description}</p>}
      </div>
      {children && <div className={cn('min-w-0', !stacked && 'md:justify-self-end')}>{children}</div>}
    </div>
  )
}
