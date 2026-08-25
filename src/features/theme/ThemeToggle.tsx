import type { JSX } from 'react'
import { MoonIcon, SunIcon } from '@/components/ui/icons'
import { useTheme } from './useTheme'

export function ThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="grid h-9 w-9 place-items-center rounded-pill border border-rule bg-paper-2 text-ink-2 transition-colors duration-short ease-out hover:border-accent hover:text-accent-text"
    >
      {theme === 'dark' ? <MoonIcon className="h-4.5 w-4.5" /> : <SunIcon className="h-4.5 w-4.5" />}
    </button>
  )
}
