import type { JSX } from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ChatMainShell } from '@/features/chat/components/ChatMainShell'

export const Route = createFileRoute('/_workspace/chat')({
  component: ChatLayout,
})

function ChatLayout(): JSX.Element {
  return (
    <ChatMainShell>
      <Outlet />
    </ChatMainShell>
  )
}
