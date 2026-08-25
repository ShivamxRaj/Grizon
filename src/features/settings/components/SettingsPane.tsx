import type { JSX } from 'react'
import type { SettingsSection } from '../data/sections'
import { SettingsSectionBody } from './SettingsSectionBody'

/**
 * The purpose line under every title is deliberate: a settings screen that
 * doesn't say what it is for makes the user guess.
 */
export function SettingsPane({ section }: { section: SettingsSection }): JSX.Element {
  return (
    <div key={section.id} className="settings-pane min-h-0 overflow-y-auto p-md lg:p-lg">
      <div className="mb-md">
        <h3 className="settings-wrap font-display text-lg font-semibold text-ink">{section.label}</h3>
        <p className="settings-wrap mt-3xs text-sm text-muted">{section.purpose}</p>
      </div>
      <SettingsSectionBody id={section.id} />
    </div>
  )
}
