import type { JSX, ReactNode, SVGProps } from 'react'

type IconComponent = (props: SVGProps<SVGSVGElement>) => JSX.Element

export interface SettingsMenuItemProps {
  icon?: IconComponent
  label: string
  href?: string
  trailing?: ReactNode
  onClick?: () => void
  role?: 'menuitem' | 'menuitemradio'
  checked?: boolean
  hasPopup?: boolean
  expanded?: boolean
  className?: string
}

const ITEM_CLASSES =
  'chat-settings-item flex w-full items-center gap-2xs rounded-sm px-[0.6rem] py-2 text-left text-sm text-ink-2 transition-[background-color,color] duration-short ease-out hover:bg-[var(--sb-hover)] hover:text-ink focus-visible:bg-[var(--sb-hover)] focus-visible:text-ink'

function ItemContent({ icon: Icon, label, trailing }: Pick<SettingsMenuItemProps, 'icon' | 'label' | 'trailing'>): JSX.Element {
  return (
    <>
      {Icon ? <Icon className="h-[17px] w-[17px] flex-none" /> : null}
      <span className="flex-1 truncate">{label}</span>
      {trailing}
    </>
  )
}

export function SettingsMenuItem(props: SettingsMenuItemProps): JSX.Element {
  const { href, onClick, role = 'menuitem', checked, hasPopup, expanded, className } = props
  const classes = className ? `${ITEM_CLASSES} ${className}` : ITEM_CLASSES
  const content = <ItemContent icon={props.icon} label={props.label} trailing={props.trailing} />

  if (href) {
    return (
      <a href={href} role={role} className={classes}>
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      aria-haspopup={hasPopup || undefined}
      aria-expanded={hasPopup ? expanded : undefined}
      onClick={onClick}
      className={classes}
    >
      {content}
    </button>
  )
}
