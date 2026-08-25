import { createContext } from 'react'
import type { AuthStatus, AuthUser, LoginInput, RegisterInput, TokenBundle } from './types'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  applyTokenBundle: (bundle: TokenBundle) => void
  applyTokensAndFetchUser: (accessToken: string, refreshToken: string) => Promise<void>
  refreshUser: () => Promise<void>
  getAccessToken: () => string | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)
