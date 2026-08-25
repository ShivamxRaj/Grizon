import { useState, type JSX } from 'react'
import { DEMO_ACCOUNT } from '@/features/chat/data/account'
import { useTheme, type ThemeMode } from '@/features/theme/useTheme'
import { ONBOARDING_ENABLED } from '@/features/onboarding/onboardingFlags'
import { useOnboarding } from '@/features/onboarding/useOnboarding'
import { SettingsGroup, SettingRow } from '../components/primitives/SettingsGroup'
import { SegmentedControl } from '../components/primitives/SegmentedControl'
import { SelectField, SettingsTextField } from '../components/primitives/Fields'
import { ToggleRow } from '../components/primitives/Toggle'
import { RowAction } from '../components/primitives/DataList'
import { useSettingsModal } from '../useSettingsModal'
import { useToggleSet } from '../hooks/useToggleSet'
import {
  SUPPORTED_LANGUAGE,
  REGION_OPTIONS,
  TIMEZONE_OPTIONS,
  EMAIL_NOTIFICATIONS,
  INAPP_NOTIFICATIONS,
  type NotificationSetting,
} from '../data/general'

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const DATE_FORMATS = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
]

const WALKTHROUGH_DONE = 'Replaying it walks the three steps again. Nothing you have changed since is undone.'
const WALKTHROUGH_PENDING = 'You have not finished it yet — it opens the next time you enter the workspace.'

function GettingStartedGroup(): JSX.Element {
  const { startOnboarding, hasCompleted } = useOnboarding()
  const { closeSettings } = useSettingsModal()

  /** The flow is a full-screen takeover, so Settings has to step out of its way. */
  const replay = (): void => {
    closeSettings()
    startOnboarding()
  }

  return (
    <SettingsGroup label="Getting started">
      <SettingRow label="Setup walkthrough" description={hasCompleted ? WALKTHROUGH_DONE : WALKTHROUGH_PENDING}>
        <RowAction label="Replay setup" onClick={replay} />
      </SettingRow>
    </SettingsGroup>
  )
}

function ProfileGroup(): JSX.Element {
  const [name, setName] = useState(DEMO_ACCOUNT.name)
  const { openSettings } = useSettingsModal()

  return (
    <SettingsGroup label="Profile">
      <SettingRow label="Display name" description="Shown in greetings and on anything you share.">
        <SettingsTextField label="Display name" value={name} onChange={setName} />
      </SettingRow>
      <SettingRow label="Email" description={DEMO_ACCOUNT.email}>
        <RowAction label="Manage in Account" onClick={() => openSettings('account')} />
      </SettingRow>
    </SettingsGroup>
  )
}

function AppearanceGroup(): JSX.Element {
  const { mode, setMode } = useTheme()
  const { values, set } = useToggleSet({ motion: false, text: false, sidebar: true, canvas: true })

  return (
    <SettingsGroup label="Appearance">
      <SettingRow label="Theme" description="System follows your device setting.">
        <SegmentedControl label="Theme" options={THEME_OPTIONS} value={mode} onChange={setMode} />
      </SettingRow>
      <ToggleRow label="Reduce motion" description="Cuts panel and message animations to a short fade." checked={values.motion} onChange={(next) => set('motion', next)} />
      <ToggleRow label="Larger text" description="Increases body text across the app." checked={values.text} onChange={(next) => set('text', next)} />
      <ToggleRow label="Sidebar starts expanded" checked={values.sidebar} onChange={(next) => set('sidebar', next)} />
      <ToggleRow label="Open Canvas automatically" description="When a reply produces an artifact or file." checked={values.canvas} onChange={(next) => set('canvas', next)} />
    </SettingsGroup>
  )
}

/** Read-only rather than a one-option dropdown: a select you can't change is a lie. */
function ReadOnlyValue({ value }: { value: string }): JSX.Element {
  return <span className="text-sm text-ink-2 md:text-right">{value}</span>
}

function LanguageGroup(): JSX.Element {
  const [region, setRegion] = useState('in')
  const [clock, setClock] = useState('24h')

  return (
    <SettingsGroup label="Language & region">
      <SettingRow label="Interface language" description="More languages are on the way.">
        <ReadOnlyValue value={SUPPORTED_LANGUAGE} />
      </SettingRow>
      <SettingRow label="Response language" description="What Grizon replies in.">
        <ReadOnlyValue value={SUPPORTED_LANGUAGE} />
      </SettingRow>
      <SettingRow label="Region" description="Affects number, date and currency formatting.">
        <SelectField label="Region" value={region} options={REGION_OPTIONS} onChange={setRegion} />
      </SettingRow>
      <SettingRow label="Time format">
        <SegmentedControl label="Time format" options={DATE_FORMATS} value={clock} onChange={setClock} />
      </SettingRow>
    </SettingsGroup>
  )
}

function TimezoneGroup(): JSX.Element {
  const [auto, setAuto] = useState(true)
  const [zone, setZone] = useState('Asia/Kolkata')

  return (
    <SettingsGroup label="Timezone">
      <ToggleRow label="Set automatically" description="Uses your device timezone. Used for usage resets, invoices and timestamps." checked={auto} onChange={setAuto} />
      <SettingRow label="Timezone" description={auto ? 'Detected from your device.' : undefined}>
        <SelectField label="Timezone" value={zone} options={TIMEZONE_OPTIONS} onChange={setZone} disabled={auto} />
      </SettingRow>
    </SettingsGroup>
  )
}

function NotificationRows({ items }: { items: NotificationSetting[] }): JSX.Element {
  const { values, set } = useToggleSet(Object.fromEntries(items.map((item) => [item.id, item.defaultOn])))

  return (
    <>
      {items.map((item) => (
        <ToggleRow
          key={item.id}
          label={item.label}
          description={item.lockedReason ? `${item.description} ${item.lockedReason}` : item.description}
          checked={item.lockedReason ? true : values[item.id]}
          onChange={(next) => set(item.id, next)}
          disabled={Boolean(item.lockedReason)}
        />
      ))}
    </>
  )
}

function NotificationsGroups(): JSX.Element {
  return (
    <>
      <SettingsGroup label="Email notifications">
        <NotificationRows items={EMAIL_NOTIFICATIONS} />
      </SettingsGroup>
      <SettingsGroup label="In-app notifications">
        <NotificationRows items={INAPP_NOTIFICATIONS} />
      </SettingsGroup>
    </>
  )
}

export function GeneralSection(): JSX.Element {
  return (
    <>
      {ONBOARDING_ENABLED ? <GettingStartedGroup /> : null}
      <ProfileGroup />
      <AppearanceGroup />
      <LanguageGroup />
      <TimezoneGroup />
      <NotificationsGroups />
    </>
  )
}
