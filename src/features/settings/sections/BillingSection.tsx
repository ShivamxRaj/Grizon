import { useEffect, useState, type JSX } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils/cn'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { ZapIcon } from '@/components/ui/icons'
import {
  cancelScheduledPlanChange,
  cancelSubscription,
  fetchPaymentOrders,
  initiateTopup,
  setupDeferredDowngrade,
} from '@/features/billing/api'
import { useCredits } from '@/features/billing/useCredits'
import {
  formatBillingDate,
  formatPaise,
  formatRupees,
  getPeriodEndLabel,
  isFreeSubscription,
  isPaidSubscription,
  PAYMENT_ORDER_TYPE_LABELS,
  paymentOrderStatusTone,
  subscriptionStatusTone,
  topupPackageId,
} from '@/features/billing/paymentUtils'
import type { PaymentOrder, TopupPackage } from '@/features/billing/types'
import { getApiErrorMessage } from '@/lib/api/errors'
import { ROUTE_PRICING } from '@/constants/routes'
import { SettingsGroup, SettingRow } from '../components/primitives/SettingsGroup'
import { DataList, DataRow, RowAction } from '../components/primitives/DataList'
import { UsageMeter } from '../components/primitives/Meters'
import { Banner, StatusPill } from '../components/primitives/Pills'
import { useSettingsConfirm } from '../hooks/useSettingsConfirm'
import { useSettingsModal } from '../useSettingsModal'

const CONSUMPTION_NOTE =
  'Plan credits are spent first. Top-up credits are only used once the plan allowance runs out, and never expire.'

function BillingLoading(): JSX.Element {
  return <p className="py-md text-sm text-muted">Loading billing…</p>
}

function StatusBanners(): JSX.Element | null {
  const { subscription, refreshAll } = useCredits()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!subscription) return null

  const setupDeferred = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const res = await setupDeferredDowngrade()
      window.location.assign(res.redirectUrl)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not start mandate setup'))
      setBusy(false)
    }
  }

  const undoSchedule = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      await cancelScheduledPlanChange()
      await refreshAll()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not cancel scheduled change'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {subscription.status === 'paused' && (
        <Banner tone="warning">
          Your UPI AutoPay mandate is paused. Renewals are on hold until you resume in the PhonePe app.
        </Banner>
      )}
      {subscription.status === 'past_due' && (
        <Banner tone="danger">
          Payment is past due. Update UPI AutoPay in PhonePe or change plan to restore renewals.
        </Banner>
      )}
      {subscription.scheduledPlanId && (
        <Banner
          tone="warning"
          action={
            <div className="flex flex-wrap gap-2xs">
              <button type="button" disabled={busy} onClick={() => void setupDeferred()} className={buttonClasses('accent', 'sm')}>
                Set up new mandate
              </button>
              <button type="button" disabled={busy} onClick={() => void undoSchedule()} className={buttonClasses('outline', 'sm')}>
                Keep current plan
              </button>
            </div>
          }
        >
          Plan change scheduled
          {subscription.scheduledChangeAt ? ` for ${formatBillingDate(subscription.scheduledChangeAt)}` : ''}.
          Complete the new PhonePe mandate before then.
        </Banner>
      )}
      {error && <p className="mb-md text-sm text-danger-ink">{error}</p>}
    </>
  )
}

function PlanGroup(): JSX.Element {
  const navigate = useNavigate()
  const { ask } = useSettingsConfirm()
  const { closeSettings } = useSettingsModal()
  const { subscription, refreshAll } = useCredits()
  const plan = subscription?.planSnapshot
  const cycle = subscription?.billingCycle ?? 'monthly'
  const price = plan ? formatRupees(plan.pricing[cycle]) : '—'
  const period = cycle === 'annual' ? '/ year' : '/ month'

  const confirmCancel = (): void => {
    if (!subscription || isFreeSubscription(subscription)) return
    ask({
      title: `Cancel ${plan?.name ?? 'plan'}?`,
      body: `You keep access until ${formatBillingDate(subscription.currentPeriodEnd)}, then drop to Free. Top-up credits stay in your balance. Your PhonePe mandate will be revoked.`,
      confirmLabel: 'Cancel subscription',
      onConfirm: () => {
        void (async () => {
          await cancelSubscription()
          await refreshAll()
        })()
      },
    })
  }

  const goPricing = (): void => {
    closeSettings()
    void navigate({ to: ROUTE_PRICING })
  }

  return (
    <SettingsGroup label="Plan">
      <SettingRow
        label={plan ? `${plan.name} · ${price} ${period}` : 'No plan loaded'}
        description={subscription ? `${getPeriodEndLabel(subscription)}.` : undefined}
      >
        <div className="flex flex-wrap items-center gap-2xs">
          {subscription && (
            <StatusPill
              tone={subscriptionStatusTone(subscription.status)}
              label={subscription.status.replace('_', ' ')}
            />
          )}
          <RowAction label="Change plan" onClick={goPricing} />
          {isPaidSubscription(subscription) && !subscription?.cancelAtPeriodEnd && (
            <RowAction label="Cancel" tone="danger" onClick={confirmCancel} />
          )}
        </div>
      </SettingRow>
      {subscription?.cancelAtPeriodEnd && (
        <p className="pb-xs text-xs text-warning-ink">
          Cancellation scheduled — access until {formatBillingDate(subscription.currentPeriodEnd)}.
        </p>
      )}
    </SettingsGroup>
  )
}

function CreditsGroup(): JSX.Element {
  const { subscription, balance, usageSummary } = useCredits()
  const included = subscription?.planSnapshot?.credits?.included ?? 0
  const used = usageSummary?.credits_used ?? 0
  const topup = balance?.available ?? 0

  return (
    <SettingsGroup label="Credits">
      <div className="py-xs">
        <p className="mb-2xs text-sm font-medium text-ink">Plan credits</p>
        <UsageMeter used={used} limit={Math.max(included, 1)} unit="credits" />
        {subscription && (
          <p className="mt-3xs text-xs text-muted">{getPeriodEndLabel(subscription)}.</p>
        )}
      </div>
      <SettingRow label="Top-up balance" description={CONSUMPTION_NOTE}>
        <span className="flex items-center gap-2xs font-display text-md font-semibold tabular-nums text-ink">
          <ZapIcon className="h-4 w-4 text-accent-text" />
          {topup.toLocaleString()}
        </span>
      </SettingRow>
    </SettingsGroup>
  )
}

function PackCard({
  pack,
  onBuy,
  busy,
}: {
  pack: TopupPackage
  onBuy: () => void
  busy: boolean
}): JSX.Element {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-3xs rounded-card border border-rule bg-paper p-sm transition-colors duration-short ease-out',
      )}
    >
      <b className="font-display text-md font-semibold tabular-nums text-ink">
        {pack.credits.toLocaleString()} credits
      </b>
      <span className="text-xs text-muted">{formatRupees(pack.price)}</span>
      <button
        type="button"
        disabled={busy}
        onClick={onBuy}
        className={cn(buttonClasses('outline', 'sm'), 'mt-2xs w-full')}
      >
        Buy with PhonePe
      </button>
    </div>
  )
}

function TopUpGroup(): JSX.Element {
  const { ask } = useSettingsConfirm()
  const { subscription } = useCredits()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const credits = subscription?.planSnapshot?.credits
  const enabled = Boolean(credits?.topupEnabled)
  const packs = credits?.topupPackages ?? []

  const buy = (pack: TopupPackage): void => {
    const packageId = topupPackageId(pack)
    ask({
      title: `Buy ${pack.credits.toLocaleString()} credits?`,
      body: `${formatRupees(pack.price)} via PhonePe UPI. Credits are added after payment confirms and never expire.`,
      confirmLabel: `Pay ${formatRupees(pack.price)}`,
      tone: 'accent',
      onConfirm: () => {
        void (async () => {
          setBusy(true)
          setError(null)
          try {
            const res = await initiateTopup(packageId)
            window.location.assign(res.redirectUrl)
          } catch (err) {
            setError(getApiErrorMessage(err, 'Could not start top-up'))
            setBusy(false)
          }
        })()
      },
    })
  }

  if (!enabled) {
    return (
      <SettingsGroup label="Top up">
        <p className="py-xs text-sm text-muted">Credit top-ups are not available on your current plan.</p>
      </SettingsGroup>
    )
  }

  if (packs.length === 0) {
    return (
      <SettingsGroup label="Top up">
        <p className="py-xs text-sm text-muted">No credit packs are configured for this plan yet.</p>
      </SettingsGroup>
    )
  }

  return (
    <SettingsGroup label="Top up">
      {error && <p className="pb-2xs text-sm text-danger-ink">{error}</p>}
      <div className="grid gap-2xs py-xs sm:grid-cols-[repeat(3,minmax(0,1fr))]">
        {packs.map((pack) => (
          <PackCard key={topupPackageId(pack)} pack={pack} busy={busy} onBuy={() => buy(pack)} />
        ))}
      </div>
    </SettingsGroup>
  )
}

function MandateGroup(): JSX.Element | null {
  const { subscription } = useCredits()
  if (!isPaidSubscription(subscription)) return null

  return (
    <SettingsGroup label="Payment method">
      <SettingRow
        label="PhonePe UPI AutoPay"
        description="Recurring charges use your UPI mandate. Manage pause/resume in the PhonePe app."
      >
        <StatusPill
          tone={subscriptionStatusTone(subscription?.status)}
          label={subscription?.status === 'paused' ? 'Paused' : 'Mandate linked'}
        />
      </SettingRow>
    </SettingsGroup>
  )
}

function OrdersGroup(): JSX.Element {
  const [orders, setOrders] = useState<PaymentOrder[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const result = await fetchPaymentOrders({ page: 1, page_size: 10 })
        if (!cancelled) setOrders(result.orders)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load orders'))
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SettingsGroup label="Payment history">
      {error && <p className="py-xs text-sm text-danger-ink">{error}</p>}
      {!error && orders === null && <p className="py-xs text-sm text-muted">Loading orders…</p>}
      {orders && orders.length === 0 && (
        <p className="py-xs text-sm text-muted">No payments yet.</p>
      )}
      {orders && orders.length > 0 && (
        <DataList>
          {orders.map((order) => (
            <DataRow
              key={order.id}
              title={PAYMENT_ORDER_TYPE_LABELS[order.type]}
              meta={`${formatBillingDate(order.createdAt)} · ${formatPaise(order.amountPaise)}${
                order.credits > 0 ? ` · ${order.credits.toLocaleString()} credits` : ''
              }`}
              badge={
                <StatusPill
                  tone={paymentOrderStatusTone(order.status)}
                  label={order.status}
                />
              }
            />
          ))}
        </DataList>
      )}
    </SettingsGroup>
  )
}

export function BillingSection(): JSX.Element {
  const { subscription, isLoading, error, refreshAll } = useCredits()
  const [ready, setReady] = useState(Boolean(subscription))

  useEffect(() => {
    if (subscription) {
      setReady(true)
      return
    }
    void refreshAll().finally(() => setReady(true))
  }, [subscription, refreshAll])

  if (!ready || (isLoading && !subscription)) return <BillingLoading />
  if (error && !subscription) {
    return <p className="py-md text-sm text-danger-ink">{error}</p>
  }

  return (
    <>
      <StatusBanners />
      <PlanGroup />
      <CreditsGroup />
      <TopUpGroup />
      <MandateGroup />
      <OrdersGroup />
    </>
  )
}
