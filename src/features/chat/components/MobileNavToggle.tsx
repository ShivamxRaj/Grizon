import type { JSX } from 'react'
import { MenuIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'
import { useSidebarDrawer } from '../hooks/useSidebarDrawer'

/* Mobile-only hamburger that opens the off-canvas sidebar drawer. Hidden on md+,
   where the sidebar rail is always in view. */
export function MobileNavToggle({ className }: { className?: string }): JSX.Element {
  const { setOpen } = useSidebarDrawer()

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open navigation"
      className={cn(
        'grid h-10 w-10 flex-none place-items-center rounded-pill border border-rule bg-paper-2 text-ink-2 transition-colors duration-short ease-out hover:border-accent hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] md:hidden',
        className,
      )}
    >
      <MenuIcon className="h-4.5 w-4.5" />
    </button>
  )
}
