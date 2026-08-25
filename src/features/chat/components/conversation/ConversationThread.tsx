import type { JSX, ReactNode } from 'react'
import type { ChatMessage } from '../../types'
import { AssistantTurn } from './AssistantTurn'
import { UserTurn } from './UserTurn'

interface ConversationThreadProps {
  messages: ChatMessage[]
  streamingSlot?: ReactNode
}

export function ConversationThread({
  messages,
  streamingSlot,
}: ConversationThreadProps): JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-lg px-lg pb-sm pt-xl sm:px-5">
      {messages.map((message) =>
        message.role === 'user' ? (
          <UserTurn key={message.id} message={message} />
        ) : (
          <AssistantTurn key={message.id} message={message} />
        ),
      )}
      {streamingSlot}
    </div>
  )
}
