import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_appShell/login')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
})
