import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailPage } from '@/features/chat/components/pages/ProjectDetailPage'

export const Route = createFileRoute('/_workspace/projects/$projectId')({
  component: ProjectDetailPage,
})
