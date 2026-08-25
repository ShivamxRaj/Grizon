import { isApiError } from '@/lib/api/errors'
import type {
  PaymentOrder,
  PaymentOrderRaw,
  PaymentOrderStatus,
  PaymentOrderType,
  PendingSubscriptionContext,
  Subscription,
  SubscriptionHistoryEvent,
  SubscriptionStatus,
} from './types'

export const PENDING_SUBSCRIPTION_STORAGE_KEY = 'grizon_pending_subscription'

const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_RE.test(value.trim())
}

export function topupPackageId(pkg: { id?: string; credits: number; price: number }): string {
  return pkg.id ?? `${pkg.credits}_${pkg.price}`
}

export function storePendingSubscription(ctx: PendingSubscriptionContext): void {
  sessionStorage.setItem(PENDING_SUBSCRIPTION_STORAGE_KEY, JSON.stringify(ctx))
}

export function readPendingSubscription(): PendingSubscriptionContext | null {
  try {
    const raw = sessionStorage.getItem(PENDING_SUBSCRIPTION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingSubscriptionContext
    if (!parsed?.planId) return null
    return parsed
  } catch {
    return null
  }
}

export function clearPendingSubscription(): void {
  sessionStorage.removeItem(PENDING_SUBSCRIPTION_STORAGE_KEY)
}

export function mapPaymentOrder(raw: PaymentOrderRaw): PaymentOrder {
  return {
    id: raw.id,
    merchantOrderId: raw.merchant_order_id,
    type: raw.type,
    amountPaise: raw.amount_paise,
    credits: raw.credits,
    status: raw.status,
    pgOrderId: raw.pg_order_id,
    pgTransactionId: raw.pg_transaction_id,
    merchantSubscriptionId: raw.merchant_subscription_id,
    subscriptionId: raw.subscription_id,
    retryCount: raw.retry_count,
    expireAt: raw.expire_at,
    notifiedAt: raw.notified_at ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function formatPaise(amountPaise: number): string {
  return `₹${(amountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

export function formatRupees(rupees: number): string {
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function formatBillingDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function isFreeSubscription(sub: Subscription | null | undefined): boolean {
  if (!sub) return true
  return sub.planSnapshot.slug === 'free' || sub.planSnapshot.name.toLowerCase() === 'free'
}

export function isPaidSubscription(sub: Subscription | null | undefined): boolean {
  return Boolean(sub && !isFreeSubscription(sub))
}

export const PAYMENT_ORDER_TYPE_LABELS: Record<PaymentOrderType, string> = {
  topup: 'Credit Top-up',
  subscription_setup: 'Subscription Setup',
  redemption: 'Recurring Charge',
}

export function paymentOrderStatusTone(
  status: PaymentOrderStatus,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'completed') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'failed') return 'danger'
  return 'neutral'
}

export const SUBSCRIPTION_HISTORY_EVENT_LABELS: Record<SubscriptionHistoryEvent, string> = {
  created: 'Subscription created',
  upgraded: 'Plan upgraded',
  renewed: 'Subscription renewed',
  cancel_scheduled: 'Cancellation scheduled',
  cancelled: 'Subscription cancelled',
  paused: 'Mandate paused',
  resumed: 'Subscription resumed',
  admin_adjusted: 'Plan adjusted by admin',
}

export function getPeriodEndLabel(sub: Subscription | null | undefined): string {
  if (!sub?.currentPeriodEnd) return '—'
  if (sub.cancelAtPeriodEnd) return `Access until ${formatBillingDate(sub.currentPeriodEnd)}`
  if (sub.status === 'paused') return `Period ends ${formatBillingDate(sub.currentPeriodEnd)}`
  return `Renews ${formatBillingDate(sub.currentPeriodEnd)}`
}

export function subscriptionStatusTone(
  status: SubscriptionStatus | undefined,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'active') return 'success'
  if (status === 'past_due' || status === 'paused') return 'warning'
  if (status === 'cancelled') return 'danger'
  return 'neutral'
}

export function getInitiateSubscriptionErrorMessage(err: unknown): string {
  if (!isApiError(err)) return 'Something went wrong. Please try again.'
  switch (err.code) {
    case 'SUBSCRIPTION_ALREADY_ACTIVE':
      return 'You already have an active subscription. Manage it from billing settings.'
    case 'PAYMENT_ALREADY_COMPLETED':
      return 'A subscription setup is already in progress. Check billing for status or try again shortly.'
    case 'INVALID_UPGRADE_TARGET':
      return 'This plan cannot be purchased. Please choose a paid plan.'
    case 'PLAN_NOT_PUBLIC':
    case 'PLAN_NOT_FOUND':
      return 'This plan is no longer available. Please refresh and try another plan.'
    default:
      return err.message || 'Something went wrong. Please try again.'
  }
}
