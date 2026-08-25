import { createFileRoute } from '@tanstack/react-router'
import { ConversationView } from '@/features/chat/components/ConversationView'

export const Route = createFileRoute('/_workspace/chat/$chatId')({
  component: ConversationView,
})
