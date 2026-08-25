import { useEffect, useState, type FormEvent, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { getApiErrorMessage } from '@/lib/api/errors'
import {
  confirmSubscriptionContactOtp,
  requestSubscriptionContactOtp,
  saveSubscriptionContact,
} from '../api'
import { isValidIndianMobile } from '../paymentUtils'

type DialogMode = 'add' | 'verify'
type ContactResult = { mobileNumber: string | null; verifiedAt: string | null }

interface PhoneSettingsDialogProps {
  mode: DialogMode
  mobileNumber?: string | null
  onClose: () => void
  onDone: (contact: ContactResult) => void
}

export function PhoneSettingsDialog(props: PhoneSettingsDialogProps): JSX.Element {
  const { mode, onClose, onDone } = props
  const [mobile, setMobile] = useState(props.mobileNumber ?? '')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)

  useAutoSendOtp({
    mode,
    mobileNumber: props.mobileNumber,
    setLoading,
    setError,
    setOtpSent,
  })

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault()
    if (mode === 'add') {
      void runSaveMobile({ mobile, onDone, onClose, setError, setLoading })
      return
    }
    void runConfirmOtp({ mobile, code, onDone, onClose, setError, setLoading })
  }

  return createPortal(
    <SettingsDialogShell title={mode === 'add' ? 'Add phone number' : 'Verify phone number'} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-xs">
        {mode === 'add' ? (
          <MobileField mobile={mobile} onChange={setMobile} />
        ) : (
          <OtpFields
            mobile={mobile}
            code={code}
            otpSent={otpSent}
            onCodeChange={setCode}
            onResend={() => void runResendOtp({ mobile, setError, setLoading, setOtpSent })}
          />
        )}
        {error && <p className="text-sm text-danger-ink">{error}</p>}
        <button type="submit" disabled={loading} className={cn(buttonClasses('accent', 'md'), 'w-full')}>
          {submitLabel(mode, loading, otpSent)}
        </button>
      </form>
    </SettingsDialogShell>,
    document.body,
  )
}

function submitLabel(mode: DialogMode, loading: boolean, otpSent: boolean): string {
  if (mode === 'add') return loading ? 'Saving…' : 'Save'
  if (loading) return otpSent ? 'Verifying…' : 'Sending…'
  return 'Verify'
}

function useAutoSendOtp(args: {
  mode: DialogMode
  mobileNumber?: string | null
  setLoading: (value: boolean) => void
  setError: (value: string | null) => void
  setOtpSent: (value: boolean) => void
}): void {
  useEffect(() => {
    if (args.mode !== 'verify') return
    const trimmed = (args.mobileNumber ?? '').trim()
    if (!isValidIndianMobile(trimmed)) return
    let cancelled = false
    void (async (): Promise<void> => {
      args.setLoading(true)
      args.setError(null)
      try {
        await requestSubscriptionContactOtp(trimmed)
        if (!cancelled) args.setOtpSent(true)
      } catch (err) {
        if (!cancelled) args.setError(getApiErrorMessage(err, 'Could not send OTP'))
      } finally {
        if (!cancelled) args.setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [args.mode, args.mobileNumber, args.setLoading, args.setError, args.setOtpSent])
}

async function runSaveMobile(args: {
  mobile: string
  onDone: (contact: ContactResult) => void
  onClose: () => void
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
    args.onDone(await saveSubscriptionContact(trimmed))
    args.onClose()
  } catch (err) {
    args.setError(getApiErrorMessage(err, 'Could not save mobile number'))
    args.setLoading(false)
  }
}

async function runResendOtp(args: {
  mobile: string
  setError: (value: string | null) => void
  setLoading: (value: boolean) => void
  setOtpSent: (value: boolean) => void
}): Promise<void> {
  const trimmed = args.mobile.trim()
  if (!isValidIndianMobile(trimmed)) {
    args.setError('Enter a valid 10-digit Indian mobile number.')
    return
  }
  args.setLoading(true)
  args.setError(null)
  try {
    await requestSubscriptionContactOtp(trimmed)
    args.setOtpSent(true)
  } catch (err) {
    args.setError(getApiErrorMessage(err, 'Could not send OTP'))
  } finally {
    args.setLoading(false)
  }
}

async function runConfirmOtp(args: {
  mobile: string
  code: string
  onDone: (contact: ContactResult) => void
  onClose: () => void
  setError: (value: string | null) => void
  setLoading: (value: boolean) => void
}): Promise<void> {
  const trimmed = args.mobile.trim()
  const otp = args.code.trim()
  if (!/^\d{6}$/.test(otp)) {
    args.setError('Enter the 6-digit OTP.')
    return
  }
  args.setLoading(true)
  args.setError(null)
  try {
    const confirmed = await confirmSubscriptionContactOtp(trimmed, otp)
    args.onDone({ mobileNumber: confirmed.mobileNumber, verifiedAt: confirmed.verifiedAt })
    args.onClose()
  } catch (err) {
    args.setError(getApiErrorMessage(err, 'Could not verify OTP'))
    args.setLoading(false)
  }
}

function SettingsDialogShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: JSX.Element
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
        aria-labelledby="phone-settings-title"
        className="phone-collect-dialog flex w-full max-w-[24rem] flex-col gap-sm rounded-card border border-rule bg-paper p-md shadow-lg"
      >
        <header className="flex items-start justify-between gap-xs">
          <h3 id="phone-settings-title" className="font-display text-md font-semibold text-ink">
            {title}
          </h3>
          <button type="button" onClick={onClose} className={buttonClasses('text', 'sm')} aria-label="Close">
            Close
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

function MobileField({
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

function OtpFields({
  mobile,
  code,
  otpSent,
  onCodeChange,
  onResend,
}: {
  mobile: string
  code: string
  otpSent: boolean
  onCodeChange: (value: string) => void
  onResend: () => void
}): JSX.Element {
  return (
    <>
      <p className="text-sm text-ink-2">
        {otpSent ? 'Code sent to' : 'Sending code to'}{' '}
        <span className="font-semibold tabular-nums text-ink">+91 {mobile}</span>
      </p>
      <label className="flex flex-col gap-3xs text-xs font-semibold text-ink-2">
        6-digit OTP
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="w-full min-w-0 rounded-input border border-rule bg-paper-2 px-sm py-xs font-mono text-md tracking-[0.3em] text-ink outline-none transition-colors duration-short ease-out focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </label>
      <button type="button" onClick={onResend} className={cn(buttonClasses('text', 'sm'), 'self-start px-0')}>
        Resend OTP
      </button>
    </>
  )
}
