export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type SuggestedAction = 'login' | 'login_with_google' | 'register'

export type UserRole = 'user' | 'admin' | 'superadmin'

export type UserStatus = 'active' | 'suspended'

export interface LinkedProvider {
  provider: 'google'
  provider_email: string
  linked_at: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  bio: string | null
  avatar_url: string | null
  locale: string | null
  timezone: string | null
  role: UserRole
  status: UserStatus
  email_verified_at: string | null
  mfa_enabled: boolean
  has_password: boolean
  linked_providers: LinkedProvider[]
  created_at: string
  last_login_at: string | null
}

export interface TokenBundle {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface RefreshResult {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface AuthSession {
  id: string
  platform: 'web' | 'admin' | 'mobile-ios' | 'mobile-android'
  device_name: string
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  os: string | null
  browser: string | null
  app_version: string | null
  ip: string | null
  city: string | null
  region: string | null
  country: string | null
  issued_at: string
  last_used_at: string | null
  expires_at: string
  is_current: boolean
}

export interface SessionsList {
  sessions: AuthSession[]
}

export interface ChangePasswordInput {
  current_password: string
  new_password: string
}

export interface UpdateMeInput {
  name?: string
  bio?: string | null
  avatar_url?: string | null
  locale?: string | null
  timezone?: string | null
}

export interface CheckEmailResult {
  exists: boolean
  has_password: boolean
  has_google: boolean
  suggested_action: SuggestedAction
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  bio?: string
  locale?: string
  timezone?: string
}
