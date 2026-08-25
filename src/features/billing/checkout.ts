import {
  changeSubscription,
  initiateSubscription,
} from './api'
import {
  getInitiateSubscriptionErrorMessage,
  storePendingSubscription,
} from './paymentUtils'
import type { BillingCycle, Plan, SubscriptionChangeResult } from './types'

export type CheckoutMode = 'purchase' | 'change'

export type CheckoutResult =
  | { kind: 'redirect'; redirectUrl: string }
  | { kind: 'scheduled' }
  | { kind: 'error'; error: string }

export async function runPlanCheckout(args: {
  plan: Plan
  billingCycle: BillingCycle
  mode: CheckoutMode
  mobileNumber?: string
}): Promise<CheckoutResult> {
  try {
    if (args.mode === 'purchase') return await runPurchaseCheckout(args)
    return await runChangeCheckout(args)
  } catch (err) {
    return { kind: 'error', error: getInitiateSubscriptionErrorMessage(err) }
  }
}

async function runPurchaseCheckout(args: {
  plan: Plan
  billingCycle: BillingCycle
  mobileNumber?: string
}): Promise<CheckoutResult> {
  const res = await initiateSubscription({
    planId: args.plan.id,
    billingCycle: args.billingCycle,
    mobileNumber: args.mobileNumber,
  })
  storePendingSubscription({ planId: args.plan.id, planName: args.plan.name })
  return { kind: 'redirect', redirectUrl: res.redirectUrl }
}

async function runChangeCheckout(args: {
  plan: Plan
  billingCycle: BillingCycle
  mobileNumber?: string
}): Promise<CheckoutResult> {
  const res: SubscriptionChangeResult = await changeSubscription({
    planId: args.plan.id,
    billingCycle: args.billingCycle,
    mobileNumber: args.mobileNumber,
  })
  if (res.mode === 'scheduled') return { kind: 'scheduled' }
  storePendingSubscription({ planId: args.plan.id, planName: args.plan.name })
  return { kind: 'redirect', redirectUrl: res.redirectUrl }
}

export function redirectToPhonePe(url: string): void {
  window.location.assign(url)
}
