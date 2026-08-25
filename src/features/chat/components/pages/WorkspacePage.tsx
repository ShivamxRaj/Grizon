import type { JSX, ReactNode } from 'react'
import { MobileNavToggle } from '../MobileNavToggle'

/* Shared in-app page frame for /search, /projects and /drive —
 * one content width, full available height, solid paper fill.
 */

interface WorkspacePageProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export function WorkspacePage({ title, subtitle, actions, children }: WorkspacePageProps): JSX.Element {
  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-paper">
      <div className="mx-auto flex min-h-full w-full max-w-[1100px] flex-col gap-lg px-[var(--page-gutter)] pb-3xl pt-xl">
        <MobileNavToggle />
        <PageHeader title={title} subtitle={subtitle} actions={actions} />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </main>
  )
}

function PageHeader({
  title,
  subtitle,
  actions,
}: Omit<WorkspacePageProps, 'children'>): JSX.Element {
  return (
    <header className="flex flex-none flex-wrap items-end justify-between gap-md">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">
          {title}
        </h1>
        {subtitle ? <p className="mt-2xs max-w-[52ch] text-sm text-ink-2">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-none items-center gap-2xs">{actions}</div> : null}
    </header>
  )
}
