import { createFileRoute } from '@tanstack/react-router'
import { EmptyChatState } from '@/features/chat/components/EmptyChatState'

export const Route = createFileRoute('/_workspace/chat/')({
  component: EmptyChatState,
})
