import { useCallback, useEffect, useMemo, type JSX, type ReactNode } from 'react'
import { configureApiAuth } from '@/lib/api/client'
import * as authApi from './api'
import { AuthContext, type AuthContextValue } from './authContext'
import { getStoredRefreshToken } from './tokenStorage'
import type { LoginInput, RegisterInput } from './types'
import { useAuthSession, type SessionControls } from './useAuthSession'

function getClientLocale(): string | undefined {
  try {
    return navigator.language || undefined
  } catch {
    return undefined
  }
}

function getClientTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

function useAuthBootstrap(session: SessionControls): void {
  const { applyTokensAndFetchUser, clearSession } = session

  useEffect(() => {
    let cancelled = false

    async function bootstrap(): Promise<void> {
      const stored = getStoredRefreshToken()
      if (!stored) {
        return
      }
      try {
        const refreshed = await authApi.refreshTokens(stored)
        if (cancelled) return
        await applyTokensAndFetchUser(refreshed.access_token, refreshed.refresh_token)
      } catch {
        if (!cancelled) clearSession()
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [applyTokensAndFetchUser, clearSession])
}

function useAuthActions(session: SessionControls): Pick<
  AuthContextValue,
  'login' | 'register' | 'logout' | 'logoutAll'
> {
  const { accessTokenRef, applyTokenBundle, clearSession } = session

  const login = useCallback(
    async (input: LoginInput): Promise<void> => {
      applyTokenBundle(await authApi.login(input))
    },
    [applyTokenBundle],
  )

  const register = useCallback(
    async (input: RegisterInput): Promise<void> => {
      applyTokenBundle(
        await authApi.register({
          ...input,
          locale: input.locale ?? getClientLocale(),
          timezone: input.timezone ?? getClientTimezone(),
        }),
      )
    },
    [applyTokenBundle],
  )

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = getStoredRefreshToken()
    try {
      if (refreshToken && accessTokenRef.current) await authApi.logout(refreshToken)
    } finally {
      clearSession()
    }
  }, [accessTokenRef, clearSession])

  const logoutAll = useCallback(async (): Promise<void> => {
    try {
      if (accessTokenRef.current) await authApi.logoutAll()
    } finally {
      clearSession()
    }
  }, [accessTokenRef, clearSession])

  return { login, register, logout, logoutAll }
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const session = useAuthSession()
  const actions = useAuthActions(session)

  useEffect(() => {
    configureApiAuth({
      getAccessToken: () => session.accessTokenRef.current,
      refreshSession: session.refreshSession,
      onSessionCleared: session.clearSession,
    })
  }, [session.accessTokenRef, session.clearSession, session.refreshSession])

  useAuthBootstrap(session)

  const value = useMemo<AuthContextValue>(
    () => ({
      status: session.session.status,
      user: session.session.user,
      ...actions,
      applyTokenBundle: session.applyTokenBundle,
      applyTokensAndFetchUser: session.applyTokensAndFetchUser,
      refreshUser: session.refreshUser,
      getAccessToken: () => session.accessTokenRef.current,
    }),
    [
      session.session.status,
      session.session.user,
      actions,
      session.applyTokenBundle,
      session.applyTokensAndFetchUser,
      session.refreshUser,
      session.accessTokenRef,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
