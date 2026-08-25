export const DEMO_ACCOUNT = {
  name: 'Maulik',
  email: 'maulikatwork@gmail.com',
  /** Matches a plan in features/landing/data/plans.ts — drives billing and agent entitlement. */
  planId: 'Plus',
  planName: 'Plus plan',
  tokensUsed: 6200,
  tokensLimit: 10000,
}

export const DEMO_ACCOUNT_USAGE_PERCENT = Math.round(
  (DEMO_ACCOUNT.tokensUsed / DEMO_ACCOUNT.tokensLimit) * 100,
)
