import type { JSX } from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { NavBar } from '@/components/layout/NavBar'

export const Route = createFileRoute('/_appShell')({
  component: AppShellLayout,
})

function AppShellLayout(): JSX.Element {
  return (
    <div className="min-h-dvh bg-paper text-ink-2">
      <NavBar />
      <main
        className="mx-auto max-w-[1180px] pb-3xl"
        style={{ paddingInline: 'var(--page-gutter)', paddingTop: 'calc(var(--space-3xl) + 2rem)' }}
      >
        <Outlet />
      </main>
    </div>
  )
}
