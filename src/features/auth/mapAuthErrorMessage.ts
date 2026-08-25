import { isApiError } from '@/lib/api/errors'
import { readLockedUntil } from './guards'

export function mapAuthErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) {
    return error instanceof Error && error.message ? error.message : fallback
  }

  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'Incorrect email or password.'
    case 'EMAIL_TAKEN':
      return 'An account with this email already exists. Try logging in.'
    case 'USER_BANNED':
      return 'This account is unavailable.'
    case 'ACCOUNT_LOCKED':
      return formatLockedMessage(error.details)
    case 'INVALID_EMAIL':
      return 'Enter a valid email address.'
    case 'TOO_MANY_REQUESTS':
    case 'TOO_MANY_REGISTRATIONS_FROM_IP':
      return 'Too many attempts. Please try again later.'
    case 'CAPTCHA_REQUIRED':
      return 'Additional verification is required. Please try again later.'
    case 'EMAIL_NOT_VERIFIED':
      return 'Please verify your email address to continue.'
    case 'INVALID_OR_EXPIRED_TOKEN':
      return 'That link is invalid or has expired. Request a new one.'
    case 'VALIDATION_FAILED':
      return error.message || 'Please check your details and try again.'
    default:
      return error.message || fallback
  }
}

function formatLockedMessage(details: unknown): string {
  const lockedUntil = readLockedUntil(details)
  if (!lockedUntil) return 'Account temporarily locked. Try again later.'
  const date = new Date(lockedUntil)
  if (Number.isNaN(date.getTime())) return 'Account temporarily locked. Try again later.'
  return `Account locked until ${date.toLocaleString()}.`
}
