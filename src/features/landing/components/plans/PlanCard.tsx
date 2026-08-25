import type { JSX } from 'react'
import { Link } from '@tanstack/react-router'
import { CheckIcon } from '@/components/ui/icons'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { cn } from '@/lib/utils/cn'
import { ROUTE_LOGIN } from '@/constants/routes'
import type { Plan } from '../../data/plans'

export function PlanCard({ name, description, price, period, features, ctaLabel, featured, badge }: Plan): JSX.Element {
  return (
    <article
      className={cn(
        // border-color is fully owned by one branch or the other — mixing
        // 'border-rule' in the base string with 'border-accent/35' here
        // would put two border-color utilities on the same element, and
        // Tailwind resolves those by generated-stylesheet order, not by
        // where the class appears in this string.
        'flex h-full min-w-0 flex-col gap-md rounded-card border p-lg',
        featured
          ? 'border-accent/35 bg-paper shadow-md min-[60rem]:-translate-y-2 min-[40rem]:col-span-2 min-[60rem]:col-span-1'
          : 'border-rule bg-paper-2',
      )}
    >
      {badge ? (
        <span className="self-start rounded-pill bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-text">
          {badge}
        </span>
      ) : null}
      <p className="text-lg text-ink">{name}</p>
      <p className="text-sm text-muted">{description}</p>
      <div className="mt-xs flex items-baseline gap-1">
        <b className="font-display text-2xl tracking-[-0.02em] text-ink">{price}</b>
        <span className="text-sm text-muted">{period}</span>
      </div>
      <ul className="mt-xs flex flex-col gap-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-ink-2">
            <CheckIcon className="mt-0.5 h-4 w-4 flex-none text-accent-text" />
            {feature}
          </li>
        ))}
      </ul>
      <Link to={ROUTE_LOGIN} className={cn(buttonClasses(featured ? 'accent' : 'outline'), 'mt-auto w-full')}>
        {ctaLabel}
      </Link>
    </article>
  )
}
