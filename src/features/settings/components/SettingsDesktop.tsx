import type { JSX } from 'react'
import { CloseIcon } from '@/components/ui/icons'
import { SETTINGS_SECTIONS, type SettingsSectionId } from '../data/sections'
import { SettingsRail } from './SettingsRail'
import { SettingsPane } from './SettingsPane'

interface SettingsDesktopProps {
  section: SettingsSectionId | null
  onSectionChange: (section: SettingsSectionId | null) => void
  onClose: () => void
}

export function SettingsCloseButton({ onClose }: { onClose: () => void }): JSX.Element {
  return (
    <button
      type="button"
      aria-label="Close settings"
      onClick={onClose}
      className="grid h-8 w-8 flex-none place-items-center rounded-sm text-muted transition-colors duration-short ease-out hover:bg-paper-3 hover:text-ink active:scale-95"
    >
      <CloseIcon className="h-4 w-4" />
    </button>
  )
}

export function SettingsDesktop({ section, onSectionChange, onClose }: SettingsDesktopProps): JSX.Element {
  const active = SETTINGS_SECTIONS.find((item) => item.id === section) ?? SETTINGS_SECTIONS[0]

  return (
    <>
      <header className="flex flex-none items-center justify-between gap-sm border-b border-rule px-md py-xs">
        <h2 id="settings-title" className="font-display text-md font-semibold text-ink">
          Settings
        </h2>
        <SettingsCloseButton onClose={onClose} />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[12.5rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)]">
        <SettingsRail activeId={active.id} onSelect={onSectionChange} />
        <SettingsPane section={active} />
      </div>
    </>
  )
}
