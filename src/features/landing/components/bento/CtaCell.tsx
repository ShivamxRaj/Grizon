import type { JSX } from 'react'
import { Link } from '@tanstack/react-router'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { ROUTE_CHAT } from '@/constants/routes'
import { BentoCell } from './BentoCell'

export function CtaCell({ index }: { index: number }): JSX.Element {
  return (
    <BentoCell index={index} span="2x1" tone="cta">
      <h2 className="max-w-[24ch] text-lg text-ink">Create a free account to keep every thread.</h2>
      <Link to={ROUTE_CHAT} className={buttonClasses('accent')}>
        Get started
      </Link>
    </BentoCell>
  )
}
