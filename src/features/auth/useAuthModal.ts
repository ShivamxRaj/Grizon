import { useContext } from 'react'
import { AuthModalContext, type AuthModalContextValue } from './authModalContext'

export function useAuthModal(): AuthModalContextValue {
  const context = useContext(AuthModalContext)
  if (!context) throw new Error('useAuthModal must be used within an AuthModalProvider')
  return context
}
