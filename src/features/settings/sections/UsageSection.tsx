import { useEffect, useState, type JSX } from 'react'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { AlertTriangleIcon } from '@/components/ui/icons'
import {
  fetchUsageHistory,
  fetchUsageRateLimit,
} from '@/features/billing/api'
import { useCredits } from '@/features/billing/useCredits'
import {
  formatBillingDate,
  getPeriodEndLabel,
} from '@/features/billing/paymentUtils'
import type {
  RateLimitWindowKey,
  UsageHistoryPoint,
  UsageRateLimit,
} from '@/features/billing/types'
import { getApiErrorMessage } from '@/lib/api/errors'
import { SettingsGroup } from '../components/primitives/SettingsGroup'
import { UsageMeter, MiniBarChart, RateLimitRow } from '../components/primitives/Meters'
import { Banner } from '../components/primitives/Pills'
import { useSettingsModal } from '../useSettingsModal'

const NEAR_LIMIT_PERCENT = 80
const HISTORY_DAYS = 30
const WINDOW_LABELS: Record<RateLimitWindowKey, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

function formatShortDay(isoDay: string): string {
  const date = new Date(`${isoDay}T00:00:00`)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function UsageLoading(): JSX.Element {
  return <p className="py-md text-sm text-muted">Loading usage…</p>
}

function UsageError({ message }: { message: string }): JSX.Element {
  return <p className="py-md text-sm text-danger-ink">{message}</p>
}

function UsageBanner(): JSX.Element | null {
  const { openSettings } = useSettingsModal()
  const { usageSummary, subscription, balance } = useCredits()
  const included = subscription?.planSnapshot.credits.included ?? 0
  const used = usageSummary?.credits_used ?? 0
  const limit = Math.max(included, 1)
  const percent = Math.round((used / limit) * 100)
  if (!usageSummary || percent < NEAR_LIMIT_PERCENT) return null

  const exhausted = percent >= 100
  const reserve = balance?.available ?? 0
  const action = (
    <button type="button" onClick={() => openSettings('billing')} className={buttonClasses('accent', 'sm')}>
      Top up credits
    </button>
  )

  return (
    <Banner tone={exhausted ? 'danger' : 'warning'} icon={AlertTriangleIcon} action={action}>
      {exhausted
        ? `Plan credits for this period are spent.${reserve > 0 ? ` ${reserve.toLocaleString()} top-up credits remain.` : ' Top up or upgrade to keep messaging.'}`
        : `You have used ${percent}% of this period's plan credits (${used.toLocaleString()} of ${included.toLocaleString()}).`}
    </Banner>
  )
}

function ThisPeriodGroup(): JSX.Element {
  const { usageSummary, subscription, balance } = useCredits()
  const included = subscription?.planSnapshot.credits.included ?? 0
  const used = usageSummary?.credits_used ?? 0
  const reserve = balance?.available ?? 0
  const periodNote = subscription
    ? getPeriodEndLabel(subscription)
    : usageSummary
      ? `Period ${formatBillingDate(usageSummary.periodStart)} – ${formatBillingDate(usageSummary.periodEnd)}`
      : '—'

  return (
    <SettingsGroup label="This period">
      <div className="py-xs">
        <UsageMeter used={used} limit={Math.max(included, 1)} unit="credits" />
        <p className="mt-2xs text-xs text-muted">
          {periodNote}
          {reserve > 0 ? ` · ${reserve.toLocaleString()} top-up credits in reserve` : ''}
        </p>
      </div>
    </SettingsGroup>
  )
}

function RateLimitingGroup({ rateLimit }: { rateLimit: UsageRateLimit | null }): JSX.Element | null {
  if (!rateLimit) return null
  const keys = (Object.keys(WINDOW_LABELS) as RateLimitWindowKey[]).filter(
    (key) => rateLimit.windows[key],
  )
  if (keys.length === 0) return null

  return (
    <section className="mb-md">
      <h4 className="font-display text-md font-semibold text-ink">Rate limiting</h4>
      <p className="settings-wrap mt-3xs mb-2xs text-sm text-muted">
        Request limits for your plan across hourly, daily, weekly, and monthly windows.
      </p>
      {rateLimit.degraded && (
        <p className="mb-2xs text-xs text-warning-ink">Rate-limit service is degraded — limits may be approximate.</p>
      )}
      <div className="rounded-card border border-rule bg-paper-2 px-sm [&>*+*]:border-t [&>*+*]:border-rule-2">
        {keys.map((key) => {
          const window = rateLimit.windows[key]!
          const limit = window.limit ?? 0
          return (
            <RateLimitRow
              key={key}
              label={WINDOW_LABELS[key]}
              used={window.used}
              limit={limit}
              resets={formatBillingDate(window.resetAt)}
            />
          )
        })}
      </div>
    </section>
  )
}

function RequestHistoryGroup({ points }: { points: UsageHistoryPoint[] }): JSX.Element {
  const chartData = points.map((point) => ({
    label: formatShortDay(point.day),
    value: point.request_count,
  }))
  const total = points.reduce((sum, point) => sum + point.request_count, 0)

  return (
    <SettingsGroup label={`Request history · last ${HISTORY_DAYS} days`}>
      <div className="py-xs">
        <p className="font-display text-md font-semibold tabular-nums text-ink">
          {total.toLocaleString()} <span className="text-sm font-medium text-muted">requests</span>
        </p>
        {chartData.length > 0 ? (
          <MiniBarChart data={chartData} unit="requests" />
        ) : (
          <p className="mt-2xs text-sm text-muted">No requests in this window yet.</p>
        )}
      </div>
    </SettingsGroup>
  )
}

export function UsageSection(): JSX.Element {
  const { refreshUsageSummary } = useCredits()
  const [history, setHistory] = useState<UsageHistoryPoint[] | null>(null)
  const [rateLimit, setRateLimit] = useState<UsageRateLimit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      setLoading(true)
      setError(null)
      try {
        await refreshUsageSummary()
        const [historyResult, rateResult] = await Promise.all([
          fetchUsageHistory(HISTORY_DAYS),
          fetchUsageRateLimit().catch(() => null),
        ])
        if (cancelled) return
        setHistory(historyResult.points)
        setRateLimit(rateResult)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load usage'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [refreshUsageSummary])

  if (loading) return <UsageLoading />
  if (error) return <UsageError message={error} />

  return (
    <>
      <UsageBanner />
      <ThisPeriodGroup />
      <RateLimitingGroup rateLimit={rateLimit} />
      <RequestHistoryGroup points={history ?? []} />
    </>
  )
}
