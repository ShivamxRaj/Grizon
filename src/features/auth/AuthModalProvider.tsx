import { useCallback, useEffect, useState, type JSX, type ReactNode } from 'react'
import { AuthModal } from './AuthModal'
import { AuthModalContext } from './authModalContext'
import { useAuth } from './useAuth'

interface AuthModalProviderProps {
  children: ReactNode
  /** When true, opens a non-dismissible modal whenever the user is unauthenticated. */
  requireAuth?: boolean
}

export function AuthModalProvider({ children, requireAuth = false }: AuthModalProviderProps): JSX.Element {
  const { status } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const openAuthModal = useCallback(() => setIsOpen(true), [])
  const closeAuthModal = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!requireAuth) return
    if (status === 'unauthenticated') {
      setIsOpen(true)
    }
  }, [requireAuth, status])

  const requiredOpen = requireAuth && status === 'unauthenticated'
  const modalOpen = requiredOpen || isOpen

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      {children}
      <AuthModal isOpen={modalOpen} onClose={closeAuthModal} required={requiredOpen} />
    </AuthModalContext.Provider>
  )
}
