import { useRef, type JSX } from 'react'
import { ChevronRightIcon, ExternalLinkIcon, LearnMoreIcon } from '@/components/ui/icons'
import { STATIC_PRIVACY_URL, STATIC_TERMS_URL } from '@/constants/routes'
import { SettingsFlyout } from './SettingsFlyout'
import { SettingsMenuItem } from './SettingsMenuItem'

const LEARN_MORE_LINKS: { label: string; href?: string }[] = [
  { label: 'Privacy policy', href: STATIC_PRIVACY_URL },
  { label: 'Terms and conditions', href: STATIC_TERMS_URL },
  { label: 'About Grizon AI' },
  { label: 'Usage policy' },
]

interface LearnMoreMenuItemProps {
  open: boolean
  onToggle: () => void
}

function ExtIcon(): JSX.Element {
  return <ExternalLinkIcon className="chat-settings-ext h-[13px] w-[13px] flex-none" />
}

export function LearnMoreMenuItem({ open, onToggle }: LearnMoreMenuItemProps): JSX.Element {
  const triggerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={triggerRef} className="relative">
      <SettingsMenuItem
        icon={LearnMoreIcon}
        label="Learn more"
        hasPopup
        expanded={open}
        onClick={onToggle}
        trailing={<ChevronRightIcon className="chat-settings-chev h-3.5 w-3.5 flex-none" />}
      />
      {open && (
        <SettingsFlyout label="Learn more" anchorRef={triggerRef}>
          {LEARN_MORE_LINKS.map((item) => (
            <SettingsMenuItem key={item.label} label={item.label} href={item.href} trailing={<ExtIcon />} />
          ))}
        </SettingsFlyout>
      )}
    </div>
  )
}
