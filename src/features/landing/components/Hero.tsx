import type { JSX } from 'react'
import { Link } from '@tanstack/react-router'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { useAuthModal } from '@/features/auth/useAuthModal'
import { ROUTE_CHAT } from '@/constants/routes'

export function Hero(): JSX.Element {
  const { openAuthModal } = useAuthModal()

  return (
    <header className="pb-lg pt-[calc(64px+var(--space-2xl))] text-center">
      <h1 className="mx-auto max-w-[18ch] text-[clamp(2.1rem,4.4vw,3.1rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-ink">
        Ask anything. Get the{' '}
        <em className="relative not-italic text-accent-text after:absolute after:inset-x-0 after:bottom-[0.06em] after:h-[0.09em] after:rounded-sm after:bg-accent after:opacity-50 after:content-['']">
          right agent
        </em>
        .
      </h1>
      <p className="mx-auto mt-md max-w-[46ch] text-md text-ink-2">
        One composer, a handful of specialised agents, and everywhere you left off — kept together instead of
        scattered across tabs.
      </p>
      <div className="mt-lg flex flex-wrap items-center justify-center gap-sm">
        <Link to={ROUTE_CHAT} className={buttonClasses('accent', 'md')}>
          Get started
        </Link>
        <button type="button" onClick={openAuthModal} className={buttonClasses('outline', 'md')}>
          Log in
        </button>
      </div>
    </header>
  )
}
