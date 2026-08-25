import type { JSX } from 'react'
import { CheckIcon } from '@/components/ui/icons'

export function AuthSuccessStep({ isExistingUser }: { isExistingUser: boolean }): JSX.Element {
  return (
    <div className="auth-panel flex flex-col items-center py-md text-center">
      <span className="auth-success-check mb-sm grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent-text">
        <CheckIcon className="h-6.5 w-6.5" strokeWidth={2.4} />
      </span>
      <h2 className="font-display text-xl text-ink">{isExistingUser ? 'Welcome back.' : "You're all set."}</h2>
      <p className="mt-1 text-sm text-ink-2">Taking you to Grizon…</p>
    </div>
  )
}
