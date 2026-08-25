import { useEffect, useState, type JSX } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils/cn'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { ROUTE_CHAT } from '@/constants/routes'
import { useSettingsModal } from '@/features/settings/useSettingsModal'
import { StatusPill } from '@/features/settings/components/primitives/Pills'
import { fetchPlans, fetchSubscriptionContact } from '../api'
import { runPlanCheckout, redirectToPhonePe, type CheckoutMode } from '../checkout'
import { useCredits } from '../useCredits'
import { formatRupees, isFreeSubscription } from '../paymentUtils'
import type { BillingCycle, Plan } from '../types'
import { PhoneCollectModal } from './PhoneCollectModal'
import '../pricing.css'

const PLAN_FEATURE_HIGHLIGHTS: Record<string, string[]> = {
  free: [
    '⚖️ Supreme & High Court Search',
    '📜 IPC ➔ BNS Code Switcher',
    '💼 Legal Drafting Workbench',
  ],
  pro: [
    '⚖️ SC & HC Precedent Research',
    '🏛️ MIRA 6-Check & Citator Signals',
    '🛡️ Presidio PII Shield & Ratio Drawer',
    '🗣️ Sarvam AI Multilingual Dictation',
  ],
  enterprise: [
    '⚡ All Advocate Pro Features',
    '🏛️ 15,000+ Court CNR Tracking',
    '📄 Clause Risk Audit & OCR',
    '👥 Multi-Seat Law Firm Vaults',
    '📞 Dedicated Legal Support SLA',
  ],
}

function annualSavingPercent(plan: Plan): number {
  if (!plan.pricing.monthly || !plan.pricing.annual) return 0
  const annualized = plan.pricing.monthly * 12
  return Math.round(((annualized - plan.pricing.annual) / annualized) * 100)
}

function planActionLabel(
  plan: Plan,
  isCurrent: boolean,
  hasPaid: boolean,
  livePrice: number,
  cycle: BillingCycle,
  busy: boolean,
): string {
  if (isCurrent) return 'Current plan'
  if (busy) return 'Working…'
  if (plan.slug === 'free') return hasPaid ? 'Switch to Free' : 'Current plan'
  if (!hasPaid) return `Join ${plan.name}`
  const toPrice = plan.pricing[cycle]
  if (toPrice > livePrice) return `Upgrade to ${plan.name}`
  if (toPrice < livePrice) return `Downgrade to ${plan.name}`
  return `Switch to ${plan.name}`
}

function enabledFeatureLabels(plan: Plan): string[] {
  return PLAN_FEATURE_HIGHLIGHTS[plan.slug] || [
    '⚖️ Supreme & High Court Search',
    '📜 IPC ➔ BNS Code Switcher',
  ]
}

function CycleToggle({
  cycle,
  onChange,
}: {
  cycle: BillingCycle
  onChange: (cycle: BillingCycle) => void
}): JSX.Element {
  return (
    <div className="inline-flex items-center gap-3xs rounded-pill border border-rule bg-paper-2 p-3xs">
      {(['monthly', 'annual'] as BillingCycle[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-pill px-sm py-2xs text-xs font-semibold capitalize transition-colors duration-short ease-out',
            cycle === option ? 'bg-accent-deep text-accent-ink' : 'text-muted hover:text-ink',
          )}
        >
          {option}
          {option === 'annual' && (
            <span className="ml-2xs rounded-pill bg-success-soft px-2xs py-px text-[0.65rem] text-success-ink">
              Save
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function PlanCard(props: {
  plan: Plan
  cycle: BillingCycle
  isCurrent: boolean
  hasPaid: boolean
  livePrice: number
  busy: boolean
  featured: boolean
  onSelect: () => void
}): JSX.Element {
  const { plan, cycle, isCurrent, hasPaid, livePrice, busy, featured, onSelect } = props
  const saving = annualSavingPercent(plan)
  const label = planActionLabel(plan, isCurrent, hasPaid, livePrice, cycle, busy)
  const isFree = plan.slug === 'free'
  const price = isFree ? '₹0' : formatRupees(plan.pricing[cycle])
  const features = enabledFeatureLabels(plan)
  const agents = plan.agentAccess?.length ?? 0

  return (
    <article
      role="listitem"
      data-featured={featured ? 'true' : 'false'}
      className="pricing-card flex flex-col gap-sm rounded-card border border-rule bg-paper p-md"
    >
      <header className="min-h-22">
        <div className="flex items-center justify-between gap-2xs">
          <h2 className="font-display text-xl font-semibold text-ink">{plan.name}</h2>
          {featured && <StatusPill tone="success" label="Popular" />}
          {isCurrent && <StatusPill tone="neutral" label="Yours" />}
        </div>
        <p className="mt-2xs font-display text-2xl font-semibold tabular-nums text-ink">
          {price}
          {!isFree && (
            <span className="ml-2xs text-sm font-medium text-muted">
              / {cycle === 'annual' ? 'year' : 'month'}
            </span>
          )}
          {isFree && <span className="ml-2xs text-sm font-medium text-muted">forever</span>}
        </p>
        {cycle === 'annual' && !isFree && saving > 0 && (
          <p className="mt-3xs text-xs text-success-ink">Save ~{saving}% vs monthly</p>
        )}
      </header>

      <ul className="flex flex-1 flex-col gap-3xs text-sm text-ink-2">
        <li className="tabular-nums">{plan.credits.included.toLocaleString()} credits / period</li>
        <li>
          {plan.credits.topupEnabled ? 'Top-ups enabled' : 'No top-ups'}
          {plan.credits.rollover ? ' · rollover' : ''}
        </li>
        {agents > 0 && <li>{agents} agents</li>}
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <button
        type="button"
        disabled={isCurrent || busy || (isFree && !hasPaid)}
        onClick={onSelect}
        className={cn(
          buttonClasses(isCurrent || (isFree && !hasPaid) ? 'outline' : 'accent', 'md'),
          'pricing-cta mt-auto w-full',
        )}
        data-state={busy ? 'loading' : undefined}
      >
        {label}
      </button>
    </article>
  )
}

export function PricingPage(): JSX.Element {
  const navigate = useNavigate()
  const { openSettings } = useSettingsModal()
  const { subscription, refreshSubscription } = useCredits()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [modalPlan, setModalPlan] = useState<Plan | null>(null)
  const [modalMode, setModalMode] = useState<CheckoutMode>('purchase')
  const [savedMobile, setSavedMobile] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const hasPaid = !isFreeSubscription(subscription)
  const currentPlanId = subscription?.planId ?? null
  const livePlan = plans.find((plan) => plan.id === subscription?.planId)
  const fromCycle: BillingCycle = subscription?.billingCycle === 'annual' ? 'annual' : 'monthly'
  const livePrice = livePlan ? livePlan.pricing[fromCycle] : 0
  const featuredSlug = plans.some((plan) => plan.slug === 'pro') ? 'pro' : null

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const [plansResult, contact] = await Promise.all([
          fetchPlans(),
          fetchSubscriptionContact().catch(() => ({
            mobileNumber: null as string | null,
            verifiedAt: null as string | null,
          })),
        ])
        if (cancelled) return
        const publicPlans = plansResult.plans.filter((plan) => plan.isPublic && plan.status === 'active')
        publicPlans.sort((a, b) => a.pricing.monthly - b.pricing.monthly)
        setPlans(publicPlans)
        setSavedMobile(contact.mobileNumber)
        await refreshSubscription()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [refreshSubscription])

  const openMobileModal = (plan: Plan, mode: CheckoutMode): void => {
    setModalMode(mode)
    setModalPlan(plan)
    setProcessingId(null)
  }

  const selectPlan = async (plan: Plan): Promise<void> => {
    setError(null)
    setProcessingId(plan.id)
    const mode: CheckoutMode = hasPaid ? 'change' : 'purchase'
    if (plan.slug === 'free' && !hasPaid) {
      setProcessingId(null)
      return
    }
    if (!savedMobile) {
      openMobileModal(plan, mode)
      return
    }
    const result = await runPlanCheckout({
      plan,
      billingCycle: cycle,
      mode,
      mobileNumber: savedMobile,
    })
    if (result.kind === 'redirect' && result.redirectUrl) {
      redirectToPhonePe(result.redirectUrl)
      return
    }
    if (result.kind === 'scheduled') {
      openSettings('billing')
      void navigate({ to: ROUTE_CHAT })
      return
    }
    if (result.kind === 'error') {
      setError(result.error)
      setProcessingId(null)
    }
  }

  return (
    <main className="pricing-page flex h-full min-w-0 flex-1 flex-col overflow-x-clip overflow-y-auto">
      {modalPlan && (
        <PhoneCollectModal
          plan={modalPlan}
          billingCycle={cycle}
          mode={modalMode}
          onClose={() => setModalPlan(null)}
          onSaved={(mobileNumber) => setSavedMobile(mobileNumber)}
        />
      )}
      <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg px-[var(--page-gutter)] pb-3xl pt-xl">
        <Link to={ROUTE_CHAT} className={cn(buttonClasses('outline', 'sm'), 'w-fit')}>
          Back to chat
        </Link>
        <header className="max-w-[40rem]">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-ink text-pretty">
            Choose your plan
          </h1>
          <p className="mt-2xs max-w-[42ch] text-sm text-ink-2 text-pretty">
            PhonePe UPI AutoPay — no card stored. Scroll the plans, then continue when you are ready.
          </p>
          <div className="mt-md">
            <CycleToggle cycle={cycle} onChange={setCycle} />
          </div>
          {savedMobile && (
            <p className="mt-2xs text-xs text-muted">
              PhonePe contact on file: +91 {savedMobile}
            </p>
          )}
        </header>
        {error && <p className="text-sm text-danger-ink">{error}</p>}
        {loading && <p className="py-xl text-sm text-muted">Loading plans…</p>}
        {!loading && plans.length === 0 && (
          <p className="py-xl text-sm text-muted">No plans available right now.</p>
        )}
        {!loading && plans.length > 0 && (
          <div className="pricing-track" role="list">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                cycle={cycle}
                isCurrent={plan.id === currentPlanId}
                hasPaid={hasPaid}
                livePrice={livePrice}
                busy={processingId === plan.id}
                featured={plan.slug === featuredSlug}
                onSelect={() => void selectPlan(plan)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
