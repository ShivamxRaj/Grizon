import { useRef, useState, type FormEvent, type JSX } from 'react'
import { cn } from '@/lib/utils/cn'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { useClickOutside } from '@/features/chat/hooks/useClickOutside'
import { changePassword } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { getApiErrorMessage, isApiError } from '@/lib/api/errors'

interface PasswordChangeDialogProps {
  onDismiss: () => void
}

function mapPasswordError(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === 'INVALID_CURRENT_PASSWORD') return 'Current password is incorrect.'
    if (error.code === 'PASSWORD_TOO_WEAK') {
      return 'New password must be at least 10 characters and include a letter and a number.'
    }
  }
  return getApiErrorMessage(error, 'Could not change password.')
}

function PasswordField(props: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}): JSX.Element {
  return (
    <label className="flex flex-col gap-3xs">
      <span className="text-xs text-muted">{props.label}</span>
      <input
        type="password"
        value={props.value}
        autoComplete={props.autoComplete}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-full rounded-input border border-rule bg-paper-2 px-sm py-[0.45rem] text-sm text-ink outline-none transition-colors duration-short ease-out focus:border-accent"
      />
    </label>
  )
}

export function PasswordChangeDialog({ onDismiss }: PasswordChangeDialogProps): JSX.Element {
  const { applyTokensAndFetchUser } = useAuth()
  const panelRef = useRef<HTMLFormElement>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  useClickOutside(panelRef, onDismiss, true)

  async function submit(): Promise<void> {
    setError(null)
    setSubmitting(true)
    try {
      const tokens = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      await applyTokensAndFetchUser(tokens.access_token, tokens.refresh_token)
      onDismiss()
    } catch (err) {
      setError(mapPasswordError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault()
    void submit()
  }

  const blocked = submitting || !currentPassword || !newPassword

  return (
    <div className="fixed inset-0 z-[902] flex items-center justify-center p-md" style={{ background: 'var(--color-scrim)' }}>
      <form
        ref={panelRef}
        onSubmit={onSubmit}
        className="chat-menu-pop flex w-full max-w-[27rem] flex-col gap-sm rounded-card border border-rule bg-paper p-md shadow-lg"
        aria-modal="true"
        role="dialog"
        aria-label="Change password"
      >
        <h4 className="settings-wrap font-display text-md font-semibold text-ink">Change password</h4>
        <p className="settings-wrap text-sm leading-relaxed text-ink-2">
          Other devices will be signed out. This device stays signed in with a fresh session.
        </p>
        <PasswordField
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
        />
        <PasswordField
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2xs">
          <button type="button" onClick={onDismiss} className={buttonClasses('text', 'sm')}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={blocked}
            className={cn(buttonClasses('accent', 'sm'), blocked && 'pointer-events-none opacity-50')}
          >
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  )
}
