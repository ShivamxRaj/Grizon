import type { JSX } from 'react'
import { ThemeToggle } from '@/features/theme/ThemeToggle'

export function NavBar(): JSX.Element {
  return (
    <nav
      className="fixed left-1/2 top-md z-40 flex -translate-x-1/2 items-center gap-sm rounded-pill py-2 pl-5 pr-2 shadow-glass backdrop-blur-[10px]"
      style={{ background: 'var(--glass-fill-strong)', border: '1px solid var(--glass-stroke)' }}
    >
      <span className="flex items-center gap-2 font-display text-base font-bold text-ink">
        <img src="/logo.svg" alt="" className="h-5.5 w-5.5" />
        Grizon
      </span>
      <ThemeToggle />
    </nav>
  )
}
