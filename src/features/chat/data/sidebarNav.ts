import type { JSX, SVGProps } from 'react'
import { NewChatIcon, SearchIcon, FolderIcon, LayersIcon } from '@/components/ui/icons'

export interface SidebarNavItem {
  id: string
  label: string
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  to: string
}

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'new-chat', label: 'New chat', icon: NewChatIcon, to: '/chat' },
  { id: 'search', label: 'Search chats', icon: SearchIcon, to: '/search' },
  { id: 'projects', label: 'Projects', icon: FolderIcon, to: '/projects' },
  { id: 'drive', label: 'Drive', icon: LayersIcon, to: '/drive' },
]
