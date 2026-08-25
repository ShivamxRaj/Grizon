import { useCallback, useEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { cn } from '@/lib/utils/cn'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { ROUTE_CHAT, ROUTE_PRICING } from '@/constants/routes'
import { useSettingsModal } from '@/features/settings/useSettingsModal'
import { fetchSubscription, getTopupStatus } from '../api'
import { useCredits } from '../useCredits'
import {
  clearPendingSubscription,
  isFreeSubscription,
  readPendingSubscription,
} from '../paymentUtils'
import '../billing-pages.css'

type CallbackState =
  | 'verifying'
  | 'success_topup'
  | 'success_subscription'
  | 'failed'
  | 'expired'
  | 'timeout'

const TOPUP_MAX_ATTEMPTS = 15
const TOPUP_POLL_INTERVAL_MS = 2000
const SUBSCRIPTION_TIMEOUT_MS = 15000
const SUBSCRIPTION_POLL_INTERVAL_MS = 1500

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function StatusCard({
  title,
  body,
  tone,
  children,
}: {
  title: string
  body: string
  tone: 'accent' | 'success' | 'danger' | 'warning'
  children?: ReactNode
}): JSX.Element {
  const toneClass =
    tone === 'success'
      ? 'border-success/30 bg-success-soft text-success-ink'
      : tone === 'danger'
        ? 'border-danger/30 bg-danger-soft text-danger-ink'
        : tone === 'warning'
          ? 'border-warning/30 bg-warning-soft text-warning-ink'
          : 'border-rule bg-paper-2 text-ink'

  return (
    <div className={cn('rounded-card border p-md', toneClass)}>
      <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
      <p className="mt-2xs text-sm text-ink-2">{body}</p>
      {children && <div className="mt-md flex flex-wrap gap-2xs">{children}</div>}
    </div>
  )
}

function subscriptionSucceeded(
  planId: string | undefined,
  expectedPlanId: string | undefined,
  status: string,
): boolean {
  if (status !== 'active') return false
  if (expectedPlanId) return planId === expectedPlanId
  return true
}

export function PaymentCallbackPage(): JSX.Element {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_workspace/payment/callback' })
  const type = typeof search.type === 'string' ? search.type : 'topup'
  const orderId = typeof search.orderId === 'string' ? search.orderId : ''
  const { refreshBalance, refreshSubscription } = useCredits()
  const { openSettings } = useSettingsModal()

  const [state, setState] = useState<CallbackState>('verifying')
  const [creditsAdded, setCreditsAdded] = useState(0)
  const [planName, setPlanName] = useState('')
  const [progress, setProgress] = useState(0)
  const cancelledRef = useRef(false)

  const finishSuccess = useCallback(
    async (extra?: { credits?: number; plan?: string }): Promise<void> => {
      if (extra?.credits) setCreditsAdded(extra.credits)
      if (extra?.plan) setPlanName(extra.plan)
      if (type === 'subscription') clearPendingSubscription()
      try {
        await Promise.all([refreshBalance(), refreshSubscription()])
      } catch {
        /* non-fatal */
      }
      setState(type === 'topup' ? 'success_topup' : 'success_subscription')
    },
    [refreshBalance, refreshSubscription, type],
  )

  const pollTopup = useCallback(async (): Promise<void> => {
    if (!orderId) {
      setState('failed')
      return
    }
    for (let attempt = 1; attempt <= TOPUP_MAX_ATTEMPTS; attempt += 1) {
      if (cancelledRef.current) return
      setProgress(attempt)
      try {
        const res = await getTopupStatus(orderId)
        if (res.status === 'completed') {
          await finishSuccess({ credits: res.creditsToAdd })
          return
        }
        if (res.status === 'failed') {
          setState('failed')
          return
        }
        if (res.status === 'expired') {
          setState('expired')
          return
        }
      } catch {
        /* keep polling */
      }
      await sleep(TOPUP_POLL_INTERVAL_MS)
    }
    setState('timeout')
  }, [orderId, finishSuccess])

  const pollSubscription = useCallback(async (): Promise<void> => {
    const pending = readPendingSubscription()
    const deadline = Date.now() + SUBSCRIPTION_TIMEOUT_MS
    let ticks = 0
    while (Date.now() < deadline) {
      if (cancelledRef.current) return
      ticks += 1
      setProgress(ticks)
      try {
        const { subscription } = await fetchSubscription()
        const ok = subscriptionSucceeded(
          subscription.planId,
          pending?.planId,
          subscription.status,
        )
        if (ok && !isFreeSubscription(subscription)) {
          await finishSuccess({
            plan: pending?.planName ?? subscription.planSnapshot.name,
          })
          return
        }
      } catch {
        /* keep polling */
      }
      await sleep(SUBSCRIPTION_POLL_INTERVAL_MS)
    }
    setState('timeout')
  }, [finishSuccess])

  useEffect(() => {
    cancelledRef.current = false
    if (type === 'subscription') void pollSubscription()
    else void pollTopup()
    return () => {
      cancelledRef.current = true
    }
  }, [type, pollTopup, pollSubscription])

  const openBilling = (): void => {
    openSettings('billing')
    void navigate({ to: ROUTE_CHAT })
  }

  if (state === 'verifying') {
    return (
      <CallbackShell>
        <StatusCard
          tone="accent"
          title="Confirming payment"
          body={
            type === 'subscription'
              ? 'Waiting for PhonePe to activate your subscription…'
              : `Checking top-up status${orderId ? ` for order ${orderId.slice(0, 8)}…` : '…'}`
          }
        >
          <p className="w-full text-xs text-muted">Attempt {progress || 1}</p>
        </StatusCard>
      </CallbackShell>
    )
  }

  if (state === 'success_topup') {
    return (
      <CallbackShell>
        <StatusCard
          tone="success"
          title="Credits added"
          body={`${creditsAdded.toLocaleString()} credits are in your wallet.`}
        >
          <Link to={ROUTE_CHAT} className={buttonClasses('accent', 'sm')}>
            Back to chat
          </Link>
          <button type="button" onClick={openBilling} className={buttonClasses('outline', 'sm')}>
            View billing
          </button>
        </StatusCard>
      </CallbackShell>
    )
  }

  if (state === 'success_subscription') {
    return (
      <CallbackShell>
        <StatusCard
          tone="success"
          title="Subscription active"
          body={planName ? `You are now on ${planName}.` : 'Your plan is active.'}
        >
          <Link to={ROUTE_CHAT} className={buttonClasses('accent', 'sm')}>
            Back to chat
          </Link>
          <button type="button" onClick={openBilling} className={buttonClasses('outline', 'sm')}>
            View billing
          </button>
        </StatusCard>
      </CallbackShell>
    )
  }

  const failureTitle =
    state === 'expired' ? 'Payment expired' : state === 'timeout' ? 'Still confirming' : 'Payment failed'
  const failureBody =
    state === 'timeout'
      ? 'PhonePe may still be processing. Check billing in a moment or retry.'
      : 'No credits were added. You can try again from pricing or billing.'

  return (
    <CallbackShell>
      <StatusCard tone={state === 'timeout' ? 'warning' : 'danger'} title={failureTitle} body={failureBody}>
        <button
          type="button"
          onClick={() => {
            setState('verifying')
            setProgress(0)
            if (type === 'subscription') void pollSubscription()
            else void pollTopup()
          }}
          className={buttonClasses('accent', 'sm')}
        >
          Retry
        </button>
        <Link to={ROUTE_PRICING} className={buttonClasses('outline', 'sm')}>
          Pricing
        </Link>
        <button type="button" onClick={openBilling} className={buttonClasses('text', 'sm')}>
          Billing
        </button>
      </StatusCard>
    </CallbackShell>
  )
}

function CallbackShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <main className="flex h-full min-w-0 flex-1 flex-col items-center justify-center overflow-x-clip overflow-y-auto">
      <div className="w-full max-w-[28rem] px-[var(--page-gutter)] py-xl">{children}</div>
    </main>
  )
}
