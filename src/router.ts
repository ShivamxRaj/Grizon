import { createRouter } from '@tanstack/react-router'
import type { AuthContextValue } from '@/features/auth/authContext'
import { routeTree } from './routeTree.gen'

const loadingAuth: AuthContextValue = {
  status: 'loading',
  user: null,
  login: async () => undefined,
  register: async () => undefined,
  logout: async () => undefined,
  logoutAll: async () => undefined,
  applyTokenBundle: () => undefined,
  applyTokensAndFetchUser: async () => undefined,
  refreshUser: async () => undefined,
  getAccessToken: () => null,
}

export const router = createRouter({
  routeTree,
  context: {
    auth: loadingAuth,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
