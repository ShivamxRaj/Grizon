import { useState, type FormEvent, type JSX } from 'react'
import { ChevronLeftIcon, EyeIcon } from '@/components/ui/icons'
import { useAuth } from '../useAuth'
import { mapAuthErrorMessage } from '../mapAuthErrorMessage'
import { AuthTextField } from './AuthTextField'
import { SubmitButton } from './SubmitButton'

const MIN_PASSWORD_LENGTH = 10

interface PasswordValidation {
  passwordError: string
  confirmError: string
}

function hasLetterAndNumber(password: string): boolean {
  return /[A-Za-z]/.test(password) && /\d/.test(password)
}

function validateRegisterFields(password: string, confirmPassword: string): PasswordValidation {
  const passwordError = !hasLetterAndNumber(password) || password.length < MIN_PASSWORD_LENGTH
    ? `Use at least ${MIN_PASSWORD_LENGTH} characters with a letter and a number.`
    : ''
  const confirmError = confirmPassword !== password ? "Passwords don't match." : ''
  return { passwordError, confirmError }
}

function validateLoginPassword(password: string): string {
  return password.length < 1 ? 'Enter your password.' : ''
}

interface AuthPasswordStepProps {
  email: string
  isExistingUser: boolean
  onBack: () => void
  onSuccess: () => void
}

export function AuthPasswordStep({
  email,
  isExistingUser,
  onBack,
  onSuccess,
}: AuthPasswordStepProps): JSX.Element {
  const { login, register } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitLogin(): Promise<void> {
    const nextPasswordError = validateLoginPassword(password)
    setPasswordError(nextPasswordError)
    setConfirmError('')
    if (nextPasswordError) return
    setIsSubmitting(true)
    setFormError('')
    try {
      await login({ email, password })
      onSuccess()
    } catch (error: unknown) {
      setFormError(mapAuthErrorMessage(error, 'Could not log in. Try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitRegister(): Promise<void> {
    const validation = validateRegisterFields(password, confirmPassword)
    setPasswordError(validation.passwordError)
    setConfirmError(validation.confirmError)
    if (validation.passwordError || validation.confirmError) return
    setIsSubmitting(true)
    setFormError('')
    try {
      await register({ email, password })
      onSuccess()
    } catch (error: unknown) {
      setFormError(mapAuthErrorMessage(error, 'Could not create account. Try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    void (isExistingUser ? submitLogin() : submitRegister())
  }

  return (
    <div className="auth-panel">
      <button
        type="button"
        onClick={onBack}
        className="mb-sm inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-muted transition-colors duration-short ease-out hover:text-accent-text"
      >
        <ChevronLeftIcon className="h-3.25 w-3.25 flex-none" />
        <span className="min-w-0 truncate">{email}</span>
      </button>

      <h2 className="text-center font-display text-xl text-ink">{isExistingUser ? 'Welcome back' : 'Create your account'}</h2>
      <p className="mt-1 text-center text-sm text-ink-2">
        {isExistingUser ? 'Enter your password to continue.' : 'Choose a password to finish signing up.'}
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={email}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />

        <AuthTextField
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete={isExistingUser ? 'current-password' : 'new-password'}
          value={password}
          onChange={setPassword}
          error={passwordError}
          autoFocus
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-1 top-1/2 grid h-7.5 w-7.5 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors duration-short ease-out hover:bg-paper-3 hover:text-ink"
            >
              <EyeIcon className="h-4.25 w-4.25" />
            </button>
          }
        />

        {!isExistingUser && (
          <AuthTextField
            label="Confirm password"
            name="new-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={confirmError}
          />
        )}

        {formError ? <p className="mt-2 text-sm text-danger">{formError}</p> : null}

        <SubmitButton label={isExistingUser ? 'Log in' : 'Create account'} isLoading={isSubmitting} />
      </form>
    </div>
  )
}
