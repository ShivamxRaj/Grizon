import { useEffect, useState, type JSX } from 'react'
import { CheckCircleIcon, GoogleIcon, MonitorIcon } from '@/components/ui/icons'
import { listSessions, revokeSession, unlinkGoogle } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import type { AuthSession, AuthUser } from '@/features/auth/types'
import {
  fetchSubscriptionContact,
  saveSubscriptionContact,
} from '@/features/billing/api'
import { PhoneSettingsDialog } from '@/features/billing/components/PhoneSettingsDialog'
import { getApiErrorMessage, isApiError } from '@/lib/api/errors'
import { useExpandable } from '@/features/chat/hooks/useExpandable'
import { SettingsGroup, SettingRow } from '../components/primitives/SettingsGroup'
import { DataList, DataRow, RowAction } from '../components/primitives/DataList'
import { StatusPill } from '../components/primitives/Pills'
import { useSettingsConfirm } from '../hooks/useSettingsConfirm'
import { useSettingsModal } from '../useSettingsModal'
import { PasswordChangeDialog } from '../components/PasswordChangeDialog'
import { ACCOUNT_DELETION_GRACE_DAYS } from '../data/account'
import { SESSION_PREVIEW_COUNT } from '../data/general'
import { sessionRowMeta, sessionRowTitle } from '../utils/sessionDisplay'

function googleDescription(user: AuthUser | null): string {
  const google = user?.linked_providers.find((provider) => provider.provider === 'google')
  if (!google) return 'Not connected.'
  return `Connected as ${google.provider_email}.`
}

function canUnlinkGoogle(user: AuthUser | null): boolean {
  if (!user) return false
  const hasGoogle = user.linked_providers.some((provider) => provider.provider === 'google')
  return hasGoogle && user.has_password
}

function useUnlinkGoogleAction(): () => void {
  const { user, refreshUser } = useAuth()
  const { ask } = useSettingsConfirm()
  const unlinkAllowed = canUnlinkGoogle(user)

  return (): void => {
    if (!unlinkAllowed) return
    ask({
      title: 'Disconnect Google?',
      body: 'You will still be able to sign in with your password.',
      confirmLabel: 'Disconnect',
      onConfirm: () => {
        void runUnlinkGoogle(refreshUser, ask)
      },
    })
  }
}

async function runUnlinkGoogle(
  refreshUser: () => Promise<void>,
  ask: ReturnType<typeof useSettingsConfirm>['ask'],
): Promise<void> {
  try {
    await unlinkGoogle()
    await refreshUser()
  } catch (error) {
    const isLast = isApiError(error) && error.code === 'LAST_SIGN_IN_METHOD'
    ask({
      title: isLast ? 'Cannot disconnect Google' : 'Disconnect failed',
      body: isLast
        ? 'Set a password first — Google is your only sign-in method.'
        : getApiErrorMessage(error, 'Could not disconnect Google.'),
      confirmLabel: 'OK',
      tone: 'accent',
      onConfirm: () => undefined,
    })
  }
}

function EmailRow({ email, verified }: { email: string; verified: boolean }): JSX.Element {
  return (
    <SettingRow label="Email" description={`${email} · this is your permanent sign-in address and cannot be changed.`}>
      <StatusPill
        tone={verified ? 'success' : 'warning'}
        label={verified ? 'Verified' : 'Unverified'}
        icon={verified ? CheckCircleIcon : undefined}
      />
    </SettingRow>
  )
}

function phoneDescription(mobileNumber: string | null): string {
  if (!mobileNumber) {
    return 'Not added · used for PhonePe UPI AutoPay checkout.'
  }
  return `+91 ${mobileNumber} · used for PhonePe UPI AutoPay checkout.`
}

type PhoneContact = { mobileNumber: string | null; verifiedAt: string | null }

function usePhoneContact(): {
  contact: PhoneContact
  loading: boolean
  setContact: (contact: PhoneContact) => void
} {
  const [contact, setContact] = useState<PhoneContact>({ mobileNumber: null, verifiedAt: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async (): Promise<void> => {
      try {
        const next = await fetchSubscriptionContact()
        if (!cancelled) setContact(next)
      } catch {
        if (!cancelled) setContact({ mobileNumber: null, verifiedAt: null })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { contact, loading, setContact }
}

async function clearPhoneContact(
  setContact: (contact: PhoneContact) => void,
  ask: ReturnType<typeof useSettingsConfirm>['ask'],
): Promise<void> {
  try {
    await saveSubscriptionContact(null)
    setContact({ mobileNumber: null, verifiedAt: null })
  } catch (error) {
    ask({
      title: 'Could not remove phone',
      body: getApiErrorMessage(error, 'Remove failed.'),
      confirmLabel: 'OK',
      tone: 'accent',
      onConfirm: () => undefined,
    })
  }
}

function PhoneRowActions({
  mobileNumber,
  verified,
  onAdd,
  onVerify,
  onRemove,
}: {
  mobileNumber: string | null
  verified: boolean
  onAdd: () => void
  onVerify: () => void
  onRemove: () => void
}): JSX.Element {
  if (!mobileNumber) return <RowAction label="Add" onClick={onAdd} />
  return (
    <>
      <StatusPill
        tone={verified ? 'success' : 'warning'}
        label={verified ? 'Verified' : 'Unverified'}
        icon={verified ? CheckCircleIcon : undefined}
      />
      {!verified && <RowAction label="Verify" onClick={onVerify} />}
      <RowAction label="Remove" tone="danger" onClick={onRemove} />
    </>
  )
}

function PhoneRow(): JSX.Element {
  const { ask } = useSettingsConfirm()
  const { contact, loading, setContact } = usePhoneContact()
  const [dialog, setDialog] = useState<'add' | 'verify' | null>(null)
  const verified = Boolean(contact.verifiedAt)

  const removePhone = (): void => {
    ask({
      title: 'Remove phone number?',
      body: 'PhonePe checkout will ask for a mobile number again next time.',
      confirmLabel: 'Remove',
      onConfirm: () => {
        void clearPhoneContact(setContact, ask)
      },
    })
  }

  return (
    <>
      <SettingRow label="Phone number" description={loading ? 'Loading…' : phoneDescription(contact.mobileNumber)}>
        <div className="flex items-center gap-2xs">
          <PhoneRowActions
            mobileNumber={contact.mobileNumber}
            verified={verified}
            onAdd={() => setDialog('add')}
            onVerify={() => setDialog('verify')}
            onRemove={removePhone}
          />
        </div>
      </SettingRow>
      {dialog ? (
        <PhoneSettingsDialog
          mode={dialog}
          mobileNumber={contact.mobileNumber}
          onClose={() => setDialog(null)}
          onDone={setContact}
        />
      ) : null}
    </>
  )
}

function PasswordRow({ hasPassword, onChange }: { hasPassword: boolean; onChange: () => void }): JSX.Element {
  return (
    <SettingRow label="Password" description={hasPassword ? 'Password sign-in is enabled.' : 'No password on this account.'}>
      <RowAction label="Change password" onClick={hasPassword ? onChange : undefined} />
    </SettingRow>
  )
}

function GoogleRow({
  user,
  onDisconnect,
}: {
  user: AuthUser | null
  onDisconnect: () => void
}): JSX.Element {
  const linked = Boolean(user?.linked_providers.some((p) => p.provider === 'google'))
  return (
    <SettingRow label="Google" description={googleDescription(user)}>
      <div className="flex items-center gap-2xs">
        <GoogleIcon className="h-4 w-4 flex-none" />
        {linked ? (
          <RowAction
            label="Disconnect"
            tone="danger"
            onClick={canUnlinkGoogle(user) ? onDisconnect : undefined}
          />
        ) : (
          <RowAction label="Connect" />
        )}
      </div>
    </SettingRow>
  )
}

function SignInGroup(): JSX.Element {
  const { user } = useAuth()
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const unlinkGoogleAction = useUnlinkGoogleAction()

  return (
    <>
      <SettingsGroup label="Sign-in">
        <EmailRow email={user?.email ?? '—'} verified={Boolean(user?.email_verified_at)} />
        <PhoneRow />
        <PasswordRow hasPassword={Boolean(user?.has_password)} onChange={() => setShowPasswordDialog(true)} />
        <GoogleRow user={user} onDisconnect={unlinkGoogleAction} />
      </SettingsGroup>
      {showPasswordDialog ? <PasswordChangeDialog onDismiss={() => setShowPasswordDialog(false)} /> : null}
    </>
  )
}

function useSessionsList(): {
  sessions: AuthSession[]
  loading: boolean
  reload: () => Promise<void>
} {
  const [sessions, setSessions] = useState<AuthSession[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async (): Promise<void> => {
    setLoading(true)
    try {
      setSessions((await listSessions()).sessions)
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  return { sessions, loading, reload }
}

function SessionRows({
  sessions,
  onRevoke,
}: {
  sessions: AuthSession[]
  onRevoke: (session: AuthSession) => void
}): JSX.Element {
  return (
    <>
      {sessions.map((session) => (
        <DataRow
          key={session.id}
          icon={MonitorIcon}
          title={sessionRowTitle(session)}
          badge={session.is_current ? <StatusPill tone="neutral" label="This device" /> : undefined}
          meta={sessionRowMeta(session)}
          actions={<RowAction label="Log out" tone="danger" onClick={() => onRevoke(session)} />}
        />
      ))}
    </>
  )
}

async function revokeOtherSession(
  sessionId: string,
  reload: () => Promise<void>,
  ask: ReturnType<typeof useSettingsConfirm>['ask'],
): Promise<void> {
  try {
    await revokeSession(sessionId)
    await reload()
  } catch (error) {
    ask({
      title: 'Could not log out session',
      body: getApiErrorMessage(error, 'The session could not be revoked. Try again.'),
      confirmLabel: 'OK',
      tone: 'accent',
      onConfirm: () => undefined,
    })
  }
}

function SessionsGroup(): JSX.Element {
  const { logout, logoutAll } = useAuth()
  const { ask } = useSettingsConfirm()
  const { closeSettings } = useSettingsModal()
  const { expanded, toggle } = useExpandable()
  const { sessions, loading, reload } = useSessionsList()
  const visible = expanded ? sessions : sessions.slice(0, SESSION_PREVIEW_COUNT)
  const hidden = Math.max(0, sessions.length - SESSION_PREVIEW_COUNT)

  const endThisDevice = async (everywhere: boolean): Promise<void> => {
    closeSettings()
    if (everywhere) await logoutAll()
    else await logout()
  }

  const onRevoke = (session: AuthSession): void => {
    if (session.is_current) {
      void endThisDevice(false)
      return
    }
    void revokeOtherSession(session.id, reload, ask)
  }

  return (
    <SettingsGroup label={`Sessions & devices · ${loading ? '…' : sessions.length}`}>
      <DataList isEmpty={!loading && sessions.length === 0} empty="No active sessions on this account.">
        <SessionRows sessions={visible} onRevoke={onRevoke} />
      </DataList>
      {hidden > 0 && (
        <SettingRow label={expanded ? 'Showing every session' : `${hidden} older sessions hidden`}>
          <RowAction label={expanded ? 'Show less' : 'View more'} onClick={toggle} />
        </SettingRow>
      )}
      <SettingRow label="Log out everywhere" description="Ends every session, including this one.">
        <RowAction
          label="Log out of all devices"
          tone="danger"
          onClick={() =>
            ask({
              title: 'Log out of all devices?',
              body: 'Every signed-in device is logged out, including this one — you will need to sign in again here.',
              confirmLabel: 'Log out everywhere',
              onConfirm: () => {
                void endThisDevice(true)
              },
            })
          }
        />
      </SettingRow>
    </SettingsGroup>
  )
}

function DeleteAccountBody(): JSX.Element {
  return (
    <>
      <p>This permanently deletes your chats, projects, files and memories.</p>
      <ul className="mt-2xs list-disc pl-md">
        <li>Your subscription is cancelled immediately.</li>
        <li>Unused top-up credits are forfeited and cannot be refunded.</li>
        <li>You have {ACCOUNT_DELETION_GRACE_DAYS} days to change your mind before deletion is permanent.</li>
      </ul>
    </>
  )
}

function DangerGroup(): JSX.Element {
  const { user } = useAuth()
  const { ask } = useSettingsConfirm()
  const email = user?.email ?? ''

  return (
    <SettingsGroup label="Danger zone" tone="danger">
      <SettingRow label="Delete account" description="Removes everything. Unused credits are forfeited.">
        <RowAction
          label="Delete account"
          tone="danger"
          onClick={() =>
            ask({
              title: 'Delete your account?',
              body: <DeleteAccountBody />,
              confirmLabel: 'Delete account',
              typeToConfirm: email || undefined,
              onConfirm: () => undefined,
            })
          }
        />
      </SettingRow>
    </SettingsGroup>
  )
}

export function AccountSection(): JSX.Element {
  return (
    <>
      <SignInGroup />
      <SessionsGroup />
      <DangerGroup />
    </>
  )
}
