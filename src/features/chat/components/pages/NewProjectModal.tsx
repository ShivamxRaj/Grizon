import { useRef, useState, type JSX } from 'react'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { CloseIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'
import { useClickOutside } from '../../hooks/useClickOutside'
import type { ProjectTint } from '../../data/projects'

const TINTS: { id: ProjectTint; label: string; value: string }[] = [
  { id: 'accent', label: 'Violet', value: 'var(--color-accent)' },
  { id: 'cool', label: 'Blue', value: 'var(--color-accent-cool)' },
  { id: 'success', label: 'Green', value: 'var(--color-success)' },
  { id: 'warning', label: 'Amber', value: 'var(--color-warning)' },
]

export function NewProjectModal({ onClose }: { onClose: () => void }): JSX.Element {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [tint, setTint] = useState<ProjectTint>('accent')
  const panelRef = useRef<HTMLDivElement>(null)
  useClickOutside(panelRef, onClose, true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-md" style={{ background: 'var(--color-scrim)' }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Create new project"
        className="chat-menu-pop flex w-full max-w-[30rem] flex-col gap-md rounded-card border border-rule bg-paper p-lg shadow-lg"
      >
        <ModalHeader onClose={onClose} />
        <Field label="Name">
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Product Launch"
            className="w-full rounded-input border border-rule bg-paper-2 px-sm py-xs text-sm text-ink outline-none transition-colors duration-short ease-out focus:border-accent placeholder:text-muted"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="What is this project about?"
            className="w-full resize-none rounded-input border border-rule bg-paper-2 px-sm py-xs text-sm text-ink outline-none transition-colors duration-short ease-out focus:border-accent placeholder:text-muted"
          />
        </Field>
        <Field label="Instructions (optional)">
          <textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            rows={3}
            placeholder="How should Claude approach chats in this project?"
            className="w-full resize-none rounded-input border border-rule bg-paper-2 px-sm py-xs text-sm text-ink outline-none transition-colors duration-short ease-out focus:border-accent placeholder:text-muted"
          />
        </Field>
        <Field label="Color">
          <TintPicker tint={tint} onPick={setTint} />
        </Field>
        <div className="mt-2xs flex justify-end gap-2xs">
          <button type="button" onClick={onClose} className={buttonClasses('text', 'sm')}>
            Cancel
          </button>
          <button type="button" onClick={onClose} disabled={name.trim().length === 0} className={cn(buttonClasses('accent', 'sm'), 'disabled:pointer-events-none disabled:opacity-50')}>
            Create project
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalHeader({ onClose }: { onClose: () => void }): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-sm">
      <div>
        <h2 className="font-display text-md font-semibold text-ink">New project</h2>
        <p className="mt-3xs text-sm text-ink-2">Group related chats, files and instructions together.</p>
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

function Field({ label, children }: { label: string; children: JSX.Element }): JSX.Element {
  return (
    <label className="flex flex-col gap-2xs">
      <span className="text-xs font-semibold uppercase tracking-[0.04em] text-muted">{label}</span>
      {children}
    </label>
  )
}

function TintPicker({ tint, onPick }: { tint: ProjectTint; onPick: (t: ProjectTint) => void }): JSX.Element {
  return (
    <div className="flex items-center gap-xs">
      {TINTS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-label={option.label}
          aria-pressed={tint === option.id}
          onClick={() => onPick(option.id)}
          style={{ background: option.value }}
          className={cn(
            'h-7 w-7 rounded-pill ring-2 ring-offset-2 ring-offset-[var(--color-paper)] transition-transform duration-short ease-out hover:scale-110',
            tint === option.id ? 'ring-[var(--color-ink)]' : 'ring-transparent',
          )}
        />
      ))}
    </div>
  )
}
