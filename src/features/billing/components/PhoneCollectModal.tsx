import { useState, type FormEvent, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils/cn'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { ROUTE_CHAT } from '@/constants/routes'
import { useSettingsModal } from '@/features/settings/useSettingsModal'
import { getApiErrorMessage } from '@/lib/api/errors'
import { saveSubscriptionContact } from '../api'
import { runPlanCheckout, redirectToPhonePe, type CheckoutMode } from '../checkout'
import { formatRupees, isValidIndianMobile } from '../paymentUtils'
import type { BillingCycle, Plan } from '../types'

interface PhoneCollectModalProps {
  plan: Plan
  billingCycle: BillingCycle
  mode: CheckoutMode
  onClose: () => void
  onSaved: (mobileNumber: string) => void
}

export function PhoneCollectModal(props: PhoneCollectModalProps): JSX.Element {
  const { plan, billingCycle, mode, onClose, onSaved } = props
  const navigate = useNavigate()
  const { openSettings } = useSettingsModal()
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScheduled = (): void => {
    onClose()
    openSettings('billing')
    void navigate({ to: ROUTE_CHAT })
  }

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault()
    void saveAndPay({
      mobile,
      plan,
      billingCycle,
      mode,
      onSaved,
      handleScheduled,
      setError,
      setLoading,
    })
  }

  return createPortal(
    <CollectDialogShell onClose={onClose} plan={plan} billingCycle={billingCycle}>
      <form onSubmit={onSubmit} className="flex flex-col gap-xs">
        <MobileInput mobile={mobile} onChange={setMobile} />
        <p className="text-xs text-muted">
          Saved to your profile for UPI AutoPay. You can verify it later in Account settings.
        </p>
        {error && <p className="text-sm text-danger-ink">{error}</p>}
        <button type="submit" disabled={loading} className={cn(buttonClasses('accent', 'md'), 'w-full')}>
          {loading ? 'Continuing…' : 'Continue to payment'}
        </button>
      </form>
    </CollectDialogShell>,
    document.body,
  )
}

function CollectDialogShell({
  children,
  onClose,
  plan,
  billingCycle,
}: {
  children: JSX.Element
  onClose: () => void
  plan: Plan
  billingCycle: BillingCycle
}): JSX.Element {
  return (
    <div
      className="fixed inset-0 z-[960] flex items-end justify-center p-md sm:items-center"
      style={{ background: 'var(--color-scrim)' }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phonepe-mobile-title"
        className="phone-collect-dialog flex w-full max-w-[24rem] flex-col gap-sm rounded-card border border-rule bg-paper p-md shadow-lg"
      >
        <header className="flex items-start justify-between gap-xs">
          <div className="min-w-0">
            <h3 id="phonepe-mobile-title" className="font-display text-md font-semibold text-ink">
              Add mobile for PhonePe
            </h3>
            <p className="mt-3xs text-xs text-muted">
              {plan.name} · {billingCycle === 'annual' ? 'Annual' : 'Monthly'} ·{' '}
              {formatRupees(plan.pricing[billingCycle])}
            </p>
          </div>
          <button type="button" onClick={onClose} className={buttonClasses('text', 'sm')} aria-label="Close">
            Close
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

function MobileInput({
  mobile,
  onChange,
}: {
  mobile: string
  onChange: (value: string) => void
}): JSX.Element {
  return (
    <label className="flex flex-col gap-3xs text-xs font-semibold text-ink-2">
      Mobile number
      <input
        type="tel"
        inputMode="numeric"
        maxLength={10}
        required
        autoFocus
        value={mobile}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 10))}
        placeholder="9876543210"
        className="w-full min-w-0 rounded-input border border-rule bg-paper-2 px-sm py-xs text-sm text-ink outline-none transition-colors duration-short ease-out focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      />
    </label>
  )
}

async function saveAndPay(args: {
  mobile: string
  plan: Plan
  billingCycle: BillingCycle
  mode: CheckoutMode
  onSaved: (mobileNumber: string) => void
  handleScheduled: () => void
  setError: (value: string | null) => void
  setLoading: (value: boolean) => void
}): Promise<void> {
  const trimmed = args.mobile.trim()
  if (!isValidIndianMobile(trimmed)) {
    args.setError('Enter a valid 10-digit Indian mobile number.')
    return
  }
  args.setLoading(true)
  args.setError(null)
  try {
    const saved = await saveSubscriptionContact(trimmed)
    const number = saved.mobileNumber ?? trimmed
    args.onSaved(number)
    await continueCheckout({ ...args, mobileNumber: number })
  } catch (err) {
    args.setError(getApiErrorMessage(err, 'Could not save mobile number'))
    args.setLoading(false)
  }
}

async function continueCheckout(args: {
  plan: Plan
  billingCycle: BillingCycle
  mode: CheckoutMode
  mobileNumber: string
  handleScheduled: () => void
  setError: (value: string | null) => void
  setLoading: (value: boolean) => void
}): Promise<void> {
  const result = await runPlanCheckout({
    plan: args.plan,
    billingCycle: args.billingCycle,
    mode: args.mode,
    mobileNumber: args.mobileNumber,
  })
  if (result.kind === 'redirect' && result.redirectUrl) {
    redirectToPhonePe(result.redirectUrl)
    return
  }
  if (result.kind === 'scheduled') {
    args.handleScheduled()
    return
  }
  args.setError(result.kind === 'error' ? result.error : 'Something went wrong.')
  args.setLoading(false)
}
