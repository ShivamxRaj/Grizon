import type { JSX } from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_appShell/dashboard/')({
  component: DashboardPage,
})

function DashboardPage(): JSX.Element {
  return (
    <section className="pb-2xl">
      <h1 className="text-2xl tracking-[-0.03em] text-ink">Dashboard</h1>
    </section>
  )
}
