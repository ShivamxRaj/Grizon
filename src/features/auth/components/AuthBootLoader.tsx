import type { JSX } from 'react'
import { Logo } from '@/components/ui/Logo'
import { Spinner } from './Spinner'

export function AuthBootLoader(): JSX.Element {
  return (
    <div className="grid h-dvh place-items-center bg-paper text-ink" role="status" aria-live="polite" aria-label="Loading">
      <div className="flex flex-col items-center gap-md">
        <Logo className="h-8 w-8" />
        <Spinner className="h-5 w-5 text-accent-text" />
        <p className="text-sm text-ink-2">Loading your session…</p>
      </div>
    </div>
  )
}
