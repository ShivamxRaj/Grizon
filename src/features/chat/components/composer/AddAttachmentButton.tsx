import type { JSX } from 'react'
import { PlusIcon } from '@/components/ui/icons'

interface AddAttachmentButtonProps {
  onClick: () => void
}

export function AddAttachmentButton({ onClick }: AddAttachmentButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add attachment"
      className="composer-add grid h-8.5 w-8.5 flex-none place-items-center self-center rounded-full text-muted transition-colors duration-short ease-out hover:bg-paper-3 hover:text-ink focus-visible:bg-paper-3"
    >
      <PlusIcon className="h-4.5 w-4.5" />
    </button>
  )
}
