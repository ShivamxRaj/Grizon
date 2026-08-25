import { useRef, useState, type JSX } from 'react'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { CloseIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'
import { useClickOutside } from '../../hooks/useClickOutside'
import { useProjectField } from '../../hooks/useProjectField'
import type { Project } from '../../data/projects'

type KnowledgeTab = 'instructions' | 'memory'

const TEXTAREA_CLASSES =
  'w-full resize-none rounded-input border border-rule bg-paper-2 px-sm py-xs text-sm text-ink outline-none transition-colors duration-short ease-out focus:border-accent placeholder:text-muted'

export function ProjectKnowledgeModal({ project, onClose }: { project: Project; onClose: () => void }): JSX.Element {
  const [tab, setTab] = useState<KnowledgeTab>('instructions')
  const panelRef = useRef<HTMLDivElement>(null)
  useClickOutside(panelRef, onClose, true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-md" style={{ background: 'var(--color-scrim)' }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Project instructions and memory"
        className="chat-menu-pop flex w-full max-w-[32rem] flex-col gap-md rounded-card border border-rule bg-paper p-lg shadow-lg"
      >
        <ModalHeader onClose={onClose} />
        <TabSwitcher tab={tab} onChange={setTab} />
        {tab === 'instructions' ? <InstructionsField project={project} /> : <MemoryField project={project} />}
      </div>
    </div>
  )
}

function ModalHeader({ onClose }: { onClose: () => void }): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-sm">
      <div>
        <h2 className="font-display text-md font-semibold text-ink">Project knowledge</h2>
        <p className="mt-3xs text-sm text-ink-2">What Claude knows going into every chat here.</p>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="grid h-8 w-8 flex-none place-items-center rounded-sm text-muted transition-colors duration-short ease-out hover:bg-paper-3 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

function TabSwitcher({ tab, onChange }: { tab: KnowledgeTab; onChange: (tab: KnowledgeTab) => void }): JSX.Element {
  return (
    <div className="flex items-center gap-[0.2rem] rounded-sm bg-paper-2 p-[0.2rem]">
      <TabButton label="Instructions" active={tab === 'instructions'} onClick={() => onChange('instructions')} />
      <TabButton label="Memory" active={tab === 'memory'} onClick={() => onChange('memory')} />
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex-1 rounded-sm px-sm py-[0.4rem] text-sm font-medium transition-colors duration-short ease-out',
        active ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:bg-paper-3 hover:text-ink',
      )}
    >
      {label}
    </button>
  )
}

function InstructionsField({ project }: { project: Project }): JSX.Element {
  const [instructions, setInstructions] = useProjectField(project.id, 'instructions', project.instructions)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(instructions)

  const startEditing = (): void => {
    setDraft(instructions)
    setIsEditing(true)
  }

  const save = (): void => {
    setInstructions(draft.trim())
    setIsEditing(false)
  }

  return (
    <div className="flex flex-col gap-2xs">
      <div className="flex items-start justify-between gap-sm">
        <p className="text-xs text-muted">Guidance you give Claude for every chat in this project.</p>
        {!isEditing && (
          <button type="button" onClick={startEditing} className={buttonClasses('text', 'sm')}>
            {instructions ? 'Edit' : 'Add'}
          </button>
        )}
      </div>
      {isEditing ? (
        <EditableTextarea
          value={draft}
          onChange={setDraft}
          onSave={save}
          onCancel={() => setIsEditing(false)}
          placeholder="e.g. Always cite sources, keep a confident brand voice…"
        />
      ) : (
        <ReadOnlyText text={instructions} empty="No instructions yet — add some to steer every chat in this project." />
      )}
    </div>
  )
}

function MemoryField({ project }: { project: Project }): JSX.Element {
  const [memory] = useProjectField(project.id, 'memory', project.memory)
  return (
    <div className="flex flex-col gap-2xs">
      <p className="text-xs text-muted">What Claude has picked up from this project so far. It builds this automatically as you chat and can't be edited directly.</p>
      <ReadOnlyText text={memory} empty="Nothing remembered yet." muted />
    </div>
  )
}

function EditableTextarea({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  onSave: () => void
  onCancel: () => void
  placeholder: string
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2xs">
      <textarea autoFocus value={value} onChange={(event) => onChange(event.target.value)} rows={6} placeholder={placeholder} className={TEXTAREA_CLASSES} />
      <div className="flex justify-end gap-2xs">
        <button type="button" onClick={onCancel} className={buttonClasses('text', 'sm')}>
          Cancel
        </button>
        <button type="button" onClick={onSave} className={buttonClasses('outline', 'sm')}>
          Save
        </button>
      </div>
    </div>
  )
}

function ReadOnlyText({ text, empty, muted = false }: { text: string; empty: string; muted?: boolean }): JSX.Element {
  if (!text) return <p className="text-sm italic text-muted">{empty}</p>
  return <p className={cn('whitespace-pre-wrap text-sm', muted ? 'text-ink-2' : 'text-ink')}>{text}</p>
}
