import { isBoolean, isNumber, isRecord, isString } from '@/lib/api/guards'
import type {
  AuthSession,
  AuthUser,
  CheckEmailResult,
  LinkedProvider,
  RefreshResult,
  SessionsList,
  SuggestedAction,
  TokenBundle,
  UserRole,
  UserStatus,
} from './types'

const SUGGESTED_ACTIONS: ReadonlySet<string> = new Set(['login', 'login_with_google', 'register'])
const USER_ROLES: ReadonlySet<string> = new Set(['user', 'admin', 'superadmin'])
const USER_STATUSES: ReadonlySet<string> = new Set(['active', 'suspended'])
const DEVICE_TYPES: ReadonlySet<string> = new Set(['desktop', 'mobile', 'tablet', 'unknown'])
const PLATFORMS: ReadonlySet<string> = new Set(['web', 'admin', 'mobile-ios', 'mobile-android'])

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value)
}

function isSuggestedAction(value: unknown): value is SuggestedAction {
  return isString(value) && SUGGESTED_ACTIONS.has(value)
}

function isUserRole(value: unknown): value is UserRole {
  return isString(value) && USER_ROLES.has(value)
}

function isUserStatus(value: unknown): value is UserStatus {
  return isString(value) && USER_STATUSES.has(value)
}

function isLinkedProvider(value: unknown): value is LinkedProvider {
  if (!isRecord(value)) return false
  return value.provider === 'google' && isString(value.provider_email) && isString(value.linked_at)
}

function parseLinkedProviders(value: unknown): LinkedProvider[] | null {
  if (!Array.isArray(value)) return null
  const providers: LinkedProvider[] = []
  for (const item of value) {
    if (!isLinkedProvider(item)) return null
    providers.push(item)
  }
  return providers
}

function hasAuthUserScalars(value: Record<string, unknown>): boolean {
  return (
    isString(value.id) &&
    isString(value.email) &&
    isString(value.name) &&
    isNullableString(value.bio) &&
    isNullableString(value.avatar_url) &&
    isNullableString(value.locale) &&
    isNullableString(value.timezone) &&
    isNullableString(value.email_verified_at) &&
    isNullableString(value.last_login_at) &&
    isBoolean(value.mfa_enabled) &&
    isBoolean(value.has_password) &&
    isString(value.created_at)
  )
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!isRecord(value)) return false
  return (
    isString(value.id) &&
    isString(value.platform) &&
    PLATFORMS.has(value.platform) &&
    isString(value.device_name) &&
    isString(value.device_type) &&
    DEVICE_TYPES.has(value.device_type) &&
    isNullableString(value.os) &&
    isNullableString(value.browser) &&
    isNullableString(value.app_version) &&
    isNullableString(value.ip) &&
    isNullableString(value.city) &&
    isNullableString(value.region) &&
    isNullableString(value.country) &&
    isString(value.issued_at) &&
    isNullableString(value.last_used_at) &&
    isString(value.expires_at) &&
    isBoolean(value.is_current)
  )
}

export function isAuthUser(value: unknown): value is AuthUser {
  if (!isRecord(value)) return false
  if (!hasAuthUserScalars(value)) return false
  if (!isUserRole(value.role) || !isUserStatus(value.status)) return false
  return parseLinkedProviders(value.linked_providers) !== null
}

export function isTokenBundle(value: unknown): value is TokenBundle {
  if (!isRecord(value)) return false
  return (
    isAuthUser(value.user) &&
    isString(value.access_token) &&
    isString(value.refresh_token) &&
    isNumber(value.expires_in)
  )
}

export function isRefreshResult(value: unknown): value is RefreshResult {
  if (!isRecord(value)) return false
  return isString(value.access_token) && isString(value.refresh_token) && isNumber(value.expires_in)
}

export function isCheckEmailResult(value: unknown): value is CheckEmailResult {
  if (!isRecord(value)) return false
  return (
    isBoolean(value.exists) &&
    isBoolean(value.has_password) &&
    isBoolean(value.has_google) &&
    isSuggestedAction(value.suggested_action)
  )
}

export function isSessionsList(value: unknown): value is SessionsList {
  if (!isRecord(value) || !Array.isArray(value.sessions)) return false
  return value.sessions.every(isAuthSession)
}

export function parseAuthUser(value: unknown): AuthUser {
  if (!isAuthUser(value)) throw new Error('Invalid auth user payload from API')
  return value
}

export function parseTokenBundle(value: unknown): TokenBundle {
  if (!isTokenBundle(value)) throw new Error('Invalid token bundle payload from API')
  return value
}

export function parseRefreshResult(value: unknown): RefreshResult {
  if (!isRefreshResult(value)) throw new Error('Invalid refresh payload from API')
  return value
}

export function parseCheckEmailResult(value: unknown): CheckEmailResult {
  if (!isCheckEmailResult(value)) throw new Error('Invalid check-email payload from API')
  return value
}

export function parseSessionsList(value: unknown): SessionsList {
  if (!isSessionsList(value)) throw new Error('Invalid sessions payload from API')
  return value
}

export function readLockedUntil(details: unknown): string | null {
  if (!isRecord(details)) return null
  const lockedUntil = details.locked_until
  return isString(lockedUntil) ? lockedUntil : null
}
