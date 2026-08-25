import type { JSX } from 'react'
import type { ComposerAttachment } from './types'
import { ComposerAttachmentChip } from './ComposerAttachmentChip'

interface ComposerAttachmentListProps {
  attachments: ComposerAttachment[]
  onRemove: (id: string) => void
}

export function ComposerAttachmentList({ attachments, onRemove }: ComposerAttachmentListProps): JSX.Element | null {
  if (attachments.length === 0) return null

  return (
    <ul aria-label="Attachments" className="composer-tray flex flex-wrap gap-2xs">
      {attachments.map((attachment) => (
        <ComposerAttachmentChip key={attachment.id} attachment={attachment} onRemove={onRemove} />
      ))}
    </ul>
  )
}
