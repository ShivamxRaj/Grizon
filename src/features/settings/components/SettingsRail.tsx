import type { JSX } from 'react'
import { cn } from '@/lib/utils/cn'
import { STATIC_PRIVACY_URL, STATIC_TERMS_URL } from '@/constants/routes'
import { SETTINGS_SECTIONS, type SettingsSectionId } from '../data/sections'
import { APP_VERSION } from '../data/general'

interface SettingsRailProps {
  activeId: SettingsSectionId
  onSelect: (id: SettingsSectionId) => void
}

function RailFooter(): JSX.Element {
  return (
    <div className="mt-auto flex flex-col gap-3xs px-[0.6rem] pt-sm text-[0.7rem] text-muted">
      <span>Grizon {APP_VERSION}</span>
      <span className="flex gap-2xs">
        <a href={STATIC_PRIVACY_URL} className="transition-colors duration-short ease-out hover:text-ink">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href={STATIC_TERMS_URL} className="transition-colors duration-short ease-out hover:text-ink">Terms</a>
      </span>
    </div>
  )
}

export function SettingsRail({ activeId, onSelect }: SettingsRailProps): JSX.Element {
  return (
    <nav aria-label="Settings sections" className="flex min-h-0 flex-col overflow-y-auto border-r border-rule bg-paper-2 p-2xs">
      {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-current={id === activeId ? 'true' : undefined}
          className={cn(
            'flex w-full items-center gap-2xs rounded-sm px-[0.6rem] py-2 text-left text-sm font-medium transition-colors duration-short ease-out',
            id === activeId ? 'bg-accent-soft text-accent-text' : 'text-ink-2 hover:bg-paper-3 hover:text-ink',
          )}
        >
          <Icon className="h-4.5 w-4.5 flex-none" />
          <span className="min-w-0 truncate">{label}</span>
        </button>
      ))}
      <RailFooter />
    </nav>
  )
}
