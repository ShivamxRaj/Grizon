import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/features/chat/components/pages/ProjectsPage'

export const Route = createFileRoute('/_workspace/projects/')({
  component: ProjectsPage,
})
