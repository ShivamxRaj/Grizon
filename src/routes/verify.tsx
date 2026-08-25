import { useEffect, useRef, useState, type JSX } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Logo } from '@/components/ui/Logo'
import { confirmEmailVerify } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { mapAuthErrorMessage } from '@/features/auth/mapAuthErrorMessage'
import '@/features/auth/auth.css'

type VerifySearch = { token?: string }

export const Route = createFileRoute('/verify')({
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: VerifyEmailPage,
})

type VerifyState = 'working' | 'success' | 'error'

/** Dedupe confirm across React Strict Mode double-mount. */
const confirmByToken = new Map<string, Promise<{ email_verified_at: string }>>()

function confirmEmailOnce(token: string): Promise<{ email_verified_at: string }> {
  const existing = confirmByToken.get(token)
  if (existing) return existing
  const pending = confirmEmailVerify(token).catch((error: unknown) => {
    confirmByToken.delete(token)
    throw error
  })
  confirmByToken.set(token, pending)
  return pending
}

function VerifyEmailPage(): JSX.Element {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const { status, refreshUser } = useAuth()
  const [state, setState] = useState<VerifyState>('working')
  const [error, setError] = useState<string | null>(null)
  const statusRef = useRef(status)
  statusRef.current = status

  useEffect(() => {
    let active = true

    async function run(): Promise<void> {
      const trimmed = token?.trim()
      if (!trimmed) {
        if (!active) return
        setState('error')
        setError('Missing verification token.')
        return
      }
      try {
        await confirmEmailOnce(trimmed)
        if (!active) return
        if (statusRef.current === 'authenticated') await refreshUser()
        if (!active) return
        setState('success')
        window.setTimeout(() => {
          void navigate({ to: '/' })
        }, 1200)
      } catch (err) {
        if (!active) return
        setState('error')
        setError(mapAuthErrorMessage(err, 'That verification link is invalid or expired.'))
      }
    }

    void run()
    return () => {
      active = false
    }
  }, [token, refreshUser, navigate])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper p-md">
      <div
        data-open="true"
        className="auth-shell w-full max-w-101 rounded-card border px-lg py-lg shadow-glass"
        style={{ background: 'var(--glass-fill-strong)', borderColor: 'var(--glass-stroke)' }}
      >
        <div className="flex justify-center" aria-hidden="true">
          <Logo className="h-7 w-7" />
        </div>
        <div className="auth-panel mt-sm text-center">
          {state === 'working' ? (
            <>
              <h1 className="font-display text-xl text-ink">Verifying your email…</h1>
              <p className="mt-1 text-sm text-ink-2">Just a moment.</p>
            </>
          ) : null}
          {state === 'success' ? (
            <>
              <h1 className="font-display text-xl text-ink">Email verified</h1>
              <p className="mt-1 text-sm text-ink-2">Taking you to Grizon…</p>
            </>
          ) : null}
          {state === 'error' ? (
            <>
              <h1 className="font-display text-xl text-ink">Couldn’t verify</h1>
              <p className="mt-1 text-sm text-danger">{error}</p>
              <button
                type="button"
                onClick={() => void navigate({ to: '/' })}
                className="mt-md text-sm font-semibold text-accent-text"
              >
                Back to Grizon
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
