import { useState, type FormEvent, type JSX } from 'react'
import { checkEmail } from '../api'
import { mapAuthErrorMessage } from '../mapAuthErrorMessage'
import type { SuggestedAction } from '../types'
import { AuthTextField } from './AuthTextField'
import { SubmitButton } from './SubmitButton'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface EmailContinueResult {
  email: string
  suggestedAction: SuggestedAction
}

interface AuthEmailStepProps {
  onContinue: (result: EmailContinueResult) => void
}

export function AuthEmailStep({ onContinue }: AuthEmailStepProps): JSX.Element {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Enter a valid email address.')
      return
    }

    setError('')
    setIsChecking(true)
    try {
      const result = await checkEmail(trimmedEmail)
      if (result.suggested_action === 'login_with_google') {
        setError('This account uses Google sign-in. Email/password is not available yet.')
        return
      }
      onContinue({ email: trimmedEmail, suggestedAction: result.suggested_action })
    } catch (submitError: unknown) {
      setError(mapAuthErrorMessage(submitError, 'Could not verify email. Try again.'))
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="auth-panel">
      <h2 className="mt-xs text-center font-display text-xl text-ink">Welcome to Grizon</h2>
      <p className="mt-1 text-center text-sm text-ink-2">Log in or create an account to keep every thread.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-md">
        <AuthTextField
          label="Email address"
          type="email"
          name="username"
          autoComplete="username"
          placeholder="you@company.com"
          value={email}
          onChange={setEmail}
          error={error}
          autoFocus
        />
        <SubmitButton label="Continue" isLoading={isChecking} />
      </form>
    </div>
  )
}
