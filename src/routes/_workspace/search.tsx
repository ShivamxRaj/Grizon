import { createFileRoute } from '@tanstack/react-router'
import { SearchPage } from '@/features/chat/components/pages/SearchPage'

export const Route = createFileRoute('/_workspace/search')({
  component: SearchPage,
})
