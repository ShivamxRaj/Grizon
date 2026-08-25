import { createContext } from 'react'

export interface AuthModalContextValue {
  openAuthModal: () => void
}

export const AuthModalContext = createContext<AuthModalContextValue | null>(null)
