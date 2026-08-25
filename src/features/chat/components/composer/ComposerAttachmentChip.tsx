import type { JSX } from 'react'
import { CloseIcon, FileTextIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'
import { Spinner } from '@/features/auth/components/Spinner'
import type { ComposerAttachment } from './types'

interface ComposerAttachmentChipProps {
  attachment: ComposerAttachment
  onRemove: (id: string) => void
}

export function ComposerAttachmentChip({ attachment, onRemove }: ComposerAttachmentChipProps): JSX.Element {
  const { id, name, size, status, progress, errorLabel } = attachment
  const isError = status === 'error'

  return (
    <li
      data-status={status}
      className={cn(
        'chat-composer-chip relative flex max-w-[16rem] items-center gap-2xs overflow-hidden rounded-sm border py-3xs pl-2xs pr-3xs text-xs',
        isError ? 'border-danger/40 bg-danger/8' : 'border-rule bg-paper-2',
      )}
    >
      <ChipIcon status={status} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-medium text-ink">{name}</span>
        <span className="font-mono text-[0.65rem] text-muted">{isError ? errorLabel : status === 'uploading' ? 'Uploading…' : size}</span>
      </span>
      <button
        type="button"
        onClick={() => onRemove(id)}
        aria-label={`Remove ${name}`}
        className="grid h-5 w-5 flex-none place-items-center rounded-full text-muted transition-colors duration-short ease-out hover:bg-paper-3 hover:text-ink focus-visible:bg-paper-3"
      >
        <CloseIcon className="h-3 w-3" />
      </button>
      {status === 'uploading' && (
        <span className="chat-composer-chip-bar absolute bottom-0 left-0 bg-accent" style={{ width: `${progress}%` }} />
      )}
    </li>
  )
}

function ChipIcon({ status }: { status: ComposerAttachment['status'] }): JSX.Element {
  if (status === 'uploading') return <Spinner className="h-3.5 w-3.5 flex-none text-accent-text" />
  const tone = status === 'error' ? 'text-danger' : 'text-muted'
  return <FileTextIcon className={cn('h-3.5 w-3.5 flex-none', tone)} />
}
