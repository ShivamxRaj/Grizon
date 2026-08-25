import { createFileRoute } from '@tanstack/react-router'
import { PaymentCallbackPage } from '@/features/billing/components/PaymentCallbackPage'

export const Route = createFileRoute('/_workspace/payment/callback')({
  validateSearch: (search: Record<string, unknown>): { type?: string; orderId?: string } => ({
    type: typeof search.type === 'string' ? search.type : undefined,
    orderId: typeof search.orderId === 'string' ? search.orderId : undefined,
  }),
  component: PaymentCallbackPage,
})
