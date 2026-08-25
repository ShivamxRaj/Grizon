export interface Plan {
  name: string
  description: string
  price: string
  period: string
  features: string[]
  ctaLabel: string
  featured?: boolean
  badge?: string
}

export const PLANS: Plan[] = [
  {
    name: 'Free',
    description: 'Try Grizon with everyday questions.',
    price: '$0',
    period: '/ forever',
    features: ['Auto agent routing', '20 messages a day', 'Web and mobile access', '7-day thread history'],
    ctaLabel: 'Start free',
  },
  {
    name: 'Plus',
    description: 'For daily use across work and life.',
    price: '$12',
    period: '/ month',
    features: [
      'Everything in Free',
      'Unlimited messages',
      'All specialist agents',
      'Unlimited thread history',
      'Drive file connections',
    ],
    ctaLabel: 'Get started',
    featured: true,
    badge: 'Most popular',
  },
  {
    name: 'Pro',
    description: 'For teams who live in it.',
    price: '$29',
    period: '/ month',
    features: [
      'Everything in Plus',
      'Shared team threads',
      'Priority response speed',
      'Early access to new agents',
      'Priority support',
    ],
    ctaLabel: 'Get started',
  },
]
