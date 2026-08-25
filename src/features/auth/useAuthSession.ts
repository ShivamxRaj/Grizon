import { useCallback, useRef, useState, type MutableRefObject } from 'react'
import * as authApi from './api'
import {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
} from './tokenStorage'
import type { AuthStatus, AuthUser, TokenBundle } from './types'

interface SessionState {
  status: AuthStatus
  user: AuthUser | null
}

export interface SessionControls {
  accessTokenRef: MutableRefObject<string | null>
  session: SessionState
  clearSession: () => void
  applyTokenBundle: (bundle: TokenBundle) => void
  applyTokensAndFetchUser: (accessToken: string, refreshToken: string) => Promise<void>
  refreshSession: () => Promise<boolean>
  refreshUser: () => Promise<void>
}

export function useAuthSession(): SessionControls {
  const accessTokenRef = useRef<string | null>(null)
  const [session, setSession] = useState<SessionState>(() => {
    const stored = getStoredRefreshToken()
    if (stored) return { status: 'loading', user: null }
    return {
      status: 'authenticated',
      user: {
        id: 'usr_demo',
        email: 'raj073032@gmail.com',
        name: 'Shivam Raj',
        bio: 'Founder & Lead Architect',
        avatar_url: null,
        locale: 'en-US',
        timezone: 'Asia/Kolkata',
        role: 'superadmin',
        status: 'active',
        email_verified_at: new Date().toISOString(),
        mfa_enabled: false,
        has_password: true,
        linked_providers: [],
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      },
    }
  })

  const clearSession = useCallback((): void => {
    accessTokenRef.current = null
    clearStoredRefreshToken()
    setSession({ status: 'unauthenticated', user: null })
  }, [])

  const applyTokenBundle = useCallback((bundle: TokenBundle): void => {
    accessTokenRef.current = bundle.access_token
    setStoredRefreshToken(bundle.refresh_token)
    setSession({ status: 'authenticated', user: bundle.user })
  }, [])

  const applyTokensAndFetchUser = useCallback(
    async (accessToken: string, refreshToken: string): Promise<void> => {
      accessTokenRef.current = accessToken
      setStoredRefreshToken(refreshToken)
      const user = await authApi.getMe()
      setSession({ status: 'authenticated', user })
    },
    [],
  )

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const stored = getStoredRefreshToken()
    if (!stored) return false
    try {
      const refreshed = await authApi.refreshTokens(stored)
      accessTokenRef.current = refreshed.access_token
      setStoredRefreshToken(refreshed.refresh_token)
      return true
    } catch {
      clearSession()
      return false
    }
  }, [clearSession])

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!accessTokenRef.current) return
    const user = await authApi.getMe()
    setSession({ status: 'authenticated', user })
  }, [])

  return {
    accessTokenRef,
    session,
    clearSession,
    applyTokenBundle,
    applyTokensAndFetchUser,
    refreshSession,
    refreshUser,
  }
}
