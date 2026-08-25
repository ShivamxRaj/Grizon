import { useContext } from 'react'
import { SidebarDrawerContext, type SidebarDrawerContextValue } from '../context/sidebarDrawerContext'

export function useSidebarDrawer(): SidebarDrawerContextValue {
  const context = useContext(SidebarDrawerContext)
  if (!context) throw new Error('useSidebarDrawer must be used within a SidebarDrawerProvider')
  return context
}
