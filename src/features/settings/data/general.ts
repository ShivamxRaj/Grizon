export const APP_VERSION = 'v0.4.0'

/** Only language shipped today — both the interface and replies are English. */
export const SUPPORTED_LANGUAGE = 'English'

export const REGION_OPTIONS = [
  { value: 'in', label: 'India' },
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'eu', label: 'European Union' },
]

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata · GMT+5:30' },
  { value: 'Europe/London', label: 'Europe/London · GMT+1' },
  { value: 'America/New_York', label: 'America/New_York · GMT−4' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo · GMT+9' },
]

export interface NotificationSetting {
  id: string
  label: string
  description: string
  defaultOn: boolean
  /** Security mail can't be switched off — the reason is shown to the user. */
  lockedReason?: string
}

export const EMAIL_NOTIFICATIONS: NotificationSetting[] = [
  { id: 'product', label: 'Product updates', description: 'New agents, features and changes worth knowing about.', defaultOn: true },
  { id: 'usage-80', label: 'Usage at 80%', description: 'A heads-up before your credits run low.', defaultOn: true },
  { id: 'usage-100', label: 'Credits exhausted', description: 'Sent the moment new messages stop working.', defaultOn: true },
  { id: 'receipts', label: 'Billing receipts', description: 'Payment confirmations, top-ups and failed charges.', defaultOn: true },
  { id: 'security', label: 'Security alerts', description: 'New sign-ins, password and email changes.', defaultOn: true, lockedReason: 'Always on — these protect your account.' },
]

export const INAPP_NOTIFICATIONS: NotificationSetting[] = [
  { id: 'long-response', label: 'Long response finished', description: 'When a reply completes after you have switched away.', defaultOn: true },
  { id: 'file-ready', label: 'File processing done', description: 'When an upload finishes indexing in Drive.', defaultOn: false },
]

/** Sessions shown before the list collapses behind "View more". */
export const SESSION_PREVIEW_COUNT = 3
