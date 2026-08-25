import type { AuthSession } from '@/features/auth/types'

const ACTIVE_NOW_MS = 5 * 60 * 1000

export function formatSessionLocation(
  city: string | null,
  region: string | null,
  country: string | null,
): string {
  const parts = [city, region, country].filter((part): part is string => Boolean(part?.trim()))
  return parts.length > 0 ? parts.join(', ') : 'Unknown location'
}

export function formatSessionDate(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatSessionUpdated(session: AuthSession): string {
  if (session.is_current) {
    const last = session.last_used_at ? new Date(session.last_used_at).getTime() : Date.now()
    if (!Number.isNaN(last) && Date.now() - last < ACTIVE_NOW_MS) return 'Active now'
  }
  return formatSessionDate(session.last_used_at)
}

export function sessionRowTitle(session: AuthSession): string {
  const device = session.os?.trim() || session.device_name
  const browser = session.browser?.trim() || 'Browser'
  return `${device} · ${browser}`
}

export function sessionRowMeta(session: AuthSession): string {
  const location = formatSessionLocation(session.city, session.region, session.country)
  return `${location} · added ${formatSessionDate(session.issued_at)} · ${formatSessionUpdated(session)}`
}
