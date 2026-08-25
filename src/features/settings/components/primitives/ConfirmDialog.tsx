import { useRef, useState, type JSX } from 'react'
import { cn } from '@/lib/utils/cn'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { useClickOutside } from '@/features/chat/hooks/useClickOutside'
import type { ConfirmRequest } from '../../settingsConfirmContext'

const DANGER_BUTTON_CLASSES =
  'inline-flex items-center justify-center rounded-pill bg-danger px-[1.1rem] py-[0.55rem] font-display text-sm font-semibold text-accent-ink transition-all duration-short ease-out hover:-translate-y-0.5 active:translate-y-px disabled:pointer-events-none disabled:opacity-50'

/** Stacks above the settings modal at z-[902] — it never replaces the surface behind it. */
export function ConfirmDialog({ request, onDismiss }: { request: ConfirmRequest; onDismiss: () => void }): JSX.Element {
  const [typed, setTyped] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  useClickOutside(panelRef, onDismiss, true)

  const isDanger = request.tone !== 'accent'
  const blocked = request.typeToConfirm !== undefined && typed.trim() !== request.typeToConfirm

  const accept = (): void => {
    request.onConfirm()
    onDismiss()
  }

  return (
    <div className="fixed inset-0 z-[902] flex items-center justify-center p-md" style={{ background: 'var(--color-scrim)' }}>
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={request.title}
        className="chat-menu-pop flex w-full max-w-[27rem] flex-col gap-sm rounded-card border border-rule bg-paper p-md shadow-lg"
      >
        <h4 className="settings-wrap font-display text-md font-semibold text-ink">{request.title}</h4>
        <div className="settings-wrap text-sm leading-relaxed text-ink-2">{request.body}</div>

        {request.typeToConfirm !== undefined && (
          <label className="flex flex-col gap-3xs">
            <span className="text-xs text-muted">Type <b className="text-ink">{request.typeToConfirm}</b> to confirm</span>
            <input
              type="text"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              className="w-full rounded-input border border-rule bg-paper-2 px-sm py-[0.45rem] text-sm text-ink outline-none transition-colors duration-short ease-out focus:border-accent"
            />
          </label>
        )}

        <div className="flex flex-wrap justify-end gap-2xs">
          <button type="button" onClick={onDismiss} className={buttonClasses('text', 'sm')}>Cancel</button>
          <button
            type="button"
            disabled={blocked}
            onClick={accept}
            className={cn(isDanger ? DANGER_BUTTON_CLASSES : buttonClasses('accent', 'sm'), blocked && 'pointer-events-none opacity-50')}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
