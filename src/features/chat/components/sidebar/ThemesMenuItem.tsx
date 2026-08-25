import { useRef, type JSX } from 'react'
import { CheckIcon, ChevronRightIcon, ThemesIcon } from '@/components/ui/icons'
import { useTheme, type ThemeMode } from '@/features/theme/useTheme'
import { SettingsFlyout } from './SettingsFlyout'
import { SettingsMenuItem } from './SettingsMenuItem'

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
]

interface ThemesMenuItemProps {
  open: boolean
  onToggle: () => void
}

export function ThemesMenuItem({ open, onToggle }: ThemesMenuItemProps): JSX.Element {
  const { mode, setMode } = useTheme()
  const triggerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={triggerRef} className="relative">
      <SettingsMenuItem
        icon={ThemesIcon}
        label="Themes"
        hasPopup
        expanded={open}
        onClick={onToggle}
        trailing={<ChevronRightIcon className="chat-settings-chev h-3.5 w-3.5 flex-none" />}
      />
      {open && (
        <SettingsFlyout label="Themes" anchorRef={triggerRef}>
          {THEME_OPTIONS.map((option) => (
            <SettingsMenuItem
              key={option.mode}
              label={option.label}
              role="menuitemradio"
              checked={mode === option.mode}
              className="chat-theme-option"
              onClick={() => setMode(option.mode)}
              trailing={<CheckIcon className="chat-theme-check h-[15px] w-[15px] flex-none" />}
            />
          ))}
        </SettingsFlyout>
      )}
    </div>
  )
}
