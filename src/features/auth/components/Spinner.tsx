import type { JSX } from 'react'
import { cn } from '@/lib/utils/cn'

export function Spinner({ className }: { className?: string }): JSX.Element {
  return (
    <span
      className={cn('h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current', className)}
      aria-hidden="true"
    />
  )
}
