import type { JSX } from 'react'
import { Link } from '@tanstack/react-router'
import { Logo } from '@/components/ui/Logo'
import { ArrowRightIcon } from '@/components/ui/icons'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { ThemeToggle } from '@/features/theme/ThemeToggle'
import { useAuthModal } from '@/features/auth/useAuthModal'
import { ROUTE_CHAT } from '@/constants/routes'

const NAV_LINKS = [
  { label: 'Product', href: '#bento' },
  { label: 'Plans', href: '#plans' },
  { label: 'FAQ', href: '#faq' },
]

export function LandingNav(): JSX.Element {
  const { openAuthModal } = useAuthModal()

  return (
    <nav
      className="landing-nav fixed left-1/2 top-md z-[500] flex max-w-[calc(100vw-2rem)] items-center gap-sm rounded-pill py-[0.45rem] pl-[1.1rem] pr-2 shadow-glass backdrop-blur-[10px]"
      style={{ background: 'var(--glass-fill-strong)', border: '1px solid var(--glass-stroke)' }}
      aria-label="Primary"
    >
      <a href="#top" className="flex items-center gap-2 font-display text-base font-bold text-ink" aria-label="Grizon AI home">
        <Logo className="h-5.5 w-5.5" />
        Grizon
      </a>

      <ul className="mx-1 hidden list-none items-center gap-1 sm:flex">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="whitespace-nowrap rounded-pill px-3 py-2 text-sm font-medium text-muted transition-colors duration-short ease-out hover:bg-accent-soft hover:text-accent-text"
            >
              {link.label}
            </a>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={openAuthModal}
            className="whitespace-nowrap rounded-pill px-3 py-2 text-sm font-medium text-muted transition-colors duration-short ease-out hover:bg-accent-soft hover:text-accent-text"
          >
            Log in
          </button>
        </li>
      </ul>

      <ThemeToggle />

      <Link to={ROUTE_CHAT} className={buttonClasses('accent', 'sm', { shadow: false })}>
        Get started
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </nav>
  )
}
