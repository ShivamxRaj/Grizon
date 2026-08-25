import type { JSX } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChatMainShell } from '@/features/chat/components/ChatMainShell'
import { EmptyChatState } from '@/features/chat/components/EmptyChatState'

export const Route = createFileRoute('/_workspace/')({
  component: HomeChatPage,
})

function HomeChatPage(): JSX.Element {
  return (
    <ChatMainShell>
      <EmptyChatState />
    </ChatMainShell>
  )
}
