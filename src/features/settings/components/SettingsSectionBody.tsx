import type { JSX } from 'react'
import type { SettingsSectionId } from '../data/sections'
import { GeneralSection } from '../sections/GeneralSection'
import { AccountSection } from '../sections/AccountSection'
import { PersonalizationSection } from '../sections/PersonalizationSection'
import { MemorySection } from '../sections/MemorySection'
import { PrivacySection } from '../sections/PrivacySection'
import { BillingSection } from '../sections/BillingSection'
import { UsageSection } from '../sections/UsageSection'

export function SettingsSectionBody({ id }: { id: SettingsSectionId }): JSX.Element {
  switch (id) {
    case 'account':
      return <AccountSection />
    case 'personalization':
      return <PersonalizationSection />
    case 'memory':
      return <MemorySection />
    case 'privacy':
      return <PrivacySection />
    case 'billing':
      return <BillingSection />
    case 'usage':
      return <UsageSection />
    default:
      return <GeneralSection />
  }
}
