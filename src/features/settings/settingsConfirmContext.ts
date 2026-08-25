import { createContext } from 'react'
import type { ReactNode } from 'react'

export interface ConfirmRequest {
  title: string
  /** What actually happens. Always name the consequence — never just "are you sure?". */
  body: ReactNode
  confirmLabel: string
  tone?: 'danger' | 'accent'
  /** When set, the confirm button stays disabled until the user types this exact string. */
  typeToConfirm?: string
  onConfirm: () => void
}

export interface SettingsConfirmValue {
  ask: (request: ConfirmRequest) => void
}

export const SettingsConfirmContext = createContext<SettingsConfirmValue | null>(null)
