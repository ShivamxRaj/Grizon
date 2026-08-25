import { createFileRoute } from '@tanstack/react-router'
import { DrivePage } from '@/features/chat/components/pages/DrivePage'

export const Route = createFileRoute('/_workspace/drive')({
  component: DrivePage,
})
