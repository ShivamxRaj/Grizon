import { useState, type JSX } from 'react'
import { ExternalLinkIcon } from '@/components/ui/icons'
import { SettingsGroup, SettingRow } from '../components/primitives/SettingsGroup'
import { SegmentedControl } from '../components/primitives/SegmentedControl'
import { DataList, DataRow, RowAction } from '../components/primitives/DataList'
import { Toggle, ToggleRow } from '../components/primitives/Toggle'
import { useSettingsConfirm } from '../hooks/useSettingsConfirm'
import { RETENTION_OPTIONS, SHARED_LINKS } from '../data/privacy'

const TRAINING_COPY =
  'When on, anonymised conversations may be used to improve Grizon. Chats in projects marked confidential, uploaded files and anything you delete are never used.'

function TrainingGroup(): JSX.Element {
  const [training, setTraining] = useState(false)

  return (
    <SettingsGroup label="Training">
      <SettingRow label="Improve Grizon for everyone" description={TRAINING_COPY}>
        <Toggle checked={training} onChange={setTraining} label="Improve Grizon for everyone" />
      </SettingRow>
    </SettingsGroup>
  )
}

function HistoryGroup(): JSX.Element {
  const [save, setSave] = useState(true)
  const [retention, setRetention] = useState('forever')

  return (
    <SettingsGroup label="Chat history">
      <ToggleRow label="Save new chats" description="Off means conversations vanish when you close them." checked={save} onChange={setSave} />
      <SettingRow
        label="Keep chats for"
        description={retention === 'forever' ? undefined : 'Shortening this deletes older chats on the next cycle.'}
        stacked
      >
        <SegmentedControl label="Retention" options={RETENTION_OPTIONS} value={retention} onChange={setRetention} disabled={!save} wrap />
      </SettingRow>
    </SettingsGroup>
  )
}

function SharedLinksGroup(): JSX.Element {
  const { ask } = useSettingsConfirm()
  const [links, setLinks] = useState(SHARED_LINKS)

  const confirmRevokeAll = (): void => ask({
    title: 'Revoke every shared link?',
    body: `All ${links.length} links stop working immediately. Anyone holding one sees a "not found" page.`,
    confirmLabel: 'Revoke all',
    onConfirm: () => setLinks([]),
  })

  return (
    <SettingsGroup label="Shared links">
      <DataList isEmpty={links.length === 0} empty="Shared links are public, read-only snapshots of a chat or artifact. You have not created any.">
        {links.map((link) => (
          <DataRow
            key={link.id}
            icon={ExternalLinkIcon}
            title={link.title}
            meta={`Created ${link.created} · ${link.views} views`}
            actions={
              <>
                <RowAction label="Copy" />
                <RowAction label="Revoke" tone="danger" onClick={() => setLinks((all) => all.filter((item) => item.id !== link.id))} />
              </>
            }
          />
        ))}
      </DataList>
      {links.length > 0 && (
        <SettingRow label="Revoke all links" description="Every link stops working immediately.">
          <RowAction label="Revoke all" tone="danger" onClick={confirmRevokeAll} />
        </SettingRow>
      )}
    </SettingsGroup>
  )
}

export function PrivacySection(): JSX.Element {
  return (
    <>
      <TrainingGroup />
      <HistoryGroup />
      <SharedLinksGroup />
    </>
  )
}
