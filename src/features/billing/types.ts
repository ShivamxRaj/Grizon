export type BillingCycle = 'monthly' | 'annual'

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'paused'

export type PaymentOrderType = 'topup' | 'subscription_setup' | 'redemption'

export type PaymentOrderStatus = 'pending' | 'completed' | 'failed' | 'expired' | 'refunded'

export type TopupStatus = 'pending' | 'completed' | 'failed' | 'expired'

export type WalletTxType = 'grant' | 'deduct' | 'topup' | 'rollover' | 'refund' | 'adjustment'

export type RateLimitWindowKey = 'hourly' | 'daily' | 'weekly' | 'monthly'

export type SubscriptionHistoryEvent =
  | 'created'
  | 'upgraded'
  | 'renewed'
  | 'cancel_scheduled'
  | 'cancelled'
  | 'paused'
  | 'resumed'
  | 'admin_adjusted'

export interface TopupPackage {
  id?: string
  credits: number
  price: number
}

export interface PlanCredits {
  included: number
  rollover: boolean
  maxRollover?: number | null
  topupEnabled: boolean
  topupPackages: TopupPackage[]
}

export interface PlanPricing {
  monthly: number
  annual: number
  currency: 'inr'
}

export interface PlanLimits {
  hourly?: number
  daily?: number
  weekly?: number
  monthly?: number
  maxContextMessages?: number
  maxFileSize?: number
  maxFilesPerChat?: number
  [key: string]: unknown
}

export interface Plan {
  id: string
  name: string
  slug: string
  status: string
  isPublic: boolean
  isIntroductory: boolean
  pricing: PlanPricing
  credits: PlanCredits
  limits?: PlanLimits
  agentAccess?: string[]
  featureFlags: Record<string, boolean>
  createdAt: string
}

export interface Subscription {
  id: string
  planId: string
  planSnapshot: Plan
  billingCycle: BillingCycle
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  creditsGranted: number
  creditsRolledOver: number
  createdAt: string
  scheduledPlanId: string | null
  scheduledBillingCycle: BillingCycle | null
  scheduledChangeAt: string | null
}

export interface Wallet {
  balance: number
  pending: number
  spendable: number
  lifetimeEarned: number
  lifetimeSpent: number
  currency: string
  updatedAt: string
}

export interface CreditBalance {
  available: number
  reserved: number
  total: number
  lifetimeEarned: number
  lifetimeSpent: number
  lastRefreshedAt?: string
}

export interface UsageSummary {
  periodStart: string
  periodEnd: string
  requests: number
  total_tokens: number
  credits_used: number
  cost_usd: number
  input_tokens_fresh?: number
  input_tokens_cached?: number
  cache_write_tokens?: number
}

export interface UsageHistoryPoint {
  day: string
  request_count: number
  total_tokens: number
  credits_deducted: number
  cost_usd: number
}

export interface UsageHistory {
  days: number
  points: UsageHistoryPoint[]
}

export interface RateLimitWindow {
  used: number
  limit: number | null
  remaining: number
  usagePercent: number | null
  resetAt: string
}

export interface UsageRateLimit {
  cooldown: {
    active: boolean
    retryAfterSeconds: number | null
    cooldownUntil: string | null
  }
  windows: Partial<Record<RateLimitWindowKey, RateLimitWindow>>
  degraded: boolean
}

export interface PaymentOrderRaw {
  id: string
  merchant_order_id: string
  type: PaymentOrderType
  amount_paise: number
  credits: number
  status: PaymentOrderStatus
  pg_order_id: string | null
  pg_transaction_id: string | null
  merchant_subscription_id: string | null
  subscription_id: string | null
  retry_count: number
  expire_at: string | null
  notified_at?: string | null
  created_at: string
  updated_at: string
}

export interface PaymentOrder {
  id: string
  merchantOrderId: string
  type: PaymentOrderType
  amountPaise: number
  credits: number
  status: PaymentOrderStatus
  pgOrderId: string | null
  pgTransactionId: string | null
  merchantSubscriptionId: string | null
  subscriptionId: string | null
  retryCount: number
  expireAt: string | null
  notifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
}

export interface TopupInitiateResult {
  merchantOrderId: string
  redirectUrl: string
  creditsToAdd: number
  amountPaise: number
}

export interface TopupStatusResult {
  status: TopupStatus
  creditsToAdd: number
}

export interface SubscriptionCheckoutResult {
  merchantOrderId: string
  merchantSubscriptionId: string
  redirectUrl: string
}

export type SubscriptionChangeResult =
  | { mode: 'checkout'; merchantOrderId: string; merchantSubscriptionId: string; redirectUrl: string }
  | { mode: 'scheduled'; subscription: Subscription; effectiveAt: string }

export interface CancelSubscriptionResult {
  mode: 'graceful'
  subscription: Subscription
  effectiveAt: string
}

export interface SubscriptionHistoryRow {
  id: number
  subscriptionId: string
  event: SubscriptionHistoryEvent
  fromPlanId: string | null
  toPlanId: string | null
  payload: Record<string, unknown>
  occurredAt: string
}

export interface PendingSubscriptionContext {
  planId: string
  planName?: string
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: WalletTxType
  amount: number
  balanceAfter: number
  description: string
  createdAt: string
  agentSlug?: string | null
  messageId?: string | null
}
