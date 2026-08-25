import type { JSX } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { AuthBootLoader } from '@/features/auth/components/AuthBootLoader'
import { useAuth } from '@/features/auth/useAuth'
import { router } from './router'

export function AppRouter(): JSX.Element {
  const auth = useAuth()
  if (auth.status === 'loading') {
    return <AuthBootLoader />
  }
  return <RouterProvider router={router} context={{ auth }} />
}
