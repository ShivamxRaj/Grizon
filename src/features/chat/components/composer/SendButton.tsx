import type { JSX } from 'react'
import { ArrowRightIcon } from '@/components/ui/icons'

interface SendButtonProps {
  disabled: boolean
}

export function SendButton({ disabled }: SendButtonProps): JSX.Element {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-label="Send message"
      className="grid h-9.5 w-9.5 flex-none place-items-center rounded-full bg-accent-deep text-accent-ink transition-[background-color,transform,opacity] duration-short ease-out hover:not-disabled:-translate-y-px hover:not-disabled:bg-accent active:not-disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ArrowRightIcon className="h-4.25 w-4.25 -rotate-90" />
    </button>
  )
}
