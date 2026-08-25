import { ApiError } from '@/lib/api/errors'
import { isBoolean, isNumber, isRecord, isString } from '@/lib/api/guards'
import type {
  BillingCycle,
  CancelSubscriptionResult,
  PaymentOrderRaw,
  PaymentOrderStatus,
  PaymentOrderType,
  Plan,
  PlanCredits,
  PlanPricing,
  RateLimitWindow,
  RateLimitWindowKey,
  Subscription,
  SubscriptionChangeResult,
  SubscriptionCheckoutResult,
  SubscriptionHistoryRow,
  SubscriptionStatus,
  TopupInitiateResult,
  TopupPackage,
  TopupStatus,
  TopupStatusResult,
  UsageHistory,
  UsageHistoryPoint,
  UsageRateLimit,
  UsageSummary,
  Wallet,
  WalletTransaction,
} from './types'

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value)
}

function asNumber(value: unknown): number | null {
  if (isNumber(value)) return value
  if (isString(value) && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return null
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new ApiError(500, 'INVALID_RESPONSE', `Invalid ${label}`)
  return value
}

function parseTopupPackage(value: unknown): TopupPackage | null {
  if (!isRecord(value)) return null
  const credits = asNumber(value.credits)
  const price = asNumber(value.price)
  if (credits === null || price === null) return null
  const pkg: TopupPackage = { credits, price }
  if (isString(value.id)) pkg.id = value.id
  return pkg
}

function parsePlanCredits(value: unknown): PlanCredits | null {
  if (!isRecord(value)) return null
  const included = asNumber(value.included)
  if (included === null || !isBoolean(value.rollover) || !isBoolean(value.topupEnabled)) return null
  if (!Array.isArray(value.topupPackages)) return null
  const topupPackages: TopupPackage[] = []
  for (const item of value.topupPackages) {
    const pkg = parseTopupPackage(item)
    if (!pkg) return null
    topupPackages.push(pkg)
  }
  return { included, rollover: value.rollover, topupEnabled: value.topupEnabled, topupPackages }
}

function parsePlanPricing(value: unknown): PlanPricing | null {
  if (!isRecord(value)) return null
  const monthly = asNumber(value.monthly)
  const annual = asNumber(value.annual)
  if (monthly === null || annual === null) return null
  if (value.currency !== 'inr' && value.currency !== 'INR') return null
  return { monthly, annual, currency: 'inr' }
}

function parseFeatureFlags(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {}
  const flags: Record<string, boolean> = {}
  for (const [key, flag] of Object.entries(value)) {
    if (isBoolean(flag)) flags[key] = flag
  }
  return flags
}

export function parsePlan(value: unknown): Plan {
  const raw = requireRecord(value, 'plan')
  const pricing = parsePlanPricing(raw.pricing)
  const credits = parsePlanCredits(raw.credits)
  if (!isString(raw.id) || !isString(raw.name) || !isString(raw.slug) || !pricing || !credits) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid plan payload')
  }
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    status: isString(raw.status) ? raw.status : 'active',
    isPublic: isBoolean(raw.isPublic) ? raw.isPublic : true,
    isIntroductory: isBoolean(raw.isIntroductory) ? raw.isIntroductory : false,
    pricing,
    credits,
    featureFlags: parseFeatureFlags(raw.featureFlags),
    createdAt: isString(raw.createdAt) ? raw.createdAt : '',
    agentAccess: Array.isArray(raw.agentAccess)
      ? raw.agentAccess.filter(isString)
      : undefined,
  }
}

const BILLING_CYCLES: ReadonlySet<string> = new Set(['monthly', 'annual'])
const SUB_STATUSES: ReadonlySet<string> = new Set(['active', 'past_due', 'cancelled', 'paused'])

function parseBillingCycle(value: unknown): BillingCycle {
  if (isString(value) && BILLING_CYCLES.has(value)) return value as BillingCycle
  return 'monthly'
}

function parseSubscriptionStatus(value: unknown): SubscriptionStatus {
  if (isString(value) && SUB_STATUSES.has(value)) return value as SubscriptionStatus
  return 'active'
}

export function parseSubscription(value: unknown): Subscription {
  const raw = requireRecord(value, 'subscription')
  if (!isString(raw.id) || !isString(raw.planId)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid subscription payload')
  }
  let planSnapshot: Plan | undefined = undefined
  if (raw.planSnapshot) {
    try {
      planSnapshot = parsePlan(raw.planSnapshot)
    } catch {
      planSnapshot = undefined
    }
  }
  return {
    id: raw.id,
    planId: raw.planId,
    planSnapshot,
    billingCycle: parseBillingCycle(raw.billingCycle),
    status: parseSubscriptionStatus(raw.status),
    currentPeriodStart: isString(raw.currentPeriodStart) ? raw.currentPeriodStart : '',
    currentPeriodEnd: isString(raw.currentPeriodEnd) ? raw.currentPeriodEnd : '',
    cancelAtPeriodEnd: Boolean(raw.cancelAtPeriodEnd),
    creditsGranted: asNumber(raw.creditsGranted) ?? 0,
    creditsRolledOver: asNumber(raw.creditsRolledOver) ?? 0,
    createdAt: isString(raw.createdAt) ? raw.createdAt : '',
    scheduledPlanId: isNullableString(raw.scheduledPlanId) ? raw.scheduledPlanId : null,
    scheduledBillingCycle:
      raw.scheduledBillingCycle === null || raw.scheduledBillingCycle === undefined
        ? null
        : parseBillingCycle(raw.scheduledBillingCycle),
    scheduledChangeAt: isNullableString(raw.scheduledChangeAt) ? raw.scheduledChangeAt : null,
  }
}

export function parseSubscriptionEnvelope(value: unknown): { subscription: Subscription } {
  const raw = requireRecord(value, 'subscription envelope')
  return { subscription: parseSubscription(raw.subscription) }
}

export function parsePlansList(value: unknown): {
  plans: Plan[]
  pagination: { page: number; pageSize: number; total: number }
} {
  const raw = requireRecord(value, 'plans list')
  if (!Array.isArray(raw.plans)) throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid plans list')
  const pagination = isRecord(raw.pagination) ? raw.pagination : {}
  return {
    plans: raw.plans.map(parsePlan),
    pagination: {
      page: asNumber(pagination.page) ?? 1,
      pageSize: asNumber(pagination.pageSize) ?? raw.plans.length,
      total: asNumber(pagination.total) ?? raw.plans.length,
    },
  }
}

export function parseWallet(value: unknown): Wallet {
  const raw = requireRecord(value, 'wallet')
  const balance = asNumber(raw.balance)
  const pending = asNumber(raw.pending)
  const spendable = asNumber(raw.spendable)
  if (balance === null || pending === null || spendable === null) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid wallet payload')
  }
  return {
    balance,
    pending,
    spendable,
    lifetimeEarned: asNumber(raw.lifetimeEarned) ?? 0,
    lifetimeSpent: asNumber(raw.lifetimeSpent) ?? 0,
    currency: isString(raw.currency) ? raw.currency : 'credits',
    updatedAt: isString(raw.updatedAt) ? raw.updatedAt : new Date().toISOString(),
  }
}

export function parseUsageSummary(value: unknown): UsageSummary {
  const raw = requireRecord(value, 'usage summary')
  if (!isString(raw.periodStart) || !isString(raw.periodEnd)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid usage summary')
  }
  return {
    periodStart: raw.periodStart,
    periodEnd: raw.periodEnd,
    requests: asNumber(raw.requests) ?? 0,
    total_tokens: asNumber(raw.total_tokens) ?? 0,
    credits_used: asNumber(raw.credits_used) ?? 0,
    cost_usd: asNumber(raw.cost_usd) ?? 0,
    input_tokens_fresh: asNumber(raw.input_tokens_fresh) ?? undefined,
    input_tokens_cached: asNumber(raw.input_tokens_cached) ?? undefined,
    cache_write_tokens: asNumber(raw.cache_write_tokens) ?? undefined,
  }
}

function parseHistoryPoint(value: unknown): UsageHistoryPoint | null {
  if (!isRecord(value)) return null
  const day = isString(value.day) ? value.day : null
  if (!day) return null
  return {
    day: day.slice(0, 10),
    request_count: asNumber(value.request_count) ?? 0,
    total_tokens: asNumber(value.total_tokens) ?? 0,
    credits_deducted: asNumber(value.credits_deducted) ?? 0,
    cost_usd: asNumber(value.cost_usd) ?? 0,
  }
}

export function parseUsageHistory(value: unknown): UsageHistory {
  const raw = requireRecord(value, 'usage history')
  if (!Array.isArray(raw.points)) throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid usage history')
  const points: UsageHistoryPoint[] = []
  for (const item of raw.points) {
    const point = parseHistoryPoint(item)
    if (point) points.push(point)
  }
  return { days: asNumber(raw.days) ?? 30, points }
}

function parseRateLimitWindow(value: unknown): RateLimitWindow | null {
  if (!isRecord(value)) return null
  const used = asNumber(value.used)
  const remaining = asNumber(value.remaining)
  if (used === null || remaining === null || !isString(value.resetAt)) return null
  const limit = value.limit === null ? null : asNumber(value.limit)
  return {
    used,
    limit,
    remaining,
    usagePercent: value.usagePercent === null ? null : asNumber(value.usagePercent),
    resetAt: value.resetAt,
  }
}

export function parseUsageRateLimit(value: unknown): UsageRateLimit {
  const raw = requireRecord(value, 'rate limit')
  const cooldownRaw = isRecord(raw.cooldown) ? raw.cooldown : {}
  const windowsRaw = isRecord(raw.windows) ? raw.windows : {}
  const windows: Partial<Record<RateLimitWindowKey, RateLimitWindow>> = {}
  for (const key of ['hourly', 'daily', 'weekly', 'monthly'] as RateLimitWindowKey[]) {
    const window = parseRateLimitWindow(windowsRaw[key])
    if (window) windows[key] = window
  }
  return {
    cooldown: {
      active: Boolean(cooldownRaw.active),
      retryAfterSeconds: asNumber(cooldownRaw.retryAfterSeconds),
      cooldownUntil: isNullableString(cooldownRaw.cooldownUntil) ? cooldownRaw.cooldownUntil : null,
    },
    windows,
    degraded: Boolean(raw.degraded),
  }
}

const ORDER_TYPES: ReadonlySet<string> = new Set(['topup', 'subscription_setup', 'redemption'])
const ORDER_STATUSES: ReadonlySet<string> = new Set([
  'pending',
  'completed',
  'failed',
  'expired',
  'refunded',
])

export function parsePaymentOrderRaw(value: unknown): PaymentOrderRaw {
  const raw = requireRecord(value, 'payment order')
  if (!isString(raw.id) || !isString(raw.merchant_order_id)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid payment order')
  }
  const type = isString(raw.type) && ORDER_TYPES.has(raw.type) ? (raw.type as PaymentOrderType) : 'topup'
  const status =
    isString(raw.status) && ORDER_STATUSES.has(raw.status)
      ? (raw.status as PaymentOrderStatus)
      : 'pending'
  return {
    id: raw.id,
    merchant_order_id: raw.merchant_order_id,
    type,
    amount_paise: asNumber(raw.amount_paise) ?? 0,
    credits: asNumber(raw.credits) ?? 0,
    status,
    pg_order_id: isNullableString(raw.pg_order_id) ? raw.pg_order_id : null,
    pg_transaction_id: isNullableString(raw.pg_transaction_id) ? raw.pg_transaction_id : null,
    merchant_subscription_id: isNullableString(raw.merchant_subscription_id)
      ? raw.merchant_subscription_id
      : null,
    subscription_id: isNullableString(raw.subscription_id) ? raw.subscription_id : null,
    retry_count: asNumber(raw.retry_count) ?? 0,
    expire_at: isNullableString(raw.expire_at) ? raw.expire_at : null,
    notified_at: isNullableString(raw.notified_at) ? raw.notified_at : null,
    created_at: isString(raw.created_at) ? raw.created_at : '',
    updated_at: isString(raw.updated_at) ? raw.updated_at : '',
  }
}

export function parsePaymentOrdersList(value: unknown): {
  orders: PaymentOrderRaw[]
  pagination: { page: number; pageSize: number; total: number }
} {
  const raw = requireRecord(value, 'payment orders')
  if (!Array.isArray(raw.orders)) throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid orders list')
  const pagination = isRecord(raw.pagination) ? raw.pagination : {}
  return {
    orders: raw.orders.map(parsePaymentOrderRaw),
    pagination: {
      page: asNumber(pagination.page) ?? 1,
      pageSize: asNumber(pagination.pageSize) ?? asNumber(pagination.page_size) ?? 20,
      total: asNumber(pagination.total) ?? 0,
    },
  }
}

export function parseTopupInitiate(value: unknown): TopupInitiateResult {
  const raw = requireRecord(value, 'topup initiate')
  if (!isString(raw.merchantOrderId) || !isString(raw.redirectUrl)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid topup initiate payload')
  }
  return {
    merchantOrderId: raw.merchantOrderId,
    redirectUrl: raw.redirectUrl,
    creditsToAdd: asNumber(raw.creditsToAdd) ?? 0,
    amountPaise: asNumber(raw.amountPaise) ?? 0,
  }
}

const TOPUP_STATUSES: ReadonlySet<string> = new Set(['pending', 'completed', 'failed', 'expired'])

export function parseTopupStatus(value: unknown): TopupStatusResult {
  const raw = requireRecord(value, 'topup status')
  const status =
    isString(raw.status) && TOPUP_STATUSES.has(raw.status) ? (raw.status as TopupStatus) : 'pending'
  return { status, creditsToAdd: asNumber(raw.creditsToAdd) ?? 0 }
}

export function parseSubscriptionCheckout(value: unknown): SubscriptionCheckoutResult {
  const raw = requireRecord(value, 'subscription checkout')
  if (!isString(raw.merchantOrderId) || !isString(raw.redirectUrl)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid checkout payload')
  }
  return {
    merchantOrderId: raw.merchantOrderId,
    merchantSubscriptionId: isString(raw.merchantSubscriptionId) ? raw.merchantSubscriptionId : '',
    redirectUrl: raw.redirectUrl,
  }
}

export function parseSubscriptionChange(value: unknown): SubscriptionChangeResult {
  const raw = requireRecord(value, 'subscription change')
  if (raw.mode === 'scheduled') {
    return {
      mode: 'scheduled',
      subscription: parseSubscription(raw.subscription),
      effectiveAt: isString(raw.effectiveAt) ? raw.effectiveAt : '',
    }
  }
  return { mode: 'checkout', ...parseSubscriptionCheckout(raw) }
}

export function parseCancelSubscription(value: unknown): CancelSubscriptionResult {
  const raw = requireRecord(value, 'cancel subscription')
  return {
    mode: 'graceful',
    subscription: parseSubscription(raw.subscription),
    effectiveAt: isString(raw.effectiveAt) ? raw.effectiveAt : '',
  }
}

export function parseSubscriptionContact(value: unknown): {
  mobileNumber: string | null
  verifiedAt: string | null
} {
  const raw = requireRecord(value, 'subscription contact')
  return {
    mobileNumber: isNullableString(raw.mobileNumber) ? raw.mobileNumber : null,
    verifiedAt: isNullableString(raw.verifiedAt) ? raw.verifiedAt : null,
  }
}

export function parseContactOtpRequest(value: unknown): {
  expiresInSeconds: number
  cooldownSeconds: number
} {
  const raw = requireRecord(value, 'contact otp request')
  return {
    expiresInSeconds: asNumber(raw.expiresInSeconds) ?? 600,
    cooldownSeconds: asNumber(raw.cooldownSeconds) ?? 45,
  }
}

export function parseContactOtpConfirm(value: unknown): {
  mobileNumber: string
  verifiedAt: string
} {
  const raw = requireRecord(value, 'contact otp confirm')
  if (!isString(raw.mobileNumber)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid contact confirm payload')
  }
  if (!isString(raw.verifiedAt)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid contact confirm verifiedAt')
  }
  return { mobileNumber: raw.mobileNumber, verifiedAt: raw.verifiedAt }
}

export function parseSubscriptionHistoryList(value: unknown): {
  history: SubscriptionHistoryRow[]
  pagination: { page: number; pageSize: number; total: number }
} {
  const raw = requireRecord(value, 'subscription history')
  if (!Array.isArray(raw.history)) throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid history')
  const history: SubscriptionHistoryRow[] = []
  for (const item of raw.history) {
    if (!isRecord(item)) continue
    history.push({
      id: asNumber(item.id) ?? 0,
      subscriptionId: isString(item.subscriptionId) ? item.subscriptionId : '',
      event: (isString(item.event) ? item.event : 'created') as SubscriptionHistoryRow['event'],
      fromPlanId: isNullableString(item.fromPlanId) ? item.fromPlanId : null,
      toPlanId: isNullableString(item.toPlanId) ? item.toPlanId : null,
      payload: isRecord(item.payload) ? item.payload : {},
      occurredAt: isString(item.occurredAt) ? item.occurredAt : '',
    })
  }
  const pagination = isRecord(raw.pagination) ? raw.pagination : {}
  return {
    history,
    pagination: {
      page: asNumber(pagination.page) ?? 1,
      pageSize: asNumber(pagination.pageSize) ?? 20,
      total: asNumber(pagination.total) ?? history.length,
    },
  }
}

export function parseWalletTransactionsList(value: unknown): {
  transactions: WalletTransaction[]
  pagination: { page: number; page_size: number; total: number }
} {
  const raw = requireRecord(value, 'wallet transactions')
  if (!Array.isArray(raw.transactions)) {
    throw new ApiError(500, 'INVALID_RESPONSE', 'Invalid transactions')
  }
  const transactions: WalletTransaction[] = []
  for (const item of raw.transactions) {
    if (!isRecord(item) || !isString(item.id)) continue
    transactions.push({
      id: item.id,
      walletId: isString(item.walletId) ? item.walletId : '',
      type: (isString(item.type) ? item.type : 'grant') as WalletTransaction['type'],
      amount: asNumber(item.amount) ?? 0,
      balanceAfter: asNumber(item.balanceAfter) ?? 0,
      description: isString(item.description) ? item.description : '',
      createdAt: isString(item.createdAt) ? item.createdAt : '',
      agentSlug: isNullableString(item.agentSlug) ? item.agentSlug : null,
      messageId: isNullableString(item.messageId) ? item.messageId : null,
    })
  }
  const pagination = isRecord(raw.pagination) ? raw.pagination : {}
  return {
    transactions,
    pagination: {
      page: asNumber(pagination.page) ?? 1,
      page_size: asNumber(pagination.page_size) ?? 25,
      total: asNumber(pagination.total) ?? transactions.length,
    },
  }
}
