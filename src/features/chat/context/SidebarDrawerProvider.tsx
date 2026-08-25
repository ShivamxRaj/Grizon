import { useCallback, useMemo, useState, type JSX, type ReactNode } from 'react'
import { SidebarDrawerContext, type SidebarDrawerContextValue } from './sidebarDrawerContext'

export function SidebarDrawerProvider({ children }: { children: ReactNode }): JSX.Element {
  const [open, setOpen] = useState(false)

  const setOpenStable = useCallback((next: boolean) => setOpen(next), [])
  const value = useMemo<SidebarDrawerContextValue>(() => ({ open, setOpen: setOpenStable }), [open, setOpenStable])

  return <SidebarDrawerContext.Provider value={value}>{children}</SidebarDrawerContext.Provider>
}
