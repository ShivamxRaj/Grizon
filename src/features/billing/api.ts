import { apiFetch } from '@/lib/api/client'
import {
  parseCancelSubscription,
  parseContactOtpConfirm,
  parseContactOtpRequest,
  parsePaymentOrdersList,
  parsePlansList,
  parseSubscriptionChange,
  parseSubscriptionCheckout,
  parseSubscriptionContact,
  parseSubscriptionEnvelope,
  parseSubscriptionHistoryList,
  parseTopupInitiate,
  parseTopupStatus,
  parseUsageHistory,
  parseUsageRateLimit,
  parseUsageSummary,
  parseWallet,
  parseWalletTransactionsList,
} from './guards'
import { mapPaymentOrder } from './paymentUtils'
import type {
  BillingCycle,
  CancelSubscriptionResult,
  PaymentOrder,
  PaymentOrderStatus,
  PaymentOrderType,
  Plan,
  Subscription,
  SubscriptionChangeResult,
  SubscriptionCheckoutResult,
  SubscriptionHistoryRow,
  TopupInitiateResult,
  TopupStatusResult,
  UsageHistory,
  UsageRateLimit,
  UsageSummary,
  Wallet,
  WalletTransaction,
  WalletTxType,
} from './types'

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

const MOCK_PLANS: Plan[] = [
  {
    id: 'plan_free',
    name: 'Judicial Starter',
    slug: 'free',
    pricing: { monthly: 0, annual: 0 },
    credits: { included: 100, topupEnabled: false, rollover: false },
    featureFlags: { webSearch: true, fileUpload: true, documentCreation: true },
    agentAccess: ['auto'],
    isPublic: true,
    status: 'active',
  },
  {
    id: 'plan_pro',
    name: 'Advocate Pro',
    slug: 'pro',
    pricing: { monthly: 499, annual: 4990 },
    credits: { included: 2500, topupEnabled: true, rollover: true },
    featureFlags: {
      webSearch: true,
      deepResearch: true,
      codeExecution: true,
      imageAnalyse: true,
      chartGenerate: true,
      fileUpload: true,
      documentCreation: true,
    },
    agentAccess: ['auto', 'legal-counsel', 'contract-auditor', 'document-ocr'],
    isPublic: true,
    status: 'active',
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise Chambers',
    slug: 'enterprise',
    pricing: { monthly: 1999, annual: 19990 },
    credits: { included: 12000, topupEnabled: true, rollover: true },
    featureFlags: {
      webSearch: true,
      deepResearch: true,
      codeExecution: true,
      imageAnalyse: true,
      videoAnalyse: true,
      chartGenerate: true,
      fileUpload: true,
      documentCreation: true,
    },
    agentAccess: ['auto', 'legal-counsel', 'contract-auditor', 'document-ocr', 'deep-reasoner'],
    isPublic: true,
    status: 'active',
  },
]

export async function fetchPlans(): Promise<{
  plans: Plan[]
  pagination: { page: number; pageSize: number; total: number }
}> {
  try {
    return await apiFetch('/api/v1/plans', { method: 'GET', auth: false }, parsePlansList)
  } catch {
    return { plans: MOCK_PLANS, pagination: { page: 1, pageSize: 10, total: 3 } }
  }
}

export async function fetchSubscription(): Promise<{ subscription: Subscription }> {
  try {
    return await apiFetch('/api/v1/subscription', { method: 'GET', auth: true }, parseSubscriptionEnvelope)
  } catch {
    return {
      subscription: {
        id: 'sub_pro_demo',
        planId: 'plan_pro',
        planSnapshot: MOCK_PLANS[1],
        billingCycle: 'monthly',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        creditsGranted: 2500,
        creditsRolledOver: 0,
        createdAt: new Date().toISOString(),
      },
    }
  }
}

const MOCK_WALLET: Wallet = {
  id: 'w_demo',
  userId: 'usr_demo',
  balance: 2500,
  spendable: 2500,
  pending: 0,
  lifetimeEarned: 5000,
  lifetimeSpent: 2500,
  updatedAt: new Date().toISOString(),
}

export async function fetchWallet(): Promise<Wallet> {
  try {
    return await apiFetch('/api/v1/wallet', { method: 'GET', auth: true }, parseWallet)
  } catch {
    return MOCK_WALLET
  }
}

export function fetchUsageSummary(params?: {
  periodStart?: string
  periodEnd?: string
}): Promise<UsageSummary> {
  return apiFetch(
    `/api/v1/usage/summary${queryString(params ?? {})}`,
    { method: 'GET', auth: true },
    parseUsageSummary,
  )
}

export function fetchUsageHistory(days?: number): Promise<UsageHistory> {
  return apiFetch(
    `/api/v1/usage/history${queryString(days !== undefined ? { days } : {})}`,
    { method: 'GET', auth: true },
    parseUsageHistory,
  )
}

export function fetchUsageRateLimit(): Promise<UsageRateLimit> {
  return apiFetch('/api/v1/usage/rate-limit', { method: 'GET', auth: true }, parseUsageRateLimit)
}

export function initiateTopup(packageId: string): Promise<TopupInitiateResult> {
  return apiFetch(
    '/api/v1/payment/topup',
    { method: 'POST', auth: true, body: { packageId } },
    parseTopupInitiate,
  )
}

export function getTopupStatus(orderId: string): Promise<TopupStatusResult> {
  return apiFetch(
    `/api/v1/payment/topup/${encodeURIComponent(orderId)}/status`,
    { method: 'GET', auth: true },
    parseTopupStatus,
  )
}

export function initiateSubscription(body: {
  planId: string
  billingCycle: BillingCycle
  mobileNumber?: string
}): Promise<SubscriptionCheckoutResult> {
  return apiFetch(
    '/api/v1/payment/subscription/initiate',
    { method: 'POST', auth: true, body },
    parseSubscriptionCheckout,
  )
}

export function changeSubscription(body: {
  planId: string
  billingCycle: BillingCycle
  mobileNumber?: string
}): Promise<SubscriptionChangeResult> {
  return apiFetch(
    '/api/v1/payment/subscription/change',
    { method: 'POST', auth: true, body },
    parseSubscriptionChange,
  )
}

export function setupDeferredDowngrade(body?: {
  mobileNumber?: string
}): Promise<SubscriptionCheckoutResult> {
  return apiFetch(
    '/api/v1/payment/subscription/change/setup',
    { method: 'POST', auth: true, body: body ?? {} },
    parseSubscriptionCheckout,
  )
}

export function cancelScheduledPlanChange(): Promise<{ subscription: Subscription }> {
  return apiFetch(
    '/api/v1/payment/subscription/change/cancel',
    { method: 'POST', auth: true, body: {} },
    parseSubscriptionEnvelope,
  )
}

export function requestSubscriptionContactOtp(mobileNumber: string): Promise<{
  expiresInSeconds: number
  cooldownSeconds: number
}> {
  return apiFetch(
    '/api/v1/payment/subscription/contact/otp/request',
    { method: 'POST', auth: true, body: { mobileNumber } },
    parseContactOtpRequest,
  )
}

export function confirmSubscriptionContactOtp(
  mobileNumber: string,
  code: string,
): Promise<{ mobileNumber: string; verifiedAt: string }> {
  return apiFetch(
    '/api/v1/payment/subscription/contact/otp/confirm',
    { method: 'POST', auth: true, body: { mobileNumber, code } },
    parseContactOtpConfirm,
  )
}

export function fetchSubscriptionContact(): Promise<{
  mobileNumber: string | null
  verifiedAt: string | null
}> {
  return apiFetch(
    '/api/v1/payment/subscription/contact',
    { method: 'GET', auth: true },
    parseSubscriptionContact,
  )
}

export function saveSubscriptionContact(mobileNumber: string | null): Promise<{
  mobileNumber: string | null
  verifiedAt: string | null
}> {
  return apiFetch(
    '/api/v1/payment/subscription/contact',
    { method: 'PUT', auth: true, body: { mobileNumber } },
    parseSubscriptionContact,
  )
}

export function cancelSubscription(): Promise<CancelSubscriptionResult> {
  return apiFetch(
    '/api/v1/payment/subscription/cancel',
    { method: 'POST', auth: true, body: { immediate: false } },
    parseCancelSubscription,
  )
}

export async function fetchPaymentOrders(params?: {
  type?: PaymentOrderType
  status?: PaymentOrderStatus
  month?: string
  page?: number
  page_size?: number
}): Promise<{ orders: PaymentOrder[]; pagination: { page: number; pageSize: number; total: number } }> {
  const data = await apiFetch(
    `/api/v1/payment/orders${queryString(params ?? {})}`,
    { method: 'GET', auth: true },
    parsePaymentOrdersList,
  )
  return {
    orders: data.orders.map(mapPaymentOrder),
    pagination: data.pagination,
  }
}

export function fetchSubscriptionHistory(params?: {
  month?: string
  page?: number
  page_size?: number
}): Promise<{
  history: SubscriptionHistoryRow[]
  pagination: { page: number; pageSize: number; total: number }
}> {
  return apiFetch(
    `/api/v1/payment/subscription/history${queryString(params ?? {})}`,
    { method: 'GET', auth: true },
    parseSubscriptionHistoryList,
  )
}

export function fetchWalletTransactions(params?: {
  page?: number
  page_size?: number
  type?: WalletTxType
  from?: string
  to?: string
}): Promise<{
  transactions: WalletTransaction[]
  pagination: { page: number; page_size: number; total: number }
}> {
  return apiFetch(
    `/api/v1/wallet/transactions${queryString(params ?? {})}`,
    { method: 'GET', auth: true },
    parseWalletTransactionsList,
  )
}
