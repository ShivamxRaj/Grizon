import type { JSX, ReactNode } from 'react'
import { CanvasToggleButton } from './canvas/CanvasToggleButton'
import { MobileNavToggle } from './MobileNavToggle'

export function ChatMainShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-none items-center justify-end gap-sm p-md">
        <MobileNavToggle className="mr-auto" />
        <CanvasToggleButton />
      </div>
      {children}
    </main>
  )
}
