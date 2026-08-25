import { apiFetch, apiFetchNoContent } from '@/lib/api/client'
import {
  parseAuthUser,
  parseCheckEmailResult,
  parseRefreshResult,
  parseSessionsList,
  parseTokenBundle,
} from './guards'
import type {
  AuthUser,
  ChangePasswordInput,
  CheckEmailResult,
  RefreshResult,
  RegisterInput,
  LoginInput,
  SessionsList,
  TokenBundle,
  UpdateMeInput,
} from './types'

const AUTH_BASE = '/api/v1/auth'

export function checkEmail(email: string): Promise<CheckEmailResult> {
  return apiFetch(`${AUTH_BASE}/check-email`, { body: { email } }, parseCheckEmailResult)
}

export function login(input: LoginInput): Promise<TokenBundle> {
  return apiFetch(`${AUTH_BASE}/login`, { body: input }, parseTokenBundle)
}

export function register(input: RegisterInput): Promise<TokenBundle> {
  return apiFetch(`${AUTH_BASE}/register`, { body: input }, parseTokenBundle)
}

export function refreshTokens(refreshToken: string): Promise<RefreshResult> {
  return apiFetch(
    `${AUTH_BASE}/refresh`,
    { body: { refresh_token: refreshToken }, skipRefresh: true },
    parseRefreshResult,
  )
}

export function getMe(): Promise<AuthUser> {
  return apiFetch(`${AUTH_BASE}/me`, { auth: true, method: 'GET' }, parseAuthUser)
}

export function updateMe(input: UpdateMeInput): Promise<AuthUser> {
  return apiFetch(`${AUTH_BASE}/me`, { auth: true, method: 'PATCH', body: input }, parseAuthUser)
}

export function logout(refreshToken: string): Promise<void> {
  return apiFetchNoContent(`${AUTH_BASE}/logout`, {
    auth: true,
    body: { refresh_token: refreshToken },
    skipRefresh: true,
  })
}

export function logoutAll(): Promise<void> {
  return apiFetchNoContent(`${AUTH_BASE}/logout-all`, {
    auth: true,
    method: 'POST',
    skipRefresh: true,
  })
}

export function listSessions(): Promise<SessionsList> {
  return apiFetch(`${AUTH_BASE}/sessions`, { auth: true, method: 'GET' }, parseSessionsList)
}

export function revokeSession(sessionId: string): Promise<void> {
  return apiFetchNoContent(`${AUTH_BASE}/sessions/${encodeURIComponent(sessionId)}`, {
    auth: true,
    method: 'DELETE',
  })
}

export function changePassword(input: ChangePasswordInput): Promise<RefreshResult> {
  return apiFetch(`${AUTH_BASE}/password/change`, { auth: true, body: input }, parseRefreshResult)
}

export function unlinkGoogle(): Promise<void> {
  return apiFetchNoContent(`${AUTH_BASE}/google/link`, {
    auth: true,
    method: 'DELETE',
  })
}

export function requestEmailVerify(): Promise<void> {
  return apiFetchNoContent(`${AUTH_BASE}/email/verify/request`, {
    auth: true,
    method: 'POST',
  })
}

function parseVerifyConfirm(data: unknown): { email_verified_at: string } {
  if (
    data &&
    typeof data === 'object' &&
    'email_verified_at' in data &&
    typeof (data as { email_verified_at: unknown }).email_verified_at === 'string'
  ) {
    return data as { email_verified_at: string }
  }
  throw new Error('Invalid email verify confirm payload from API')
}

export function confirmEmailVerify(token: string): Promise<{ email_verified_at: string }> {
  return apiFetch(`${AUTH_BASE}/email/verify/confirm`, { body: { token } }, parseVerifyConfirm)
}
