import { createFileRoute } from '@tanstack/react-router'
import { PricingPage } from '@/features/billing/components/PricingPage'

export const Route = createFileRoute('/_workspace/pricing')({
  component: PricingPage,
})
