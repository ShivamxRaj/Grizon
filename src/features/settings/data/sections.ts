import type { JSX, SVGProps } from 'react'
import {
  GearIcon,
  UserIcon,
  SlidersIcon,
  MemoryIcon,
  ShieldIcon,
  CreditCardIcon,
  ChartBarIcon,
} from '@/components/ui/icons'

export type SettingsSectionId =
  | 'general'
  | 'account'
  | 'personalization'
  | 'memory'
  | 'privacy'
  | 'billing'
  | 'usage'

export interface SettingsSection {
  id: SettingsSectionId
  /** Rail + header label. Kept short so it never wraps to two lines on mobile. */
  label: string
  /** One-line statement of what the section is for. Shown under the title and in the mobile list. */
  purpose: string
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'general',
    label: 'General',
    purpose: 'The basics — how Grizon looks, speaks and reaches you.',
    icon: GearIcon,
  },
  {
    id: 'account',
    label: 'Account',
    purpose: 'Your credentials, your devices, and the way out.',
    icon: UserIcon,
  },
  {
    id: 'personalization',
    label: 'Personalization',
    purpose: 'How Grizon writes, and what it should know about you.',
    icon: SlidersIcon,
  },
  {
    id: 'memory',
    label: 'Memory',
    purpose: 'What Grizon remembers about you — and how to change it.',
    icon: MemoryIcon,
  },
  {
    id: 'privacy',
    label: 'Data & Privacy',
    purpose: 'Retention, portability and deletion.',
    icon: ShieldIcon,
  },
  {
    id: 'billing',
    label: 'Billing',
    purpose: 'What you pay, what you hold, and how to buy more.',
    icon: CreditCardIcon,
  },
  {
    id: 'usage',
    label: 'Usage',
    purpose: "What you've used this period, and when you'll run out.",
    icon: ChartBarIcon,
  },
]

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = 'general'
