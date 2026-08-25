import type { JSX } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons'
import { SETTINGS_SECTIONS, type SettingsSection, type SettingsSectionId } from '../data/sections'
import { SettingsCloseButton } from './SettingsDesktop'
import { SettingsSectionBody } from './SettingsSectionBody'

interface SettingsMobileProps {
  section: SettingsSectionId | null
  onSectionChange: (section: SettingsSectionId | null) => void
  onClose: () => void
}

const HEADER_CLASSES = 'flex flex-none items-center gap-2xs border-b border-rule px-sm py-xs'
const SCROLL_CLASSES = 'min-h-0 flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+var(--space-lg))]'

function SectionListRow({ item, onSelect }: { item: SettingsSection; onSelect: () => void }): JSX.Element {
  const Icon = item.icon
  return (
    <button type="button" onClick={onSelect} className="flex w-full items-center gap-xs px-sm py-xs text-left transition-colors duration-short ease-out active:bg-paper-3">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-sm bg-accent-soft text-accent-text">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-semibold text-ink">{item.label}</span>
        <span className="settings-wrap mt-px block text-xs text-muted">{item.purpose}</span>
      </span>
      <ChevronRightIcon className="h-4 w-4 flex-none text-muted" />
    </button>
  )
}

function SectionList({ onSelect, onClose }: { onSelect: (id: SettingsSectionId) => void; onClose: () => void }): JSX.Element {
  return (
    <>
      <header className={HEADER_CLASSES}>
        <h2 id="settings-title" className="flex-1 font-display text-md font-semibold text-ink">Settings</h2>
        <SettingsCloseButton onClose={onClose} />
      </header>
      <div className={SCROLL_CLASSES}>
        {SETTINGS_SECTIONS.map((item) => (
          <SectionListRow key={item.id} item={item} onSelect={() => onSelect(item.id)} />
        ))}
      </div>
    </>
  )
}

function SectionDetail({ item, onBack, onClose }: { item: SettingsSection; onBack: () => void; onClose: () => void }): JSX.Element {
  return (
    <div className="settings-drill flex h-full min-h-0 flex-col">
      <header className={HEADER_CLASSES}>
        <button type="button" onClick={onBack} aria-label="Back to settings" className="-ml-2xs grid h-8 w-8 flex-none place-items-center rounded-sm text-muted transition-colors duration-short ease-out active:bg-paper-3">
          <ChevronLeftIcon className="h-4.5 w-4.5" />
        </button>
        <h2 id="settings-title" className="min-w-0 flex-1 truncate font-display text-md font-semibold text-ink">{item.label}</h2>
        <SettingsCloseButton onClose={onClose} />
      </header>
      <div className={SCROLL_CLASSES}>
        <p className="settings-wrap px-sm pt-sm text-sm text-muted">{item.purpose}</p>
        <div className="p-sm">
          <SettingsSectionBody id={item.id} />
        </div>
      </div>
    </div>
  )
}

export function SettingsMobile({ section, onSectionChange, onClose }: SettingsMobileProps): JSX.Element {
  const active = SETTINGS_SECTIONS.find((item) => item.id === section)

  if (!active) return <SectionList onSelect={onSectionChange} onClose={onClose} />
  return <SectionDetail item={active} onBack={() => onSectionChange(null)} onClose={onClose} />
}
