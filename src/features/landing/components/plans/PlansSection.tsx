import type { JSX } from 'react'
import { PageWrap } from '@/components/layout/PageWrap'
import { PLANS } from '../../data/plans'
import { PlanCard } from './PlanCard'

export function PlansSection(): JSX.Element {
  return (
    <section id="plans" className="relative z-[1] border-t border-rule py-2xl pb-3xl">
      <PageWrap>
        <div className="mb-xl max-w-[52ch]">
          <h2 className="text-2xl tracking-[-0.03em] text-ink">Plans</h2>
          <p className="mt-xs text-md text-muted">Start free. Upgrade when Auto isn't enough.</p>
        </div>
        <div className="grid grid-cols-1 items-start gap-md min-[40rem]:grid-cols-2 min-[60rem]:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
      </PageWrap>
    </section>
  )
}
