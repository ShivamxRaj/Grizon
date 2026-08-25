import { createContext } from 'react'

export interface SidebarDrawerContextValue {
  /** Whether the mobile off-canvas sidebar drawer is open. Desktop ignores this. */
  open: boolean
  setOpen: (open: boolean) => void
}

export const SidebarDrawerContext = createContext<SidebarDrawerContextValue | null>(null)
