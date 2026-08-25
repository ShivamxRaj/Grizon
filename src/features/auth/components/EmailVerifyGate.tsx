import { useState, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { Logo } from '@/components/ui/Logo'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { cn } from '@/lib/utils/cn'
import { requestEmailVerify } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { mapAuthErrorMessage } from '@/features/auth/mapAuthErrorMessage'
import { Spinner } from '@/features/auth/components/Spinner'
import '@/features/auth/auth.css'

export function EmailVerifyGate(): JSX.Element | null {
  const { status, user, logout, refreshUser } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  if (status !== 'authenticated' || !user || user.email_verified_at) return null

  async function onResend(): Promise<void> {
    setSending(true)
    setError(null)
    setMessage(null)
    try {
      await requestEmailVerify()
      setMessage('Verification email sent. Check your inbox.')
      await refreshUser()
    } catch (err) {
      setError(mapAuthErrorMessage(err, 'Could not resend verification email.'))
    } finally {
      setSending(false)
    }
  }

  return createPortal(
    <>
      <div
        className="auth-scrim fixed inset-0 z-[940] backdrop-blur-[2px]"
        style={{ background: 'var(--color-scrim)' }}
        data-open="true"
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[941] flex items-center justify-center overflow-y-auto p-md" role="dialog" aria-modal="true" aria-label="Verify your email">
        <div
          className="auth-shell relative m-auto w-full max-w-101 overflow-hidden rounded-card border px-lg pb-md pt-lg backdrop-blur-[10px] shadow-glass"
          style={{ background: 'var(--glass-fill-strong)', borderColor: 'var(--glass-stroke)' }}
          data-open="true"
        >
          <div className="flex justify-center" aria-hidden="true">
            <Logo className="h-7 w-7" />
          </div>
          <div className="auth-panel text-center">
            <h2 className="font-display text-xl text-ink">Verify your email</h2>
            <p className="mt-1 text-sm text-ink-2">
              We sent a link to <span className="font-semibold text-ink">{user.email}</span>. Open it to unlock Grizon.
            </p>
            {message ? <p className="mt-2 text-sm text-accent-text">{message}</p> : null}
            {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
            <div className="mt-md flex gap-sm">
              <button
                type="button"
                onClick={() => void logout()}
                className={cn(buttonClasses('outline', 'sm'), 'flex-1')}
              >
                Log out
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => void onResend()}
                className={cn(
                  buttonClasses('outline', 'sm'),
                  'relative flex-1 disabled:pointer-events-none disabled:opacity-70',
                )}
              >
                {sending ? <Spinner className="text-ink" /> : 'Resend email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
