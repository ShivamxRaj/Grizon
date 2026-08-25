import type { JSX } from 'react'
import { Logo } from '@/components/ui/Logo'
import { useAuthModal } from '@/features/auth/useAuthModal'
import { CONTACT_EMAIL, STATIC_DESIGN_STYLE_URL, STATIC_PRIVACY_URL, STATIC_TERMS_URL } from '@/constants/routes'

export function LandingFooter(): JSX.Element {
  const { openAuthModal } = useAuthModal()

  return (
    <footer className="border-t border-rule py-xl pb-2xl">
      <p className="flex items-center gap-2 font-display text-lg font-bold text-ink">
        <Logo className="h-5.5 w-5.5" />
        Grizon
      </p>
      <p className="mt-1 max-w-[46ch] text-sm text-ink-2">One composer. The right agent, every time.</p>
      <div className="mt-md flex flex-wrap items-center gap-md text-sm text-muted">
        <span>© 2026 Grizon AI</span>
        <span className="opacity-50">·</span>
        <a href={STATIC_PRIVACY_URL} className="hover:text-ink-2">
          Privacy Policy
        </a>
        <span className="opacity-50">·</span>
        <a href={STATIC_TERMS_URL} className="hover:text-ink-2">
          Terms of Service
        </a>
        <span className="opacity-50">·</span>
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink-2">
          Contact
        </a>
        <span className="opacity-50">·</span>
        <button type="button" onClick={openAuthModal} className="hover:text-ink-2">
          Log in
        </button>
        <span className="opacity-50">·</span>
        <a href={STATIC_DESIGN_STYLE_URL} className="hover:text-ink-2">
          Design language
        </a>
      </div>
    </footer>
  )
}
