import { useMemo, useState, type JSX } from 'react'
import { PROJECTS } from '@/features/chat/data/projects'
import { SearchIcon } from '@/components/ui/icons'
import { SettingsGroup, SettingRow } from '../components/primitives/SettingsGroup'
import { DataList, DataRow, RowAction } from '../components/primitives/DataList'
import { Toggle, ToggleRow } from '../components/primitives/Toggle'
import { useSettingsConfirm } from '../hooks/useSettingsConfirm'
import { SAVED_MEMORIES, MEMORY_EMPTY_COPY, type SavedMemory } from '../data/memory'

const MEMORY_OFF_NOTE = 'Nothing new is saved while this is off. Memories you already have are kept, but not used.'

function MemorySearch({ query, onChange }: { query: string; onChange: (next: string) => void }): JSX.Element {
  return (
    <span className="relative flex py-xs">
      <SearchIcon className="pointer-events-none absolute left-2xs top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        aria-label="Search memories"
        value={query}
        placeholder="Search memories"
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-input border border-rule bg-paper py-[0.4rem] pl-[2.1rem] pr-sm text-sm text-ink outline-none transition-colors duration-short ease-out placeholder:text-muted focus:border-accent"
      />
    </span>
  )
}

function MemoryRow({ memory, onForget }: { memory: SavedMemory; onForget: () => void }): JSX.Element {
  return (
    <DataRow
      title={<span className="settings-wrap">{memory.text}</span>}
      meta={`From “${memory.sourceChat}” · saved ${memory.savedAt}`}
      actions={
        <>
          <RowAction label="Edit" />
          <RowAction label="Forget" tone="danger" onClick={onForget} />
        </>
      }
    />
  )
}

function SavedMemoriesGroup({ enabled }: { enabled: boolean }): JSX.Element {
  const { ask } = useSettingsConfirm()
  const [query, setQuery] = useState('')
  const [memories, setMemories] = useState(SAVED_MEMORIES)

  const visible = useMemo(
    () => memories.filter((memory) => memory.text.toLowerCase().includes(query.trim().toLowerCase())),
    [memories, query],
  )

  const confirmClearAll = (): void => ask({
    title: 'Clear all memories?',
    body: `All ${memories.length} saved memories are deleted. Grizon starts fresh — this cannot be undone.`,
    confirmLabel: 'Clear all',
    onConfirm: () => setMemories([]),
  })

  return (
    <SettingsGroup label={`Saved memories · ${memories.length}`}>
      <MemorySearch query={query} onChange={setQuery} />
      <DataList isEmpty={visible.length === 0} empty={memories.length === 0 ? MEMORY_EMPTY_COPY : 'No memories match that search.'}>
        {visible.map((memory) => (
          <MemoryRow key={memory.id} memory={memory} onForget={() => setMemories((all) => all.filter((item) => item.id !== memory.id))} />
        ))}
      </DataList>
      <SettingRow label="Clear all memories" description={enabled ? 'Deletes every saved memory at once.' : 'Memory is off — existing memories are kept but unused.'}>
        <RowAction label="Clear all" tone="danger" onClick={confirmClearAll} />
      </SettingRow>
    </SettingsGroup>
  )
}

function ProjectMemoryGroup(): JSX.Element {
  const [maintained, setMaintained] = useState(true)

  return (
    <SettingsGroup label="Project memory">
      <ToggleRow
        label="Let Grizon maintain project memory"
        description="Each project keeps its own summary of durable facts, updated as you work."
        checked={maintained}
        onChange={setMaintained}
      />
      <DataList>
        {PROJECTS.map((project) => (
          <DataRow key={project.id} title={project.name} meta={<span className="settings-wrap">{project.memory}</span>} actions={<RowAction label="Open" />} />
        ))}
      </DataList>
    </SettingsGroup>
  )
}

export function MemorySection(): JSX.Element {
  const [enabled, setEnabled] = useState(true)
  const [reference, setReference] = useState(true)

  return (
    <>
      <SettingsGroup label="Memory">
        <SettingRow label="Remember useful details" description={enabled ? 'Grizon saves facts worth carrying between chats.' : MEMORY_OFF_NOTE}>
          <Toggle checked={enabled} onChange={setEnabled} label="Memory" />
        </SettingRow>
        <ToggleRow
          label="Reference past conversations"
          description="Lets Grizon draw on earlier chats when answering."
          checked={reference}
          onChange={setReference}
        />
      </SettingsGroup>
      <SavedMemoriesGroup enabled={enabled} />
      <ProjectMemoryGroup />
    </>
  )
}
