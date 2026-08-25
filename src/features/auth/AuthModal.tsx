import { useEffect, useRef, useState, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { Logo } from '@/components/ui/Logo'
import { CloseIcon } from '@/components/ui/icons'
import { STATIC_PRIVACY_URL, STATIC_TERMS_URL } from '@/constants/routes'
import { AuthEmailStep, type EmailContinueResult } from './components/AuthEmailStep'
import { AuthPasswordStep } from './components/AuthPasswordStep'
import { AuthSuccessStep } from './components/AuthSuccessStep'
import { useBodyScrollLock } from './hooks/useBodyScrollLock'
import { useClickOutside } from './hooks/useClickOutside'
import { useDelayedUnmount } from './hooks/useDelayedUnmount'
import './auth.css'

const CLOSE_ANIMATION_MS = 300
const SUCCESS_DISMISS_MS = 900

type AuthStep = 'email' | 'password' | 'success'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  required?: boolean
}

export function AuthModal({ isOpen, onClose, required = false }: AuthModalProps): JSX.Element | null {
  const shouldRender = useDelayedUnmount(isOpen, CLOSE_ANIMATION_MS)
  const shellRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [isExistingUser, setIsExistingUser] = useState(true)

  const canDismiss = !required
  useClickOutside(shellRef, onClose, isOpen && canDismiss)
  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) {
      setStep('email')
      setEmail('')
      setIsExistingUser(true)
    }
  }, [isOpen])

  useEffect(() => {
    if (step !== 'success') return undefined
    const timer = window.setTimeout(() => {
      if (canDismiss) onClose()
    }, SUCCESS_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [step, canDismiss, onClose])

  if (!shouldRender) return null

  function handleContinue(result: EmailContinueResult): void {
    setEmail(result.email)
    setIsExistingUser(result.suggestedAction === 'login')
    setStep('password')
  }

  return createPortal(
    <>
      <div
        className="auth-scrim fixed inset-0 z-[910] backdrop-blur-[2px]"
        style={{ background: 'var(--color-scrim)' }}
        data-open={isOpen}
        aria-hidden="true"
      />

      <div
        className="fixed inset-0 z-[911] flex items-center justify-center overflow-y-auto p-md"
        role="dialog"
        aria-modal="true"
        aria-label="Log in or sign up"
      >
        <div
          ref={shellRef}
          data-open={isOpen}
          className="auth-shell relative m-auto w-full max-w-101 overflow-hidden rounded-card border px-lg pb-md pt-lg backdrop-blur-[10px] shadow-glass"
          style={{ background: 'var(--glass-fill-strong)', borderColor: 'var(--glass-stroke)' }}
        >
          {canDismiss ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-xs top-xs grid h-7 w-7 place-items-center rounded-full text-muted transition-colors duration-short ease-out hover:bg-accent-soft hover:text-accent-text active:scale-95"
            >
              <CloseIcon className="h-3.25 w-3.25" />
            </button>
          ) : null}

          <div className="flex justify-center" aria-hidden="true">
            <Logo className="h-7 w-7" />
          </div>

          {step === 'email' && <AuthEmailStep onContinue={handleContinue} />}
          {step === 'password' && (
            <AuthPasswordStep
              email={email}
              isExistingUser={isExistingUser}
              onBack={() => setStep('email')}
              onSuccess={() => setStep('success')}
            />
          )}
          {step === 'success' && <AuthSuccessStep isExistingUser={isExistingUser} />}

          <p className="mt-md text-center text-xs text-muted">
            By continuing you agree to Grizon&apos;s{' '}
            <a href={STATIC_TERMS_URL} className="text-ink-2 underline decoration-rule underline-offset-2">
              Terms
            </a>{' '}
            and{' '}
            <a href={STATIC_PRIVACY_URL} className="text-ink-2 underline decoration-rule underline-offset-2">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </>,
    document.body,
  )
}
